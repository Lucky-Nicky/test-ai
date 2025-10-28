import datetime, time
from main import db


class DataTemplate(db.Model):
    __tablename__ = 'data_template'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    file_name = db.Column('file_name', db.String(255))
    oss_path = db.Column('oss_path', db.String(255))
    project_id = db.Column('project_id', db.Integer)
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class DataPrepare(db.Model):
    __tablename__ = 'data_prepare'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    template_id = db.Column('template_id', db.Integer)
    sheet_name = db.Column('sheet_name', db.String(255))
    header_row = db.Column('header_row', db.Integer)
    data_row = db.Column('data_row', db.Integer)
    rule_row = db.Column('rule_row', db.Integer)
    columns_demand = db.Column('columns_demand', db.Text)
    generated_data = db.Column('generated_data', db.Text)
    generated_data_abnormal = db.Column('generated_data_abnormal', db.Text)
    creator = db.Column('creator', db.String(255))
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}