import datetime, time
from main import db


class Prompt(db.Model):
    __tablename__ = 'prompt'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(255))
    project_id = db.Column('project_id', db.Integer)
    content = db.Column('content', db.Text)
    role = db.Column('role', db.Integer)  # 1：用例生成模板
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}