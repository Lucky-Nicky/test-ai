import json
import datetime
from main import app, db
from utils.upload_file import upload
from utils.confluence import Wiki
from common.other import *
from flask import request
from models.basic import *
from models.test_plan import TestPlan
from models.sprint import Sprint
from views.login import require_login


@app.route('/api/plan/get', methods=["POST"])
@require_login
def plan_get():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    status = request.json.get('status', None)
    query = db.session.query(TestPlan, Sprint).join(Sprint, TestPlan.sprint_id == Sprint.id).filter(
        TestPlan.project_id == project_id)
    if sprint_id:
        query = query.filter(TestPlan.sprint_id == sprint_id)
    if status or status == 0:
        query = query.filter(Sprint.status == status)
    result = query.order_by(Sprint.status, -TestPlan.id).all()
    rtn = [{**product.as_dict(), 'sprint_name': sprint.name, 'status': sprint.status} for product, sprint in result]
    return success(rtn)


@app.route('/api/plan/add', methods=["POST"])
def plan_add():
    plan_id = request.json.get('product_id', None)
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    wiki_page_id = request.json.get('page', None)
    remark = request.json.get('remark', None)
    if not wiki_page_id:
        return error('没有page id')
    wiki = Wiki()
    page_info = wiki.get_page_by_id(wiki_page_id)
    content = wiki.get_page_as_pdf(wiki_page_id)
    file_name = '{}.pdf'.format(page_info['title'])
    oss_path = upload(file_name, content)
    if plan_id:  # 走修改流程
        tp = db.session.query(TestPlan).filter(TestPlan.id == plan_id).first()
        if not tp:
            return error('未找到对应id')
        tp.project_id = project_id
        tp.sprint_id = sprint_id
        tp.oss_path = oss_path
        tp.file_name = file_name
        tp.remark = remark
        tp.creator = request.cookies.get('username', None)
    else:
        tp = TestPlan()
        tp.project_id = project_id
        tp.sprint_id = sprint_id
        tp.oss_path = oss_path
        tp.file_name = file_name
        tp.remark = remark
        tp.creator = request.cookies.get('username', None)
        db.session.add(tp)
    db.session.commit()
    return success()


@app.route('/api/plan/delete', methods=["POST"])
def plan_delete():
    plan_id = request.json.get('plan_id', None)
    tp = db.session.query(TestPlan).filter(TestPlan.id == plan_id).first()
    if not tp:
        return error('未找到对应id')
    db.session.delete(tp)
    db.session.commit()
    return success()


@app.route('/api/plan/update_plan', methods=["POST"])
def create_plan():
    confluence_node_id = request.json.get('confluence_node_id', None)
    title = request.json.get('title', None)
    html_body = request.json.get('html_body', None)
    wiki = Wiki('nicky-deng', 'P@ssw0rd1')
    try:
        return success(wiki.confluence.update_page(page_id=confluence_node_id, title=title, body=html_body))
    except Exception as e:
        return error(e)


@app.route('/api/plan/gen_business_background_by_story', methods=["POST"])
def gen_business_background_by_story():
    story = request.json.get('story', None)
    if not story:
        return error('没有story')
    body = ''
    for row in story:
        body = body + f"""
            <p>
            <span class="jira-issue conf-macro output-block">
                <a href="{row['url']}"><img class="icon" src="https://jira.jusda.int/secure/viewavatar?size=xsmall&amp;avatarId=10315&amp;avatarType=issuetype" />{row['key']}</a>
                -
                <span>{row['summary']}</span>
            </span>
        </p> \n
        """
    return success(body)


@app.route('/api/plan/test_source_html', methods=["POST"])
def gen_test_source_html():
    env = request.json.get('env', '')
    tester = request.json.get('tester', None)
    tool = request.json.get('tool', '')
    if env:
        env = ', '.join(env)
    if tester:
        tester = ', '.join(tester)
    html = f"""
    <table border="1">
        <tr>
            <td><h3>测试环境</h3></td>
            <td>{env}</td>
        </tr>
        <tr>
            <td><h3>测试人员</h3></td>
            <td>{tester}</td>
        </tr>
        <tr>
            <td><h3>测试工具</h3></td>
            <td>{tool}</td>
        </tr>
    </table>
    """

    return success(html)


def scope_header():
    header = """
    <tr>
        <th>业务模块</th>
        <th>功能需求（story）</th>
        <th>测试范围</th>
        <th>用例编写 \n 工时(nh)/人</th>
        <th>数据准备 \n 工时(nh)/人</th>
        <th>测试执行 \n 工时(nh)/人</th>
        <th>负责人</th>
    </tr>
    """
    return header


def scope_body(rows):
    body_html = ''
    for row in rows:
        scope_num = len(row['测试范围'])
        for index, scope in enumerate(row['测试范围']):
            write_case = row['用例编写'] if '用例编写' in row else ''
            date_prepare_time = row['数据准备'] if '数据准备' in row else ''
            test_execute = row['测试执行'] if '测试执行' in row else ''
            charger = row['负责人'] if '负责人' in row else ''
            mk, xq = row['模块'], row['需求']
            if index == 0:
                body_html += f"""
                    <tr>
                        <td rowspan="{scope_num}">{mk}</td>
                        <td rowspan="{scope_num}">{xq}</td>
                        <td>{scope}</td>
                        <td>{write_case}</td>
                        <td>{date_prepare_time}</td>
                        <td>{test_execute}</td>
                        <td rowspan="{scope_num}">{charger}</td>
                    </tr> \n
                    """
            else:
                body_html += f"""
                    <tr>
                        <td>{scope}</td>
                        <td>{write_case}</td>
                        <td>{date_prepare_time}</td>
                        <td>{test_execute}</td>
                    </tr> \n
                    """

    return body_html


