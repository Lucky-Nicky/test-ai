import datetime, time
from main import db
from models.case_models import *


class Sprint(db.Model):
    __tablename__ = 'sprint'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(255))
    project_id = db.Column('project_id', db.Integer)
    source = db.Column('source', db.Integer)  # 1 来自jira sprint  2 来自jira version  3 自定义
    status = db.Column('status', db.Integer)
    create_time = db.Column(db.Integer)
    product_files = db.relationship('ProductFiles', backref='sprint', lazy=True)
    cases = db.relationship('TestCase', backref='sprint', lazy=True)
    nodes = db.relationship('Nodes', backref='sprint', lazy=True)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class JiraSprintInfo(db.Model):
    __tablename__ = 'jira_sprint_info'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    sprint_id = db.Column('sprint_id', db.Integer)
    project_id = db.Column('project_id', db.Integer)
    key = db.Column('key', db.String(255))
    url = db.Column('url', db.String(255))
    summary = db.Column('summary', db.String(255))
    description = db.Column('description', db.Text)
    priority = db.Column('priority', db.String(255))
    status = db.Column('status', db.String(255))
    type = db.Column('type', db.Integer)  # 1 story 2 bug
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}