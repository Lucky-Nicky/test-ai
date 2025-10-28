import json
import datetime
from main import app, db
from common.other import *
from flask import request, Response
from models.basic import *
from models.llm import LargeLanguageModel, Chat, ChatDetail
from utils import ai_model_handler
from llm_parser import llm_parser
from views.login import require_login


@app.route('/api/llm/get', methods=["POST"])
@require_login
def llm_get():
    rows = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.status == 0).all()
    # 定义想要保留的属性
    data=[row.as_dict() for row in rows]
    keys_to_keep = ['id', 'name', 'company', 'remark', 'status', 'default', 'create_time']

    # 创建一个新的列表，只包含需要的属性
    filtered_data = [{key: item[key] for key in keys_to_keep} for item in data]

    # 输出结果
    # print(filtered_data)
    return success(filtered_data)


@app.route('/api/llm/create_chat', methods=["POST"])
def llm_create_chat():
    project_id = request.json.get('project_id', None)
    llm_id = request.json.get('llm_id', None)
    if not llm_id:  # 使用默认的llm
        default_llm = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.status == 0,
                                                                  LargeLanguageModel.default == 1).first()
        if not default_llm:
            return error('未配置默认语言模型')
        llm_id = default_llm.id
    if not project_id:
        return error('没有项目ID')
    chat = Chat()
    chat.project_id = project_id
    chat.llm_id = llm_id
    chat.creator = request.cookies.get('username', None)
    db.session.add(chat)
    db.session.commit()
    return success({
        'id': chat.id
    })


@app.route('/api/llm/ask', methods=["POST"])
def llm_ask():
    chat_id = request.json.get('chat_id', None)
    question = request.json.get('question', None)
    history_limit = request.json.get('history_limit', None)
    chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
    if not chat_row:
        return error('未找到chat id:{}'.format(chat_id))
    llm_id = chat_row.llm_id
    llm_row = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.id == llm_id).first()
    if not llm_row:
        return error('未找到llm id:{}的大模型'.format(llm_id))
    if llm_row.request_mode=="http":
        url=llm_row.base_url
        api_key=llm_row.api_key
        return ai_model_handler.OpenAIModel.ask(prompt=question, chat_id=chat_id,
            model_name=llm_row.name,api_key=api_key,url=url,history_limit=history_limit)
    else:

        if llm_row.company == '百度':
        # if llm_row.company == 'openAI':
        #     return ai_model_handler.OpenAIModel.ask(prompt=question, chat_id=chat_id, model_name=llm_row.name,
        #                                             history_limit=history_limit)
        # elif llm_row.company == 'openAI2':
        #     return ai_model_handler.OpenAIModel_4o.ask(prompt=question, chat_id=chat_id, model_name=llm_row.name,
        #                                             history_limit=history_limit)
        # elif llm_row.company == '阿里':
        #     return ai_model_handler.TongYiAIModel.ask(prompt=question,chat_id=chat_id,model_name=llm_row.name,history_limit=history_limit)
        # elif llm_row.company == '百度':
            return ai_model_handler.QianFanAIModel.ask(prompt=question, chat_id=chat_id, model_name=llm_row.name,
                                                   history_limit=history_limit)
        else:
            return error('暂时不支持的语言模型')


@app.route('/api/llm/extract_json', methods=["POST"])
def llm_extract_json():
    answer = request.json.get('answer', None)
    result, flag = llm_parser.json_parser(answer)
    if not result:
        return error('提取json出错，请查看AI返回的数据或者重试')
    return success(result, is_list=flag)


@app.route('/api/llm/chat_info', methods=["POST"])
def llm_chat_info():
    chat_id = request.json.get('chat_id', None)
    if not chat_id:
        return error('请传入chat id')
    chat_row = db.session.query(Chat, LargeLanguageModel.name).join(
        LargeLanguageModel, Chat.llm_id == LargeLanguageModel.id).filter(Chat.id == chat_id).first()
    if not chat_row:
        return error('未找到chat id:{}的信息'.format(chat_id))
    chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(ChatDetail.id).all()
    detail_rows = [
        {
            **x.as_dict(),
            'content': json.loads(x.content)
        }
        for x in chat_detail_rows
    ]
    if chat_detail_rows and chat_detail_rows[-1].role == 'HUMAN':
        detail_rows.append({
            **chat_detail_rows[-1].as_dict(),
            'role': 'AI',
            'content': {'answer': 'Oops, 上一次获取AI回答失败了'},
            'fail': True
        })

    chat_info, llm_name = chat_row
    return success({
        **chat_info.as_dict(),
        'llm_name': llm_name,
        'detail': detail_rows
    })


@app.route('/api/llm/chat_history', methods=["POST"])
def llm_chat_history():
    project_id = request.json.get('project_id', None)
    chat_rows = db.session.query(Chat).filter(Chat.project_id == project_id).order_by(-Chat.id).limit(20)

    def get_question(chat_id):
        chat_detail_row = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id,
                                                              ChatDetail.role == 'HUMAN').order_by(
            ChatDetail.id).first()
        if not chat_detail_row:
            return '-'
        return json.loads(chat_detail_row.content)['question'].strip()[:20]

    return success([
        {**x.as_dict(), 'title': get_question(x.id)} for x in chat_rows
    ])


