from main import app, db, scheduler
from common.other import *
from flask import request
from models.basic import Projects
from models.api_cases import ApiInfo, ApiCases
from common.LogController import logger
from views.login import require_login


@app.route('/api/api_info/get', methods=["POST"])
@require_login
def api_info_get():
    project_id = request.json.get('project_id', None)
    name = request.json.get('name', None)
    query = db.session.query(ApiInfo).filter(ApiInfo.project_id == project_id)
    if name:
        query = query.filter(ApiInfo.name.like('%{}%'.format(name)))
    rows = query.order_by(-ApiInfo.id).all()
    return success([row.as_dict() for row in rows])


@app.route('/api/api_info/save', methods=["POST"])
def api_info_save():
    id = request.json.get('id', None)
    project_id = request.json.get('project_id', None)
    name = request.json.get('name', None)
    url = request.json.get('url', None)
    method = request.json.get('method', None)
    params = request.json.get('params', None)
    body = request.json.get('body', None)
    row = ApiInfo() if not id else db.session.query(ApiInfo).filter(ApiInfo.id == id).first()
    if not row:
        return error('未找到数据')
    row.project_id = project_id
    row.name = name
    row.url = url
    row.method = method
    row.params = params
    row.body = body
    row.creator = request.cookies.get('username', None)
    db.session.add(row)
    db.session.commit()
    return success()


@app.route('/api/api_info/delete', methods=["POST"])
def api_info_delete():
    id = request.json.get('id', None)
    if not id:
        return error('没有id')
    row = db.session.query(ApiInfo).filter(ApiInfo.id == id).first()
    if not row:
        return error('未找到数据')
    db.session.delete(row)
    db.session.commit()
    return success()


@app.route('/api/api_info/detail', methods=["POST"])
def api_info_detail():
    id = request.json.get('id', None)
    if not id:
        return error('没有id')
    row = db.session.query(ApiInfo).filter(ApiInfo.id == id).first()
    if not row:
        return error('未找到数据')
    return success(row.as_dict())


@app.route('/api/api_case/get', methods=["POST"])
@require_login
def api_case_get():
    api_id = request.json.get('api_id', None)
    name = request.json.get('name', None)
    query = db.session.query(ApiCases).filter(ApiCases.api_id == api_id)
    if name:
        query = query.filter(ApiInfo.name.like('%{}%'.format(name)))
    rows = query.order_by(-ApiCases.create_time).all()
    return success([{
        **row.as_dict(),
        'body': json.loads(row.body)
                     } for row in rows])


@app.route('/api/api_case/save', methods=["POST"])
def api_case_save():
    id = request.json.get('id', None)
    api_id = request.json.get('api_id', None)
    name = request.json.get('name', None)
    params = request.json.get('params', None)
    body = request.json.get('body', None)
    row = ApiCases() if not id else db.session.query(ApiCases).filter(ApiCases.id == id).first()
    if not row:
        return error('未找到数据')
    row.api_id = api_id
    row.name = name
    row.params = params
    row.body = json.dumps(body, ensure_ascii=False) if body else {}
    row.creator = request.cookies.get('username', None)
    db.session.add(row)
    db.session.commit()
    return success()


@app.route('/api/api_case/delete', methods=["POST"])
def api_case_delete():
    id = request.json.get('id', None)
    if not id:
        return error('请传入id')
    row = db.session.query(ApiCases).filter(ApiCases.id == id).first()
    if not row:
        return error('未找到数据')
    db.session.delete(row)
    db.session.commit()
    return success()


@app.route('/api/api_case/exec_py_script', methods=["POST"])
def exec_py_script():
    from workers.tasks import exec_python_script
    code = request.json.get('code', None)
    if not code:
        return error('请传入code')
    rtn = exec_python_script.delay(code)
    return rtn.get(timeout=120)