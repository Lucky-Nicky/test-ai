import datetime, time
from main import db
from models import prds, sprint, case_models, nodes, llm_prompt, test_plan, llm, data_prepare, test_review, api_cases


class Projects(db.Model):
    __tablename__ = 'projects'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(255))
    parent_id = db.Column('parent_id', db.Integer)
    ms_project = db.Column('ms_project', db.String(255))
    tester = db.Column('tester', db.Text)
    jira_project_key = db.Column('jira_project_key', db.String(255))
    jira_board_name = db.Column('jira_board_name', db.String(255))
    confluence_space_key = db.Column('confluence_space_key', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Developers(db.Model):
    __tablename__ = 'developers'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(20))
    role = db.Column('role', db.Integer)    # 0代表开发， 1 代表测试
    status = db.Column('status', db.Integer)
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))
        self.status = 0

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class WikiUploadRecord(db.Model):
    __tablename__ = 'wiki_upload_record'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    project_id = db.Column('project_id', db.Integer)
    space = db.Column('space', db.String(255))
    title = db.Column('title', db.String(255))
    upload_type = db.Column('upload_type', db.Integer)    # 1创建， 2更新
    html = db.Column('html', db.Text)
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))
        self.status = 0

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}