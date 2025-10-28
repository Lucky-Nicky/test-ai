import datetime, time
from main import db


class CaseReview(db.Model):
    __tablename__ = 'case_review'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    case_id = db.Column('case_id', db.Integer)
    result = db.Column('result', db.Integer)  # 0 通过   1 失败
    comment = db.Column('comment', db.Text)
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class PrdReview(db.Model):
    __tablename__ = 'prd_review'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    product_id = db.Column('product_id', db.Integer)
    standard_id = db.Column('standard_id', db.Integer)
    result = db.Column('result', db.Integer)  # 0 通过   1 失败
    create_time = db.Column(db.Integer)

    def __init__(self):
        self.create_time = int(time.mktime(datetime.datetime.now().timetuple()))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class ReviewStandard(db.Model):
    __tablename__ = 'review_standard'  # 设置表名, 表名默认为类名小写
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)  # 设置主键, 默认自增
    type = db.Column('type', db.Integer)  # 1 需求评审
    name = db.Column('name', db.Text)   # 遗留问题
    standard = db.Column('standard', db.Text)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}