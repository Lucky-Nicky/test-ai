import json
import datetime
from main import app, db, scheduler
import re
from multiprocessing import Pool
from common.other import *
from flask import request
from models.sprint import *
from models.basic import Projects
from common.LogController import logger
from views.login import require_login


@app.route('/api/sprint/get', methods=["POST"])
@require_login
def sprint_get():
    project_id = request.json.get('project_id', None)
    name = request.json.get('name', None)
    status = request.json.get('status', None)
    query = db.session.query(Sprint).filter(Sprint.project_id == project_id)
    if name:
        query = query.filter(Sprint.name.like('%{}%'.format(name)))
    if status != None:
        query = query.filter(Sprint.status == status)
    rows = query.order_by(-Sprint.id).all()
    return success([row.as_dict() for row in rows])


@app.route('/api/sprint/add', methods=["POST"])
def sprint_add():
    project_id = request.json.get('project_id', None)
    name = request.json.get('name', None)
    source = request.json.get('source', None)
    # 判断相同项目下是否已存在相同name
    query = db.session.query(Sprint).filter(Sprint.project_id == project_id, Sprint.name == name).count()
    if query > 0:
        return error('已存在相同的迭代!!')
    sprint = Sprint()
    sprint.project_id = project_id
    sprint.name = name
    sprint.source = source
    sprint.status = 0
    db.session.add(sprint)
    db.session.commit()
    return success()


@app.route('/api/sprint/edit', methods=["POST"])
def sprint_edit():
    kwargs = request.json.get('kw')
    sprint_id = request.json.get('sprint_id', None)
    if not sprint_id:
        return error('未找到该数据')
    row = db.session.query(Sprint).filter(Sprint.id == sprint_id).first()
    if 'name' in kwargs:  # 判断名字是否已存在
        query = db.session.query(Sprint).filter(Sprint.project_id == row.project_id,
                                                Sprint.name == kwargs['name'],
                                                Sprint.id != sprint_id).count()
        if query > 0:
            return error('已存在相同名称的迭代')

    for key, value in kwargs.items():
        if not hasattr(row, key):
            return {
                'success': False,
                'message': 'key:{}不存在'.format(key)
            }
        row.__setattr__(key, value)
    db.session.commit()
    return success()


@app.route('/api/sprint/delete', methods=["POST"])
def sprint_delete():
    kwargs = request.json.get('kw')
    sprint_id = request.json.get('sprint_id', None)
    if not sprint_id:
        return error('未找到该数据')
    row = db.session.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not row:
        return error('未找到该数据')
    db.session.delete(row)
    db.session.commit()
    return success()


@app.route('/api/sprint/search_jira_sprint', methods=["POST"])
def sprint_search_jira_sprint():
    from utils.jira import JiraUtils
    jira = JiraUtils()
    project_id = request.json.get('project_id', None)
    key = request.json.get('key', None)
    if not project_id:
        return error('project_id为空')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    if not project_row:
        return error('未找到该项目')
    board_id = jira.get_board_id(project_row.jira_board_name, project_row.jira_project_key)
    if not board_id:
        return error('未找到board id')
    return success(jira.search_sprint(board_id, key))


@app.route('/api/sprint/search_jira_release', methods=["POST"])
def sprint_search_jira_release():
    from utils.jira import JiraUtils
    jira = JiraUtils()
    project_id = request.json.get('project_id', None)
    key = request.json.get('key', None)
    if not project_id:
        return error('project_id为空')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    if not project_row:
        return error('未找到该项目')
    board_id = jira.get_board_id(project_row.jira_board_name, project_row.jira_project_key)
    if not board_id:
        return error('未找到board id')
    return success(jira.search_release(board_id, key))


@app.route('/api/sprint/sync_jira_info', methods=["POST"])
def sprint_sync_jira_info():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    sprint_name = request.json.get('sprint_name', None)
    return get_jira_info(project_id, sprint_id, sprint_name)


def get_jira_info(project_id, sprint_id, sprint_name):
    from utils.jira import JiraUtils
    jira = JiraUtils()
    # 先清除已有数据
    jira_info_rows = db.session.query(JiraSprintInfo).filter(JiraSprintInfo.sprint_id == sprint_id, JiraSprintInfo.project_id == project_id).all()
    if jira_info_rows:
        for row in jira_info_rows:
            db.session.delete(row)
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    if not project_row:
        return error('未找到该项目')
    project_key, board_name = project_row.jira_project_key, project_row.jira_board_name
    board_id = jira.get_board_id(board_name, project_key)
    if not board_id:
        return error('未找到board id')
    if project_row.name == '技术中台':  # 技术中台走fixVersion
        release_name = sprint_name.replace(' ', '')
        release_info = jira.get_release(board_id, release_name)
        if not release_info:
            return error('未匹配到release:{}'.format(release_name))
        # 更新 sprint状态
        sprint_row = db.session.query(Sprint).filter(Sprint.id == sprint_id).first()
        sprint_row.status = 1 if release_info['released'] else 0

        jql_story = "project = {} AND issuetype in (Story, 故事) AND fixVersion = '{}'".format(project_key, release_info['name'])
        jql_bug = "project = {} AND issuetype = 故障 AND fixVersion = '{}'".format(project_key, release_info['name'])
    else:
        result = re.search(r'(\d+\.\d+.\d+)', sprint_name)
        if not result:
            return error('无法在{}提取迭代号')
        sprint_key = result.groups()[0]
        # 先使用完整sprint去找
        sprint_info = jira.get_sprint(board_id, sprint_name)
        if not sprint_info:  # 用key去找
            sprint_info = jira.get_sprint(board_id, sprint_key)
        if not sprint_info:
            return error('未找到sprint 信息')
        # 更新 sprint状态
        sprint_row = db.session.query(Sprint).filter(Sprint.id == sprint_id).first()
        sprint_row.status = 1 if sprint_info['state'] == 'closed' else 0
        jira_sprint_id = sprint_info['id']
        jql_story = 'project = {} AND issuetype in (Story, 故事) AND Sprint = {}'.format(project_key, jira_sprint_id)
        jql_bug = 'project = {} AND issuetype = 故障 AND Sprint = {}'.format(project_key, jira_sprint_id)

    with Pool(3) as p:
        results = p.map(jira.jql_basic_only, [jql_story, jql_bug])
    p.join()
    for x in range(0, 2):
        if results[x]['issues']:
            for story in results[x]['issues']:
                jiraInfo = JiraSprintInfo()
                jiraInfo.project_id = project_id
                jiraInfo.sprint_id = sprint_id
                jiraInfo.key = story['key']
                jiraInfo.url = 'https://jira.jusda.int/browse/' + story['key']
                jiraInfo.summary = story['fields']['summary']
                jiraInfo.description = story['fields']['description']
                jiraInfo.priority = story['fields']['priority']['name']
                jiraInfo.status = story['fields']['status']['name']
                jiraInfo.type = x + 1
                db.session.add(jiraInfo)
    db.session.commit()
    return success()


@scheduler.task('cron', id='get_jira_info_job',day_of_week='0-4', hour='23', minute='3')
def get_jira_info_job():
    with app.app_context():
        rows = db.session.query(Sprint).filter(Sprint.status == 0).all()
        logger.info('获取jira数据，需要刷的数据有{}条'.format(len(rows)))
        for sprint in rows:
            try:
                project_id = sprint.project_id
                sprint_id = sprint.id
                sprint_name = sprint.name
                logger.info('正在获取:{}的jira数据'.format(sprint_name))
                get_jira_info(project_id, sprint_id, sprint_name)
            except:
                pass
        return success()

