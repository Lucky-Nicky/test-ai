import json
import datetime
from main import app, db
from common.other import *
from flask import request, send_file
from common.loader import pdf_loader
from models.prds import *
from models.sprint import Sprint, JiraSprintInfo
from models.llm_prompt import Prompt
from utils.confluence import Wiki
from utils.upload_file import upload
from views.llm import llm_common_ask
from models.test_review import PrdReview, ReviewStandard
from views.login import require_login


def get_review_result(product_id):
    standard_rows = db.session.query(ReviewStandard).filter(ReviewStandard.type == 1).all()

    def get_result(standard: ReviewStandard):
        row = db.session.query(PrdReview).filter(PrdReview.standard_id == standard.id,
                                                 PrdReview.product_id == product_id).order_by(-PrdReview.id).first()
        return {
            **standard.as_dict(),
            'review_result': row.result if row else 0
        }
    results = [get_result(x) for x in standard_rows]
    if len(results) == len([x for x in results if x['review_result'] == 0]):
        review_status_total = '未开始'
    elif len(results) == len([x for x in results if x['review_result'] == 1]):
        review_status_total = '已完成'
    elif [x for x in results if x['review_result'] == 2]:
        review_status_total = '失败'
    else:
        review_status_total = '进行中'
    return {
        'review_status': review_status_total,
        'review_info': results
    }


@app.route('/api/get_product_files', methods=["POST"])
@require_login
def get_product_files():
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    status = request.json.get('status', None)
    query = db.session.query(ProductFiles, Sprint).join(Sprint, ProductFiles.sprint_id == Sprint.id).filter(
        ProductFiles.project_id == project_id)
    if sprint_id:
        query = query.filter(ProductFiles.sprint_id == sprint_id)
    if status or status == 0:
        query = query.filter(Sprint.status == status)
    result = query.order_by(Sprint.status, -ProductFiles.id).all()

    rtn = [{**product.as_dict(),
            **get_review_result(product.id),
            'review_issues': json.loads(product.review_issues) if product.review_issues else [],
            'sprint_name': sprint.name,
            'status': sprint.status} for product, sprint in result]
    for row in rtn:
        # 查询用例数
        # 查询story数
        row['story'] = [x.as_dict() for x in
                        db.session.query(JiraSprintInfo).filter(JiraSprintInfo.sprint_id == row['sprint_id'],
                                                                JiraSprintInfo.type == 1)]
        row['bug'] = [x.as_dict() for x in
                       db.session.query(JiraSprintInfo).filter(JiraSprintInfo.sprint_id == row['sprint_id'],
                                                               JiraSprintInfo.type == 2)]
        row['case_num'] = db.session.query(TestCase).filter(TestCase.sprint_id == row['sprint_id']).count()
    return success(rtn)


@app.route('/api/get_product_files_detail', methods=["POST"])
def get_product_file_detail():
    product_id = request.json.get('product_id', None)
    if not product_id:
        return error('没有product_id')
    result = db.session.query(ProductFiles, Sprint).join(Sprint, ProductFiles.sprint_id == Sprint.id).filter(
        ProductFiles.id == product_id).first()
    product, sprint = result
    rtn = {
        **product.as_dict(),
        **get_review_result(product.id),
        'review_issues': json.loads(product.review_issues) if product.review_issues else [],
        'sprint_name': sprint.name,
        'status': sprint.status
    }

    # 查询用例数
    # 查询story数
    rtn['story'] = [x.as_dict() for x in
                    db.session.query(JiraSprintInfo).filter(JiraSprintInfo.sprint_id == rtn['sprint_id'],
                                                            JiraSprintInfo.type == 1)]
    rtn['bug'] = [x.as_dict() for x in
                   db.session.query(JiraSprintInfo).filter(JiraSprintInfo.sprint_id == rtn['sprint_id'],
                                                           JiraSprintInfo.type == 2)]
    rtn['case_num'] = db.session.query(TestCase).filter(TestCase.sprint_id == rtn['sprint_id']).count()
    return success(rtn)


@app.route('/api/add_product_file', methods=["POST"])
def add_product_files():
    product_id = request.json.get('product_id', None)
    project_id = request.json.get('project_id', None)
    sprint_id = request.json.get('sprint_id', None)
    upload_type = request.json.get('upload_type', None)
    file_name = request.json.get('file_name', None)
    oss_path = request.json.get('oss_path', None)
    online_path = request.json.get('online_path', None)
    file_type = request.json.get('file_type', None)
    remark = request.json.get('remark', None)
    wiki_page_id = request.json.get('page', None)
    if product_id:  # 走修改流程
        if upload_type == 3:
            if not wiki_page_id:
                return error('没有page id')
            wiki = Wiki()
            page_info = wiki.get_page_by_id(wiki_page_id)
            content = wiki.get_page_as_pdf(wiki_page_id)
            file_name = '{}.pdf'.format(page_info['title'])
            oss_path = upload(file_name, content)
        pf = db.session.query(ProductFiles).filter(ProductFiles.id == product_id).first()
        if not pf:
            return error('未找到对应id')
        pf.project_id = project_id
        pf.sprint_id = sprint_id
        pf.upload_type = upload_type
        pf.oss_path = oss_path
        pf.online_path = online_path
        pf.file_name = file_name
        pf.file_type = file_type if file_type else file_name.split('.')[-1]
        pf.remark = remark
        pf.create_user = request.cookies.get('username', None)
    else:
        if upload_type == 3:
            if not wiki_page_id:
                return error('没有page id')
            wiki = Wiki()
            page_info = wiki.get_page_by_id(wiki_page_id)
            content = wiki.get_page_as_pdf(wiki_page_id)
            file_name = '{}.pdf'.format(page_info['title'])
            oss_path = upload(file_name, content)
        pf = ProductFiles()
        pf.project_id = project_id
        pf.sprint_id = sprint_id
        pf.upload_type = upload_type
        pf.oss_path = oss_path
        pf.online_path = online_path
        pf.file_name = file_name
        pf.file_type = file_type if file_type else file_name.split('.')[-1]
        pf.remark = remark
        pf.creator = request.cookies.get('username', None)
        db.session.add(pf)
    db.session.commit()
    return success()


@app.route('/api/delete_product_file', methods=["POST"])
def delete_product_files():
    product_id = request.json.get('product_id', None)
    pf = db.session.query(ProductFiles).filter(ProductFiles.id == product_id).first()
    if not pf:
        return error('未找到对应id')
    db.session.delete(pf)
    db.session.commit()
    return success()


@app.route('/api/get_prd_pages', methods=["POST"])
def get_prd_content():
    url = request.json.get('url')
    file_type = request.json.get('file_type')
    if file_type != 'pdf':
        return error('暂只支持pdf文件')
    return success([x.page_content for x in pdf_loader(url)])


@app.route('/api/prd_review_case_prepare', methods=["POST"])
def prd_review_case_prepare():
    prd_content = request.json.get('prd_content', [])
    chat_id = request.json.get('chat_id', None)
    if not prd_content:
        return '无需求文档'
    if not chat_id:
        return error('chat_id为空')
    prompt_row = db.session.query(Prompt).filter(Prompt.role == 6).first()
    if not prompt_row:
        return error('未找到prompt模板')
    prompt_content = prompt_row.content
    complete_prompt = prompt_content.replace('{prd_content}', '/n'.join(prd_content))
    return llm_common_ask(complete_prompt, chat_id)
