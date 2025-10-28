import datetime, time
from main import db


class TestPlan(db.Model):
    __tablename__ = 'test_plan'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    file_name = db.Column('file_name', db.String(255))
    project_id = db.Column('project_id', db.Integer)
    sprint_id = db.Column(db.Integer, db.ForeignKey('sprint.id'))  # 迭代号ID
    oss_path = db.Column('oss_path', db.String(255))
    remark = db.Column('remark', db.String(255))
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}