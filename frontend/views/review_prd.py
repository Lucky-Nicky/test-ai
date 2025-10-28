import json

from main import app, db
from flask import request
from common.other import success, error
from models.test_review import PrdReview, ReviewStandard
from models.prds import ProductFiles


@app.route('/api/prd_review/mark_result', methods=["POST"])
def prd_review_mark_result():
    product_id = request.json.get('product_id', None)
    standard_id = request.json.get('standard_id', None)
    result = request.json.get('result', None)
    if not product_id:
        return error('没有product_id')
    if not standard_id:
        return error('没有standard_id')
    if result == None:
        return error('没有result')
    prd_result = PrdReview()
    prd_result.product_id = product_id
    prd_result.standard_id = standard_id
    prd_result.result = result
    db.session.add(prd_result)
    db.session.commit()
    return success()


@app.route('/api/prd_review/edit_left_issues', methods=["POST"])
def prd_review_edit_review_issues():
    product_id = request.json.get('product_id', None)
    review_issues = request.json.get('review_issues', [])
    if not product_id:
        return error('没有product_id')
    row = db.session.query(ProductFiles).filter(ProductFiles.id == product_id).first()
    if not row:
        return error(f'未找到id为：{product_id}的产品文档')
    row.review_issues = json.dumps(review_issues, ensure_ascii=False)
    db.session.commit()
    return success()