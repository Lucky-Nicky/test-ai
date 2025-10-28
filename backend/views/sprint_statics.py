from main import app, db
from flask import request
from common.other import success, error
from models.sprint import Sprint, JiraSprintInfo
from models.case_models import TestCase
from models.basic import Projects
from views.login import require_login


def get_test_case_info(sprint: Sprint):
    case_query = db.session.query(TestCase).filter(TestCase.sprint_id == sprint.id)
    total = case_query.count()  # 计算用例总数
    first_case = case_query.order_by(TestCase.create_time).first()
    last_case = case_query.order_by(-TestCase.create_time).first()
    first_case_date = first_case.create_time if first_case else None
    last_case_date = last_case.create_time if last_case else None

    #
    return {
        'case_total': total,
        'first_case_date': first_case_date,
        'last_case_date': last_case_date,
    }


def get_jira_info(sprint: Sprint):
    query = db.session.query(JiraSprintInfo).filter(JiraSprintInfo.sprint_id == sprint.id)
    story_total = query.filter(JiraSprintInfo.type == 1).count()  # 计算story总数
    bug_total = query.filter(JiraSprintInfo.type == 2).count()  # 计算bug总数
    return {
        'story_total': story_total,
        'bug_total': bug_total,
    }


@app.route('/api/sprint_statics/get', methods=["POST"])
@require_login
def sprint_statics_get():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    status = request.json.get('status', None)
    query = db.session.query(
        Sprint, Projects.name).join(Projects, Sprint.project_id == Projects.id)
    if project_id:
        query = query.filter(Sprint.project_id == project_id)
    if sprint_id:
        query = query.filter(Sprint.id == sprint_id)
    if status != None:
        query = query.filter(Sprint.status == status)
    sprints = query.order_by(Sprint.status, -Sprint.id).limit(100)

    return success([{
        'project': project_name,
        'sprint_id': sprint.id,
        'name': sprint.name,
        'status': sprint.status,
        'sprint_create_date': sprint.create_time,
        **get_jira_info(sprint),
        **get_test_case_info(sprint)
    } for sprint, project_name in sprints])


