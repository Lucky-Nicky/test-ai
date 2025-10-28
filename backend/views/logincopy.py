import datetime

from main import app, db
# from flask import request
from common.other import error, success
from flask import request, make_response
import requests


@app.route('/api/login', methods=["POST"])
def login():
    url = 'http://k8s.jusda.int/oauth/token'
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if not username or not password:
        return error('请输入用户名/密码!')
    headers = {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept': '*/*'
    }
    body = {
        'grant_type': 'password', 'username': username, 'password': password,
        'client_id': 'kubesphere', 'client_secret': 'kubesphere'
    }
    response = requests.post(url, data=body, headers=headers, verify=False)
    # print(response.json())
    if 'refresh_token' in response.json():
        rtn = make_response(success())
        rtn.set_cookie('username', username, expires=datetime.datetime.now() + datetime.timedelta(days=30))
        rtn.set_cookie('token', response.json()['refresh_token'], expires=datetime.datetime.now() + datetime.timedelta(days=30))
        return rtn
    return error('用户名或密码错误!')


def check_login():
    username = request.cookies.get('username', None)
    token = request.cookies.get('token', None)
    if not username or not token:
        return error('你还未登录，请登录')
    # if not check_k8s_auth(token):
    #     return error('登录已失效，请重新登录')
    return success()


def check_k8s_auth(token):
    url = 'http://k8s.jusda.int/kapis/tenant.kubesphere.io/v1alpha2/clusters'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    response = requests.get(url, headers=headers, verify=False)
    # print(response.json())
    if 'reason' in response.json() and response.json()['reason'] == "Unauthorized":
        return False
    return True


def require_login(f):
    from functools import wraps
    @wraps(f)
    def wrapper(**kwargs):
        check_result = check_login()
        if not check_result['success']:
            check_result['need_login'] = True
            return check_result
        return f(**kwargs)
    return wrapper
