from main import app, db
from flask import request
from common.other import success, error
from models.basic import Projects
from utils.MSUtils import MSUtils
from views.login import require_login


@app.route('/api/case_review_ms/get_review_list', methods=["POST"])
@require_login
def ms_get_review_list():
    project_id = request.json.get('project_id', None)
    sub_project_id = request.json.get('sub_project_id', None)
    page = request.json.get('page', 1)
    name = request.json.get('name', None)
    if not project_id:
        return error('没有project id')
    if sub_project_id:
        project_row = db.session.query(Projects).filter(Projects.id == sub_project_id).first()
    else:
        project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.get_case_review_list(page=page,name=name)


@app.route('/api/case_review_ms/get_review_case_list', methods=["POST"])
def ms_get_review_case_list():
    project_id = request.json.get('project_id', None)
    review_id = request.json.get('review_id', None)
    if not project_id:
        return error('没有project id')
    if not review_id:
        return error('没有review id')
    page = request.json.get('page', 1)
    num = request.json.get('num', 10)
    node_ids = request.json.get('node_ids', [])
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.get_case_review_case_list(review_id=review_id, page=page, node_ids=node_ids, num=num)


@app.route('/api/case_review_ms/get_review_case_detail', methods=["POST"])
def ms_get_review_case_Detail():
    project_id = request.json.get('project_id', None)
    id = request.json.get('id', None)
    if not project_id:
        return error('没有project id')
    if not id:
        return error('没有 id')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.get_case_review_case_detail(id)


@app.route('/api/case_review_ms/get_review_node_list', methods=["POST"])
def ms_get_review_node_list():
    project_id = request.json.get('project_id', None)
    review_id = request.json.get('review_id', None)
    if not project_id:
        return error('没有project id')
    if not review_id:
        return error('没有review id')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.get_case_review_node_list(review_id=review_id)


@app.route('/api/case_review_ms/mark_result', methods=["POST"])
def ms_get_review_mark_result():
    project_id = request.json.get('project_id', None)
    review_id = request.json.get('review_id', None)
    id = request.json.get('id', None)
    case_id = request.json.get('case_id', None)
    if not review_id or not id or not case_id or not project_id:
        return error('请传入必填参数')
    status = request.json.get('status', None)
    if not status:
        return error('请传入标记结果')
    comment = request.json.get('comment', None)
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.get_case_review_case_edit(id=id, case_id=case_id, review_id=review_id, status=status, comment=comment)


@app.route('/api/case_review_ms/butch_mark_result', methods=["POST"])
def ms_get_review_butch_mark_result():
    project_id = request.json.get('project_id', None)
    review_id = request.json.get('review_id', None)
    ids = request.json.get('ids', None)
    if not review_id or not id or not ids or not project_id:
        return error('请传入必填参数')
    status = request.json.get('status', None)
    if not status:
        return error('请传入标记结果')
    comment = request.json.get('comment', '')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.case_review_case_butch_edit(ids=ids, review_id=review_id, status=status, comment=comment)


@app.route('/api/case_review_ms/history', methods=["POST"])
def ms_get_review_history():
    project_id = request.json.get('project_id', None)
    review_id = request.json.get('review_id', None)
    case_id = request.json.get('case_id', None)
    if not review_id or not case_id or not project_id:
        return error('请传入必填参数')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    ms_project = project_row.ms_project
    ms = MSUtils(ms_project)
    return ms.get_case_review_case_history(case_id=case_id, review_id=review_id)
