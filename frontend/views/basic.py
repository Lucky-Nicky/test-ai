import json
from main import app, db
from common.other import success, error
from models.basic import Projects, Developers, WikiUploadRecord
from flask import request
from common.loader import pdf_loader
from models.llm_prompt import Prompt
from utils.confluence import Wiki
from views import cases, prds, sprint, nodes, test_plan, llm_prompt, llm, data_prepare, sprint_statics,review_cases_ms, review_prd, api_cases



@app.route('/api/projects', methods=["GET"])
def get_projects():
    rows = db.session.query(Projects).filter(Projects.parent_id == None).all()
    return success([row.as_dict() for row in rows])


def get_tester(tester_ids):
    testers = []
    if not tester_ids:
        return testers
    tester_id_list = tester_ids.split(',')
    for tester_id in tester_id_list:
        row = db.session.query(Developers).filter(Developers.id == int(tester_id)).first()
        if not row:
            continue
        testers.append(row.as_dict())
    return testers


@app.route('/api/projects_detail', methods=["POST"])
def get_projects_detail():
    project_id = request.json.get('project_id', None)
    if not project_id:
        return error('没有project id')
    row = db.session.query(Projects).filter(Projects.id == project_id).first()
    if not row:
        return error('没有找到该项目')
    return success({
        **row.as_dict(),
        'tester': get_tester(row.tester)
    })


@app.route('/api/developers', methods=["POST"])
def get_developers():
    role = request.json.get('role', None)
    query = db.session.query(Developers).filter(Developers.status == 0)
    if role:
        query = query.filter(Developers.role == role)
    rows = query.all()
    return success([row.as_dict() for row in rows])


@app.route('/api/sub_projects', methods=["POST"])
def get_sub_projects():
    project_id = request.json.get('project_id', None)
    if not project_id:
        return success([])
    rows = db.session.query(Projects).filter(Projects.parent_id == project_id).all()
    return success([row.as_dict() for row in rows])


@app.route('/api/upload', methods=["PUT"])
def upload():
    file_name = request.json.get('file_name', None)
    file = request.json.get('file', None)
    # print(file_name)
    # print(file)
    if not file_name or not file:
        return error('未找到上传文件')
    from utils.upload_file import upload
    rtn = upload(file_name, file)
    return success({'url': rtn})


@app.route('/api/basic/get_pdf_pages', methods=["POST"])
def basic_get_pdf_pages():
    url = request.json.get('url')
    file_type = request.json.get('file_type')
    if file_type != 'pdf':
        return error('暂只支持pdf文件')
    return success([x.page_content for x in pdf_loader(url)])


@app.route('/api/basic/ask_answer', methods=["POST"])
def basic_ask_answer():
    pages = request.json.get('pages', None)
    question = request.json.get('question', None)
    prompt_id = request.json.get('prompt_id', None)
    chat_id = request.json.get('chat_id', None)
    if not pages:
        return error('没有发现原始文档')
    if not question:
        return error('没有发现问题')
    if not prompt_id:
        prompt_row = db.session.query(Prompt).filter(Prompt.role == 3).first()
    else:
        prompt_row = db.session.query(Prompt).filter(Prompt.id == prompt_id).first()

    if not prompt_row:
        return error('未找到prompt模板')
    prompt_content = prompt_row.content
    complete_prompt = prompt_content.replace('{question}', question)
    complete_prompt = complete_prompt.replace('{pages}', '\n'.join(pages))
    return llm.llm_common_ask(complete_prompt, chat_id)


@app.route('/api/basic/wiki_space_get', methods=["POST"])
def basic_wiki_space_get():
    wiki = Wiki()
    return success([
        {'id': x['id'], 'key': x['key'], 'name': x['name']} for x in wiki.get_spaces(space_type='global')['results']
    ])


@app.route('/api/basic/wiki_child_pages', methods=["POST"])
def basic_wiki_pages_get():
    space_key = request.json.get('space_key', None)
    parent_page_id = request.json.get('parent_page_id', None)
    if not parent_page_id and not space_key:
        return success([])
    wiki = Wiki()
    if not parent_page_id:
        home_page_info = wiki.get_home_page(space_key)
        if not home_page_info:
            return success([])
        parent_page_id = home_page_info['id']
        # print('1111111111111111111')
        # for x in wiki.get_page_child(parent_page_id):
        #     print(x)
        return success([
            {'id': x['id'], 'value': x['id'], 'title': x['title'], 'pId': '0', 'url': wiki.base + x['_links']['webui']} for x in wiki.get_page_child(parent_page_id)
    ])
    return success([
        {'id': x['id'], 'value': x['id'], 'title': x['title'], 'pId': parent_page_id, 'url': wiki.base + x['_links']['webui']} for x in wiki.get_page_child(parent_page_id)
    ])


@app.route('/api/basic/upload_wiki', methods=["POST"])
def basic_upload_wiki():
    project_id = request.json.get('project_id', None)
    upload_type = request.json.get('upload_type', None)  # 1创建， 2更新
    space = request.json.get('space', None)
    title = request.json.get('title', None)  # wiki标题
    page = request.json.get('page', None)
    html_body = request.json.get('html_body', None)
    if not upload_type or not title or not page or not html_body:
        return error('请传入必填项')
    html_body = html_body.replace('&', '&amp;')  # 转义body中的特殊字符
    if upload_type == 1:
        try:
            wiki = Wiki()
            wiki.confluence.create_page(parent_id=page, space=space, title=title, body=html_body)
        except Exception as e:
            return error(str(e))
    elif upload_type == 2:
        try:
            wiki = Wiki()
            wiki.confluence.update_page(page_id=page, title=title, body=html_body)
        except Exception as e:
            return error(str(e))
    else:
        return error('错误的上传类型')
    # 数据库记录
    record = WikiUploadRecord()
    record.project_id = project_id
    record.space = space
    record.title = title
    record.upload_type = upload_type
    record.html = html_body
    record.creator = request.cookies.get('username', None)
    db.session.add(record)
    db.session.commit()
    return success()

