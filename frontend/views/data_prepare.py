from main import app, db
from common.other import *
from flask import request, send_file
from models.basic import *
from models.data_prepare import DataPrepare, DataTemplate
from models.llm_prompt import Prompt
from common.excel_handler import get_excel_sheets, get_excel_headers, write_data_to_excel, write_multi_sheet_data_to_excel
from views.llm import llm_common_ask
from views.login import require_login


@app.route('/api/data_prepare/get', methods=["POST"])
@require_login
def data_prepare_get():
    project_id = request.json.get('project_id', None)
    query = db.session.query(DataTemplate).filter(DataTemplate.project_id == project_id)
    result = query.order_by(-DataTemplate.id).all()
    rtn = [{**data.as_dict(),
            # 'columns_demand': json.loads(data.columns_demand) if data.columns_demand else [],
            # 'generated_data': json.loads(data.generated_data) if data.generated_data else [],
            # 'generated_data_abnormal': json.loads(data.generated_data_abnormal) if data.generated_data_abnormal else []
            } for data in result]
    return success(rtn)


@app.route('/api/data_prepare/get_detail', methods=["POST"])
def data_prepare_get_detail():
    template_id = request.json.get('template_id', None)
    data_prepare_id = request.json.get('data_prepare_id', None)
    if template_id:
        rows = db.session.query(DataPrepare).filter(DataPrepare.template_id == template_id).all()
        rtn = [{**row.as_dict(),
                'column_length': 5,
               'columns_demand': json.loads(row.columns_demand) if row.columns_demand else [],
               'generated_data': json.loads(row.generated_data) if row.generated_data else [],
               'generated_data_abnormal': json.loads(row.generated_data_abnormal) if row.generated_data_abnormal else [],
               } for row in rows]
        return success(rtn)
    elif data_prepare_id:
        row = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
        rtn = {**row.as_dict(),
                'column_length': 5,
               'columns_demand': json.loads(row.columns_demand) if row.columns_demand else [],
               'generated_data': json.loads(row.generated_data) if row.generated_data else [],
               'generated_data_abnormal': json.loads(row.generated_data_abnormal) if row.generated_data_abnormal else [],
               }
        return success(rtn)
    else:
        return error('至少要有template_id或者data_prepare_id')


@app.route('/api/data_prepare/add', methods=["POST"])
def data_prepare_add():
    template_id = request.json.get('template_id', None)
    project_id = request.json.get('project_id', None)
    file_name = request.json.get('file_name', None)
    oss_path = request.json.get('oss_path', None)
    if template_id:  # 走修改流程
        dp = db.session.query(DataTemplate).filter(DataTemplate.id == template_id).first()
        if not dp:
            return error('未找到对应id')
        dp.project_id = project_id
        dp.oss_path = oss_path
        dp.file_name = file_name
        dp.creator = request.cookies.get('username', None)
    else:
        dp = DataTemplate()
        dp.project_id = project_id
        dp.oss_path = oss_path
        dp.file_name = file_name
        dp.creator = request.cookies.get('username', None)
        db.session.add(dp)
    db.session.commit()
    return success()


@app.route('/api/data_prepare/add_sheet', methods=["POST"])
def data_prepare_add_sheet():
    data_prepare_id = request.json.get('data_prepare_id', None)
    template_id = request.json.get('template_id', None)
    sheet_name = request.json.get('sheet_name', None)
    header_row = request.json.get('header_row', None)
    data_row = request.json.get('data_row', None)
    rule_row = request.json.get('rule_row', None)
    if data_prepare_id:   # 走修改流程
        dp = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
        if not dp:
            return error('未找到对应id')
        dp.template_id = template_id
        dp.sheet_name = sheet_name
        dp.header_row = header_row
        dp.data_row = data_row
        dp.rule_row = rule_row
        dp.creator = request.cookies.get('username', None)
    else:
        dp = DataPrepare()
        dp.template_id = template_id
        dp.sheet_name = sheet_name
        dp.header_row = header_row
        dp.data_row = data_row
        dp.rule_row = rule_row
        dp.creator = request.cookies.get('username', None)
        db.session.add(dp)
    db.session.commit()
    return success()


@app.route('/api/data_prepare/delete', methods=["POST"])
def data_prepare_delete():
    template_id = request.json.get('template_id', None)
    template_row = db.session.query(DataTemplate).filter(DataTemplate.id == template_id).first()
    if not template_row:
        return error('未找到模板id')
    db.session.delete(template_row)
    tps = db.session.query(DataPrepare).filter(DataPrepare.template_id == template_id).all()
    if tps:
        for tp in tps:
            db.session.delete(tp)
    db.session.commit()
    return success()


