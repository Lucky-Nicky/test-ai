import datetime, time
from main import db


class ApiInfo(db.Model):
    __tablename__ = 'api_info'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    project_id = db.Column('project_id', db.Integer)
    name = db.Column('name', db.String(255))
    url = db.Column('url', db.String(255))
    method = db.Column('method', db.String(255))
    params = db.Column('params', db.String(255))
    body = db.Column('body', db.Text)
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class ApiCases(db.Model):
    __tablename__ = 'api_cases'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    api_id = db.Column('api_id', db.Integer)
    name = db.Column('name', db.String(255))
    params = db.Column('params', db.String(255))
    body = db.Column('body', db.Text)
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}