import datetime
from flask import request, make_response
from main import app, db
from models.users import Users
from common.other import error, success
from functools import wraps


@app.route('/api/login', methods=["POST"])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if not username or not password:
        return error('请输入用户名/密码!')

    user = Users.query.filter_by(username=username).first()
    if user and user.check_password(password) and user.is_active:
        rtn = make_response(success())
        rtn.set_cookie('username', username, expires=datetime.datetime.now() + datetime.timedelta(days=30))
        return rtn
    return error('用户名或密码错误!')


def check_login():
    username = request.cookies.get('username', None)
    if not username:
        return error('你还未登录，请登录')

    user = Users.query.filter_by(username=username).first()
    if not user or not user.is_active:
        return error('登录已失效，请重新登录')

    return success()


def require_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        check_result = check_login()
        if not check_result['success']:
            check_result['need_login'] = True
            return check_result
        return f(*args, **kwargs)

    return wrapper

# Since check_k8s_auth is no longer needed, it can be removed or repurposed if necessary.

if __name__ == '__main__':
    from werkzeug.security import generate_password_hash

    plaintext_password = "admin@Ddl123"
    hashed_password = generate_password_hash(plaintext_password)

    print(hashed_password)