@app.route('/api/data_prepare/delete_sheet', methods=["POST"])
def data_prepare_delete_sheet():
    data_prepare_id = request.json.get('data_prepare_id', None)
    data_prepare_id = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
    if not data_prepare_id:
        return error('未找到数据')
    db.session.delete(data_prepare_id)
    db.session.commit()
    return success()


@app.route('/api/data_prepare/get_sheets', methods=["POST"])
def data_prepare_get_sheets():
    file_path = request.json.get('file_path', None)
    try:
        return get_excel_sheets(file_path)
    except Exception as e:
        return error('解析excel异常，原因:{}'.format(e))


@app.route('/api/data_prepare/get_headers', methods=["POST"])
def data_prepare_get_headers():
    data_prepare_id = request.json.get('data_prepare_id', None)
    if not data_prepare_id:
        return error('没有data_prepare_id')
    data_prepare_row = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
    if not data_prepare_row:
        return error('未找到该id')
    template_row = db.session.query(DataTemplate).filter(DataTemplate.id == data_prepare_row.template_id).first()
    file_path = template_row.oss_path
    header_row = data_prepare_row.header_row
    rule_row = data_prepare_row.rule_row
    sheet_name = data_prepare_row.sheet_name
    try:
        return get_excel_headers(file_path, header_row, sheet_name, rule_row=rule_row)
    except Exception as e:
        return error('解析excel异常，原因:{}'.format(e))


@app.route('/api/data_prepare/save_columns_demand', methods=["POST"])
def data_prepare_save_columns_demand():
    data_prepare_id = request.json.get('data_prepare_id', None)
    columns_demand = request.json.get('columns_demand', None)
    if not data_prepare_id:
        return error('id为空')
    row = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
    if not row:
        return error('未获取到编号为:{}的数据'.format(data_prepare_id))
    row.columns_demand = json.dumps(columns_demand, ensure_ascii=False)
    db.session.commit()
    return success()


def get_required(target):
    if 'required' in target and target['required']:
        return '是'
    else:
        return '否'


def get_unique(target):
    if 'unique' in target and target['unique']:
        return '是'
    else:
        return '否'


def get_len(target):
    if 'len' in target:
        if 'symbol' in target['len'] and target['len']['symbol'] == 1:
            if 'num' in target['len'] and target['len']['num']:
                return '长度<={},'.format(target['len']['num'])
        elif 'symbol' in target['len'] and target['len']['symbol'] == 2:
            if 'num' in target['len'] and target['len']['num']:
                return '长度={},'.format(target['len']['num'])
    return ''


def get_logistic(target):
    if 'logistic' in target and target['logistic']:
        return target['logistic']
    else:
        return '根据字段字面意思生成数据'


@app.route('/api/data_prepare/generate_data', methods=["POST"])
def data_prepare_generate_data():
    chat_id = request.json.get('chat_id', None)
    prompt_id = request.json.get('prompt_id', None)
    data_type = request.json.get('data_type', 1)  # 1 正向  2 逆向
    other_demands = request.json.get('other_demands', None)
    columns_demand = request.json.get('columns_demand')
    if not columns_demand:
        return error("字段要求为空")
    if not prompt_id:
        prompt_row = db.session.query(Prompt).filter(Prompt.role == 5, Prompt.project_id == 0).first()
    else:
        prompt_row = db.session.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt_row:
        return error('未找到prompt模板')
    prompt_content = prompt_row.content

    complete_prompt = prompt_content.replace(
        '{columns_demand}', '\n'.join(
            ['字段名："{}",是否必填:{},是否唯一:{}, 逻辑："{}"'.format(x['name'], get_required(x), get_unique(x),
                                                        get_len(x) + get_logistic(x)) for x in columns_demand]))
    if other_demands:
        complete_prompt = complete_prompt.replace('{other_demands}', other_demands)
    else:
        if data_type == 2:
            complete_prompt = complete_prompt.replace('{other_demands}', '现在要测试异常碱处理能力，请生成各种异常数据，例如：与逻辑不符，必填字段为空，数据类型不正确等等')
        else:
            complete_prompt = complete_prompt.replace('{other_demands}', '基于边界值、等价类、正交试验等等方法生成覆盖各种场景的测试数据')
    return llm_common_ask(complete_prompt, chat_id)


