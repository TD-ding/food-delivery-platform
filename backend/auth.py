from functools import wraps
from flask import request, jsonify, current_app
import jwt


def generate_token(admin_id, username):
    from datetime import datetime, timedelta, timezone
    payload = {
        'admin_id': admin_id,
        'username': username,
        'exp': datetime.now(timezone.utc) + timedelta(days=1),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': '未授权，缺少有效令牌'}), 401

        token = auth_header.split(' ', 1)[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'message': '令牌无效或已过期'}), 401

        request.current_admin = {
            'id': payload['admin_id'],
            'username': payload['username'],
        }
        return f(*args, **kwargs)
    return decorated
