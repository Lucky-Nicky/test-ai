import datetime, time
from main import db


class LargeLanguageModel(db.Model):
    __tablename__ = 'large_language_model'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(255))
    company = db.Column('company', db.String(255))
    remark = db.Column('remark', db.Text)
    status = db.Column('status', db.Integer)  # 1：用例生成模板
    default = db.Column('default', db.Integer)
    create_time = db.Column(db.Integer)

    # 新增字段
    api_key = db.Column('api_key', db.String(255))  # API Key
    base_url = db.Column('base_url', db.String(255))  # 基础 URL
    request_mode=db.Column('request_mode', db.String(255))
    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Chat(db.Model):
    __tablename__ = 'chat'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    project_id = db.Column('project_id', db.Integer)
    llm_id = db.Column('llm_id', db.Integer)
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class ChatDetail(db.Model):
    __tablename__ = 'chatDetail'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    chat_id = db.Column('chat_id', db.Integer)
    role = db.Column('role', db.String(255))
    content = db.Column('content', db.Text)
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}