@app.route('/api/data_prepare/data_recommend_prepare', methods=["POST"])
def data_prepare_data_recommend_prepare():
    chat_id = request.json.get('chat_id', None)
    prompt_id = request.json.get('prompt_id', None)
    columns_demand = request.json.get('columns_demand')
    if not columns_demand:
        return error("字段要求为空")
    if not prompt_id:
        prompt_row = db.session.query(Prompt).filter(Prompt.role == 7, Prompt.project_id == 0).first()
    else:
        prompt_row = db.session.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt_row:
        return error('未找到prompt模板')
    prompt_content = prompt_row.content

    complete_prompt = prompt_content.replace(
        '{columns_demand}', '\n'.join(
            ['字段名："{}",是否必填:{},是否唯一:{}, 逻辑："{}"'.format(x['name'], get_required(x), get_unique(x),
                                                        get_len(x) + get_logistic(x)) for x in columns_demand]))
    return llm_common_ask(complete_prompt, chat_id)


@app.route('/api/data_prepare/save_data', methods=["POST"])
def data_prepare_save_data():
    is_add = request.json.get('is_add', None)
    data = request.json.get('data', None)
    data_prepare_id = request.json.get('data_prepare_id', None)
    data_type = request.json.get('data_type', None)
    if not data_prepare_id:
        return error('没有找到data prepare id:{}'.format(data_prepare_id))
    if not data:
        return error('请传入保存的数据')
    if not data_type:
        return error('请传入data_type')
    data_prepare_row = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
    if not data_prepare_row:
        return error('未找到数据准备数据')
    if is_add:
        # if not data_prepare_row.generated_data:
        #     return error('没有已经保存的数据,无法追加')
        base_data = json.loads(data_prepare_row.generated_data) if data_type == 1 else json.loads(
            data_prepare_row.generated_data_abnormal)
        base_data.extend(data)
    else:
        base_data = data
    # 对key字段进行重新排序
    for index, row in enumerate(base_data):
        row['key'] = index + 1
    if data_type == 1:
        data_prepare_row.generated_data = json.dumps(base_data, ensure_ascii=False)
    else:
        data_prepare_row.generated_data_abnormal = json.dumps(base_data, ensure_ascii=False)
    db.session.commit()
    return success()


@app.route('/api/data_prepare/deleteGenData', methods=["POST"])
def data_prepare_delete_gen_data():
    data_prepare_id = request.json.get('data_prepare_id', None)
    key = request.json.get('key', None)
    data_type = request.json.get('data_type', None)
    if not data_type:
        return error('无data type')
    data_prepare_row = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
    if not data_prepare_row:
        return error('未找到id为:{}的数据准备数据'.format(data_prepare_id))
    if data_type == 1:
        gernerated_data = data_prepare_row.generated_data
        if not gernerated_data:
            return error('无生成结果，无法删除')
        gernerated_data = json.loads(gernerated_data)
        data_prepare_row.generated_data = json.dumps([x for x in gernerated_data if x['key'] != key],
                                                     ensure_ascii=False)
    else:
        gernerated_data = data_prepare_row.generated_data_abnormal
        if not gernerated_data:
            return error('无生成结果，无法删除')
        gernerated_data = json.loads(gernerated_data)
        data_prepare_row.generated_data_abnormal = json.dumps([x for x in gernerated_data if x['key'] != key],
                                                              ensure_ascii=False)
    db.session.commit()
    return success()


@app.route('/api/data_prepare/download', methods=["POST"])
def data_prepare_download():
    data_prepare_id = request.json.get('data_prepare_id', None)
    data_type = request.json.get('data_type', None)
    if not data_type:
        return error('没有data_type')
    row = db.session.query(DataPrepare).filter(DataPrepare.id == data_prepare_id).first()
    template_row = db.session.query(DataTemplate).filter(DataTemplate.id == row.template_id).first()
    download_data = row.generated_data if data_type == 1 else row.generated_data_abnormal
    wb = write_data_to_excel(template_row.oss_path, json.loads(download_data), row.header_row, row.data_row, row.sheet_name)
    from io import BytesIO
    file_obj = BytesIO()
    wb.save(file_obj)
    # wb.save('text.xlsx')
    file_obj.seek(0)
    file_name = 'data-{}.xlsx'.format(datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
    return send_file(file_obj, download_name=file_name)


@app.route('/api/data_prepare/download_all', methods=["POST"])
def data_prepare_download_all():
    template_id = request.json.get('template_id', None)
    data_type = request.json.get('data_type', None)
    if not data_type:
        return error('没有data_type')
    template_row = db.session.query(DataTemplate).filter(DataTemplate.id == template_id).first()
    rows = db.session.query(DataPrepare).filter(DataPrepare.template_id == template_id).all()
    wb = write_multi_sheet_data_to_excel(template_row.oss_path, rows, data_type)
    from io import BytesIO
    file_obj = BytesIO()
    wb.save(file_obj)
    # wb.save('text.xlsx')
    file_obj.seek(0)
    file_name = 'data-{}.xlsx'.format(datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
    return send_file(file_obj, download_name=file_name)