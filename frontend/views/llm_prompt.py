import json
import datetime
from main import app, db
from common.other import *
from flask import request
from models.basic import *
from models.llm_prompt import Prompt
from views.login import require_login


@app.route('/api/prompt/get', methods=["POST"])
@require_login
def prompt_get():
    project_id = request.json.get('project_id', None)
    role = request.json.get('role', None)
    # 如果 project_id 为 None 或 0，只返回系统模板
    # 如果 project_id 有值，返回项目模板 + 系统模板
    if project_id is None or project_id == 0:
        basic_query = db.session.query(Prompt).filter(Prompt.project_id == 0)
        if role:
            basic_query = basic_query.filter(Prompt.role == role)
        rows = basic_query.order_by(-Prompt.id).all()
        return success([row.as_dict() for row in rows])

    basic_query = db.session.query(Prompt).filter(Prompt.project_id == 0)
    project_query = db.session.query(Prompt).filter(Prompt.project_id == project_id)
    if role:
        basic_query = basic_query.filter(Prompt.role == role)
        project_query = project_query.filter(Prompt.role == role)
    rows = project_query.order_by(-Prompt.id).all() + basic_query.order_by(-Prompt.id).all()
    return success([row.as_dict() for row in rows])


@app.route('/api/prompt/add', methods=["POST"])
def prompt_add():
    prompt_id = request.json.get('prompt_id', None)
    project_id = request.json.get('project_id', None)
    name = request.json.get('name', None)
    role = request.json.get('role', None)
    content = request.json.get('content', None)
    if not project_id:
        return error('缺少必填参数:project_id')
    if not name:
        return error('缺少必填参数:name')
    if not role:
        return error('缺少必填参数:role')
    if not content:
        return error('缺少必填参数:content')
    if prompt_id:  # 走更新流程
        row = db.session.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not row:
            return error('未找到对应模板id')
        row.project_id = project_id
        row.name = name
        row.role = role
        row.content = content
    else:  # 走新建流程
        prompt = Prompt()
        prompt.project_id = project_id
        prompt.name = name
        prompt.role = role
        prompt.content = content
        db.session.add(prompt)
    db.session.commit()
    return success()


@app.route('/api/prompt/validate', methods=["POST"])
def prompt_validate():
    project_id = request.json.get('project_id', None)
    name = request.json.get('name', None)
    role = request.json.get('role', None)
    content = request.json.get('content', None)
    if not project_id:
        return error('缺少必填参数:project_id')
    if not name:
        return error('缺少必填参数:name')
    if not role:
        return error('缺少必填参数:role')
    if not content:
        return error('缺少必填参数:content')
    if role == 1:  # 校验用例模板
        if '{prd_content}' not in content:
            return error('用例模板中必须包含需求文档变量：prd_content')
    elif role == 3:  # 文档问答模板
        if '{pages}' not in content:
            return error('文档问答模板中必须包含文档变量：pages')
        if '{question}' not in content:
            return error('文档问答模板中必须包含问题变量：question')
    return success()


@app.route('/api/prompt/delete', methods=["POST"])
def prompt_delete():
    prompt_id = request.json.get('prompt_id', None)
    row = db.session.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not row:
        return error('未找到对应模板id')
    db.session.delete(row)
    db.session.commit()
    return success()