@app.route('/api/llm/chat_detail_info', methods=["POST"])
def llm_chat_detail_info():
    chat_id = request.json.get('chat_id', None)
    chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).order_by(ChatDetail.id).all()
    if not chat_detail_rows:
        return success([])
    return success([
        {
            **x.as_dict(),
            'content': json.loads(x.content)
        }
        for x in chat_detail_rows
    ])


@app.route('/api/llm/save_chat_detail', methods=["POST"])
def llm_chat_save_detail_info():
    chat_id = request.json.get('chat_id', None)
    role = request.json.get('role', None)
    content = request.json.get('content', None)
    if not chat_id or not role or not content:
        return error('信息不全，保存失败')
    save_chat_detail(chat_id, role, content)
    return success()


@app.route('/api/llm/chat/delete', methods=["POST"])
def llm_chat_delete():
    chat_id = request.json.get('chat_id', None)
    chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
    if not chat_row:
        return error('未找到指定chat id')
    chat_detail_rows = db.session.query(ChatDetail).filter(ChatDetail.chat_id == chat_id).all()
    if chat_detail_rows:
        for detail_row in chat_detail_rows:
            db.session.delete(detail_row)
    db.session.delete(chat_row)
    db.session.commit()
    return success()


def llm_common_ask(question, chat_id):
    chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
    if not chat_row:
        return error('未找到chat id:{}'.format(chat_id))
    llm_id = chat_row.llm_id
    llm_row = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.id == llm_id).first()
    if not llm_row:
        return error('未找到llm id:{}的大模型'.format(llm_id))
    if llm_row.request_mode == "http":
        url = llm_row.base_url
        api_key = llm_row.api_key
        return ai_model_handler.OpenAIModel.ask(prompt=question, chat_id=chat_id,
                                                model_name=llm_row.name, api_key=api_key, url=url,
                                                )
    else:


    # if llm_row.company == 'openAI':
    #     return ai_model_handler.OpenAIModel.ask(prompt=question, chat_id=chat_id, model_name=llm_row.name)
    # elif llm_row.company == 'openAI2':
    #     return  ai_model_handler.OpenAIModel_4o.ask(prompt=question, chat_id=chat_id, model_name=llm_row.name)
    # elif llm_row.company == '阿里':
    #     return ai_model_handler.TongYiAIModel.ask(prompt=question,chat_id=chat_id,model_name=llm_row.name)
    # elif llm_row.company == '百度':
        if llm_row.company == '百度':
            return ai_model_handler.QianFanAIModel.ask(prompt=question, chat_id=chat_id, model_name=llm_row.name)
        else:
            return error('暂时不支持的语言模型')


@app.route('/api/llm/stream_ask', methods=["POST"])
def llm_stream_ask():
    question = request.json.get('question', None)
    chat_id = request.json.get('chat_id', None)
    is_retry = request.json.get('is_retry', False)
    chat_row = db.session.query(Chat).filter(Chat.id == chat_id).first()
    if not chat_row:
        return error('未找到chat id:{}'.format(chat_id))
    llm_id = chat_row.llm_id
    llm_row = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.id == llm_id).first()
    if llm_row.request_mode=="http":
        url=llm_row.base_url
        api_key=llm_row.api_key
        response= ai_model_handler.OpenAIModel.stream_ask(prompt=question, chat_id=chat_id,
            model_name=llm_row.name,api_key=api_key,url=url,is_retry=is_retry)
    # if llm_row.company == 'openAI':
    #     response = ai_model_handler.OpenAIModel.stream_ask(prompt=question, chat_id=chat_id, model_name=llm_row.name,
    #                                                        is_retry=is_retry)
    # elif llm_row.company == 'openAI2':
    #     response = ai_model_handler.OpenAIModel_4o.stream_ask(prompt=question, chat_id=chat_id, model_name=llm_row.name,
    #                                                        is_retry=is_retry)
    # elif llm_row.company == '阿里':
    #     response =ai_model_handler.TongYiAIModel.stream_ask(prompt=question,chat_id=chat_id,model_name=llm_row.name)
    else:
        if llm_row.company == '百度':
            response = ai_model_handler.QianFanAIModel.stream_ask(prompt=question, chat_id=chat_id, model_name=llm_row.name,
                                                              is_retry=is_retry)
        else:
            return error('暂时不支持的语言模型')
    headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
    }
    # if llm_row.company != '阿里':
    if True:
        def generator():
            for line in response.iter_lines():
                # print(line.decode('utf-8') + '\n')
                yield line.decode('utf-8') + '\n'
                time.sleep(0.01)
        return Response(generator(), mimetype="application/x-ndjson", headers=headers)

    # else:
    #     def generator():
    #         for resut in response:
    #             print(resut.output.choices[0].message.content)
    #             yield resut.output.choices[0].message.content
    #             time.sleep(0.01)
    #
    #     return Response(generator(), mimetype="application/x-ndjson", headers=headers)





@app.route('/api/llm/switch_default', methods=["POST"])
def llm_switch_default():
    llm_id = request.json.get('llm_id', None)
    if not llm_id:
        return error('未找到llm id')
    # 先将设置为默认的还原
    current_default_row = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.default == 1).first()
    current_default_row.default = 0
    llm_row = db.session.query(LargeLanguageModel).filter(LargeLanguageModel.id == llm_id).first()
    if not llm_row:
        return error('找到不id为：{}的模型'.format(llm_id))
    llm_row.default = 1
    db.session.commit()
    return success()
