from main import app, db
from flask import request
from common.other import success, error
from models.review_cases import CaseReview


@app.route('/api/case_review/mark_result', methods=["POST"])
def case_review_mark_result():
    case_id = request.json.get('case_id', None)
    result = request.json.get('result', None)
    comment = request.json.get('comment', None)
    if not case_id:
        return error('没有case id')
    review = CaseReview()
    review.case_id = case_id
    review.result = 0 if result == 'pass' else 1
    review.comment = comment
    if review.result == 1 and not review.comment:
        return error('失败用例必须填写备注')
    db.session.add(review)
    db.session.commit()
    return success()


@app.route('/api/case_review/history', methods=["POST"])
def case_review_history():
    case_id = request.json.get('case_id', None)
    if not case_id:
        return error('没有case id')
    rows = db.session.query(CaseReview).filter(CaseReview.case_id == case_id).order_by(-CaseReview.id).all()
    return success([
        x.as_dict() for x in rows
    ])