import datetime, time
from main import db


class TestCase(db.Model):
    __tablename__ = 'test_case'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(255))  # 用例名称
    priority = db.Column('priority', db.String(255))  # 用例等级
    precondition = db.Column('precondition', db.Text)  # 前置条件
    description = db.Column('description', db.Text)  # 测试描述，包含测试步骤和预期结果
    sprint_id = db.Column(db.Integer, db.ForeignKey('sprint.id'))  # 迭代号ID
    project_id = db.Column('project_id', db.Integer)  # 所属项目ID
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'))  # 迭代号ID
    status = db.Column('status', db.Integer)  # 状态 1: 草稿 2: 定稿
    creator = db.Column('creator', db.String(255))
    create_time = db.Column('create_time', db.Integer)  # 创建时间

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))
        self.is_locked = 0

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

