from main import app, db
from common.other import *
from flask import request
from models.nodes import Nodes
from models.case_models import TestCase
from models.sprint import Sprint
from models.basic import Projects


@app.route('/api/nodes/get', methods=["POST"])
def nodes_get():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    sprint_info = db.session.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint_info:
        return []
    rtn = [
        {'key': 0, 'value': 0, 'title': sprint_info.name, 'position': 0, 'children': []}
    ]

    query = db.session.query(Nodes).filter(Nodes.project_id == project_id, Nodes.sprint_id == sprint_id,
                                           Nodes.parent_id == None)
    rows = query.order_by(Nodes.position).all()

    def get_tree_json(row):
        childs = db.session.query(Nodes).filter(Nodes.parent_id == row.id).order_by(Nodes.position).all()
        if not childs:
            return {
                'key': row.id,
                'value': row.id,
                'title': row.name,
                'position': row.position,
                'parent_id': row.parent_id,
                'children': []
            }
        return {
            'key': row.id,
            'value': row.id,
            'title': row.name,
            'position': row.position,
            'parent_id': row.parent_id,
            'children': [get_tree_json(x) for x in childs]
        }

    for row in rows:
        rtn[0]['children'].append(get_tree_json(row))

    # 获取用例数

    def get_offspring_nodes(row):
        rtn = [row['key']]
        if row['children']:
            for child in row['children']:
                rtn.extend(get_offspring_nodes(child))
        return rtn

    def get_nodes_cases(rows):
        for row in rows:
            nodes_list = get_offspring_nodes(row)
            # print('33333333333333333333333333')
            # print(nodes_list)
            query = db.session.query(TestCase).filter(
                TestCase.project_id == project_id,
                TestCase.sprint_id == sprint_id,
                TestCase.node_id.in_(nodes_list)
            )
            row['case_num'] = query.count()
            if row['children']:
                get_nodes_cases(row['children'])

    get_nodes_cases(rtn)
    return success(rtn)


@app.route('/api/nodes/add', methods=["POST"])
def nodes_add():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    if not project_id or not sprint_id:
        return error('迭代和项目id必填')
    parent_node_id = request.json.get('parent_node_id', None)
    if parent_node_id == 0:
        parent_node_id = None
    node_name = request.json.get('node_name', None)
    if not node_name:
        return error('请输入模块名称')
    # 获取父节点下position最高的子节点，计算position
    latest_node = db.session.query(Nodes).filter(
        Nodes.project_id == project_id,
        Nodes.sprint_id == sprint_id,
        Nodes.parent_id == parent_node_id,
    ).order_by(-Nodes.position).first()
    position = latest_node.position + 1 if latest_node else 0
    new_node = Nodes()
    new_node.project_id = project_id
    new_node.sprint_id = sprint_id
    new_node.name = node_name
    new_node.parent_id = parent_node_id
    new_node.position = position
    db.session.add(new_node)
    db.session.commit()
    return success()


@app.route('/api/nodes/edit', methods=["POST"])
def nodes_edit():
    node_id = request.json.get('node_id', None)
    name = request.json.get('name', None)
    if not node_id:
        return error('未找到指定模块')
    if not name:
        return error('请传入模块名称')
    row = db.session.query(Nodes).filter(Nodes.id == node_id).first()
    if not row:
        return error('未找到指定模块')
    row.name = name
    db.session.commit()
    return success()


@app.route('/api/nodes/delete', methods=["POST"])
def nodes_delete():
    node_id = request.json.get('node_id', None)
    if not node_id:
        return error('未找到对应模块')
    query = db.session.query(TestCase).filter(TestCase.node_id == node_id)
    if query.count() > 0:
        return error('该模块存在用例，无法删除')
    query = db.session.query(Nodes).filter(Nodes.parent_id == node_id)
    if query.count() > 0:
        return error('该模块存在子模块，无法删除')
    row = db.session.query(Nodes).filter(Nodes.id == node_id).first()
    if not row:
        return error('未找到对应模块')
    db.session.delete(row)
    db.session.commit()
    return success()


def get_technical_center_ms_project(sprint_name, sub_projects):
    import re
    rtn = re.search(r'(.*?)[vV]\d+\.\d+\.\d+', sprint_name)
    if not rtn:
        return None
    rows = [row for row in sub_projects if rtn.groups()[0].strip() == row.name]
    if not rows:
        return None
    return rows[0].ms_project


@app.route('/api/nodes/drag_node', methods=["POST"])
def nodes_drag_node():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    if not project_id or not sprint_id:
        return error('project id 和 sprint id必填')
    drag_node_id = request.json.get('drag_node_id', None)
    target_parent_id = request.json.get('target_parent_id', None)
    position = request.json.get('position', None)
    if not drag_node_id:
        return error('请传入drag_node_id')
    if target_parent_id == None:
        return error('请传入target_parent_id')
    target_parent_id = None if target_parent_id == 0 else target_parent_id
    if position == None:
        return error('请传入position')
    # 获取拖动的node
    drag_node = db.session.query(Nodes).filter(
        Nodes.project_id == project_id,
        Nodes.sprint_id == sprint_id,
        Nodes.id == drag_node_id

    ).first()
    if not drag_node:
        return error('未找到 node:{}'.format(drag_node_id))
    # 判断parent_id 是否存在

    if target_parent_id and not db.session.query(Nodes).filter(
            Nodes.project_id == project_id,
            Nodes.sprint_id == sprint_id,
            Nodes.id == target_parent_id).first():
        return error('未找到 parent node:{}'.format(target_parent_id))
    # 获取parent_id的childs
    target_nodes = db.session.query(Nodes).filter(
        Nodes.project_id == project_id,
        Nodes.sprint_id == sprint_id,
        Nodes.parent_id == target_parent_id).order_by(Nodes.position).all()
    if drag_node.parent_id == target_parent_id:  # 如果拖动的node和目标位置在同一层级，需要先在childs中去掉该元素
        # target_nodes = [x for x in target_nodes if x.id != drag_node_id]
        target_nodes = list(map(lambda x: x if x.id != drag_node_id else None, target_nodes))
    target_nodes.insert(position, drag_node)
    target_nodes = [x for x in target_nodes if x]
    # 重新排序
    for index, node in enumerate(target_nodes):
        if node.id == drag_node_id:
            node.parent_id = target_parent_id  # 替换parent_id
        node.position = index
    db.session.commit()
    return success()


@app.route('/api/nodes/get_ms_nodes', methods=["POST"])
def nodes_get_ms_nodes():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    if not project_id:
        return error('项目未找到')
    project_row = db.session.query(Projects).filter(Projects.id == project_id).first()
    if project_row.name == '技术中台':  # 技术中台从子项目中找配置
        sub_project_rows = db.session.query(Projects).filter(Projects.parent_id == project_row.id).all()
        sprint_row = db.session.query(Sprint).filter(Sprint.id == sprint_id).first()
        if not sprint_row:
            return error('未找到该sprint:{}'.format(sprint_id))
        ms_project = get_technical_center_ms_project(sprint_row.name, sub_project_rows)
    else:
        ms_project = project_row.ms_project
    if not ms_project:
        return error('未找到配置的metersphere项目')
    from utils.MSUtils import MSUtils
    ms_utils = MSUtils(project_name=ms_project)
    node_list = ms_utils.get_node_list()['data']
    return success(node_list)