@app.route('/api/plan/test_scope_html', methods=["POST"])
def gen_test_scope_html():
    scope_json = request.json.get('scope_json', None)
    if not scope_json:
        return error('没有json数据')
    if not isinstance(scope_json, list):
        return error('json格式不是列表')
    header = scope_header()
    try:
        body = scope_body(scope_json)
    except Exception as e:
        print(e)
        return error('生成html异常，原因：{}'.format(e))
    result = '''
    <table border="1">
    {header}
    {body}
    </table>
    '''.format(header=header, body=body)
    return success(result)


def execute_pan_header():
    return """
    <tr>
        <th><h2>执行事项</h2></th>
        <th><h2>执行耗时(nH)</h2></th>
        <th><h2>备注</h2></th>
    </tr>
    """


def execute_plan_body(rows):
    body_html = ''
    case, gc, smoke, first, second, hg, hgun = '不涉及', '不涉及', '不涉及', '不涉及', '不涉及', '不涉及', '不涉及'
    case_remark, gc_remark, smoke_remark, first_remark, second_remark, hg_remark, hgun_remark = '', '', '', '', '', '', ''
    for row in rows:
        if row['testStage'] == '用例编写':
            case = row['time'] if 'time' in row and row['time']else '不涉及'
            case_remark = row['remark'] if 'remark' in row and row['remark'] else ''
        if row['testStage'] == '跟测':
            gc = row['time'] if 'time' in row and row['time'] else '不涉及'
            gc_remark = row['remark'] if 'remark' in row and row['remark'] else ''
        if row['testStage'] == '冒烟测试':
            smoke = row['time'] if 'time' in row and row['time'] else '不涉及'
            smoke_remark = row['remark'] if 'remark' in row and row['remark'] else ''
        if row['testStage'] == '第一轮系统测试':
            first = row['time'] if 'time' in row and row['time'] else '不涉及'
            first_remark = row['remark'] if 'remark' in row and row['remark'] else ''
        if row['testStage'] == '第二轮系统测试':
            second = row['time'] if 'time' in row and row['time'] else '不涉及'
            second_remark = row['remark'] if 'remark' in row and row['remark'] else ''
        if row['testStage'] == '回归测试':
            hg = row['time'] if 'time' in row and row['time'] else '不涉及'
            hg_remark = row['remark'] if 'remark' in row and row['remark'] else ''
        if row['testStage'] == '回滚验证':
            hgun = row['time'] if 'time' in row and row['time'] else '不涉及'
            hgun_remark = row['remark'] if 'remark' in row and row['remark'] else ''
    body_html += f"""
    <tr>
        <td><b>用例编写</b></td>
        <td>{case}</td>
        <td>{case_remark}</td>
    </tr>
    <tr>
        <td><b>跟测\接口测试</b></td>
        <td>{gc}</td>
        <td>{gc_remark}</td>
    </tr>
    <tr>
        <td colspan="3">
        -------------------------------------------------提测------------------------------------------
        </td>
    </tr>
    <tr>
        <td><b>冒烟测试</b></td>
        <td>{smoke}</td>
        <td>{smoke_remark}</td>
    </tr>
    <tr>
        <td><b>第一轮系统测试</b></td>
        <td>{first}</td>
        <td>{first_remark}</td>
    </tr>
    <tr>
        <td><b>缺陷创建与跟踪</b></td>
        <td>-</td>
        <td>此项无法评估，固定填-</td>
    </tr>
        <tr>
        <td><b>第二轮系统测试</b></td>
        <td>{second}</td>
        <td>{second_remark}</td>
    </tr>
    <tr>
        <td colspan="3">
        -------------------------------------------------预封板-----------------------------------------
        </td>
    </tr>
    <tr>
        <td><b>回归测试</b></td>
        <td>{hg}</td>
        <td>{hg_remark}</td>
    </tr>
    <tr>
        <td colspan="3">
        --------------------------------------------------封板-----------------------------------------
        </td>
    </tr>
        <tr>
        <td><b>回滚</b></td>
        <td>{hgun}</td>
        <td>{hgun_remark}</td>
    </tr> \n
    """

    return body_html


@app.route('/api/plan/execute_pan_html', methods=["POST"])
def gen_execute_pan_html():
    plan_json = request.json.get('plan_json', None)
    if not plan_json:
        return error('没有json数据')
    if not isinstance(plan_json, list):
        return error('json格式不是列表')
    header = execute_pan_header()
    body = execute_plan_body(plan_json)
    result = '''
    <p>注意：所有事项仅评估<strong>测试执行耗时</strong></p>
    <table border="1">
    {header}
    {body}
    </table>
    '''.format(header=header, body=body)
    return success(result)
