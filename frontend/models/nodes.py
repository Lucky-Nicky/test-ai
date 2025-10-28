import datetime, time
from main import db
from models.case_models import TestCase


class Nodes(db.Model):
    __tablename__ = 'nodes'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    name = db.Column('name', db.String(255))
    project_id = db.Column('project_id', db.Integer)
    sprint_id = db.Column(db.Integer, db.ForeignKey('sprint.id'))  # 迭代号ID
    parent_id = db.Column('parent_id', db.Integer)
    position = db.Column('position', db.Integer)
    create_time = db.Column(db.Integer)
    cases = db.relationship('TestCase', backref='nodes', lazy=True)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))
        last_node = Nodes.query.filter_by(sprint_id=self.sprint_id).order_by(Nodes.position.desc()).first()
        if last_node:
            self.position = last_node.position + 1
        else:
            self.position = 0

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}