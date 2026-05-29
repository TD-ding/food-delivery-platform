import re
import os
import secrets
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from db import get_db, init_db
from auth import generate_token, admin_required
from sanitize import sanitize_dict
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','))


@app.before_request
def before_request():
    g.db = get_db()


@app.teardown_request
def teardown_request(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()


# ---------- Rate Limiting ----------

_login_attempts = {}
LOGIN_RATE_LIMIT = 5
LOGIN_RATE_WINDOW = 300


def _check_rate_limit(username):
    from time import time
    now = time()
    attempts = _login_attempts.get(username, [])
    attempts = [t for t in attempts if now - t < LOGIN_RATE_WINDOW]
    _login_attempts[username] = attempts
    return len(attempts) < LOGIN_RATE_LIMIT


def _record_attempt(username):
    from time import time
    _login_attempts.setdefault(username, []).append(time())


# ---------- Validation ----------

PHONE_RE = re.compile(r'^1[3-9]\d{9}$')

MAX_NAME_LEN = 50
MAX_DESC_LEN = 200
MAX_ADDRESS_LEN = 200
MAX_PHONE_LEN = 20


def validate_phone(phone):
    if not PHONE_RE.match(phone):
        return '手机号格式无效，请输入11位国内手机号'
    return None


def validate_length(value, field_name, max_len):
    if len(value) > max_len:
        return f'{field_name}不能超过{max_len}个字符'
    return None


def validate_password(password):
    if len(password) < 8:
        return '密码长度至少8位'
    if not re.search(r'[A-Za-z]', password):
        return '密码必须包含至少一个字母'
    if not re.search(r'[0-9]', password):
        return '密码必须包含至少一个数字'
    return None


# ---------- Auth ----------

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    if not data:
        return jsonify({'message': '请求体不能为空'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not _check_rate_limit(username):
        return jsonify({'message': '登录尝试过多，请稍后再试'}), 429

    cur = g.db.execute(
        "SELECT id, username, password_hash FROM admins WHERE username=?",
        (username,)
    )
    row = cur.fetchone()
    if not row or not check_password_hash(row['password_hash'], password):
        _record_attempt(username)
        return jsonify({'message': '用户名或密码错误'}), 401

    _login_attempts.pop(username, None)
    token = generate_token(row['id'], row['username'])
    return jsonify({'success': True, 'token': token, 'username': row['username']})


@app.route('/api/admin/change-password', methods=['POST'])
@admin_required
def admin_change_password():
    data = request.json
    if not data:
        return jsonify({'message': '请求体不能为空'}), 400

    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    cur = g.db.execute(
        "SELECT password_hash FROM admins WHERE id=?",
        (request.current_admin['id'],)
    )
    row = cur.fetchone()
    if not row or not check_password_hash(row['password_hash'], old_password):
        return jsonify({'message': '原密码错误'}), 400

    pw_error = validate_password(new_password)
    if pw_error:
        return jsonify({'message': pw_error}), 400

    g.db.execute(
        "UPDATE admins SET password_hash=? WHERE id=?",
        (generate_password_hash(new_password), request.current_admin['id'])
    )
    g.db.commit()
    return jsonify({'message': '密码修改成功'})


# ---------- Dishes ----------

@app.route('/api/dishes', methods=['GET'])
def get_dishes():
    category = request.args.get('category')
    if category:
        cur = g.db.execute("SELECT * FROM dishes WHERE available=1 AND category=? ORDER BY id", (category,))
    else:
        cur = g.db.execute("SELECT * FROM dishes WHERE available=1 ORDER BY id")
    dishes = [dict(row) for row in cur.fetchall()]
    return jsonify(dishes)


@app.route('/api/dishes/categories', methods=['GET'])
def get_categories():
    cur = g.db.execute("SELECT DISTINCT category FROM dishes WHERE available=1 ORDER BY category")
    categories = [row['category'] for row in cur.fetchall()]
    return jsonify(categories)


@app.route('/api/admin/dishes', methods=['GET'])
@admin_required
def admin_get_dishes():
    cur = g.db.execute("SELECT * FROM dishes ORDER BY id")
    return jsonify([dict(row) for row in cur.fetchall()])


@app.route('/api/admin/dishes', methods=['POST'])
@admin_required
def admin_add_dish():
    data = request.json
    if not data:
        return jsonify({'message': '请求体不能为空'}), 400

    sanitize_dict(data, ['name', 'description', 'category', 'image'])

    name = data.get('name', '').strip()
    if not name:
        return jsonify({'message': '菜品名称不能为空'}), 400
    err = validate_length(name, '菜品名称', MAX_NAME_LEN)
    if err:
        return jsonify({'message': err}), 400

    description = data.get('description', '')
    err = validate_length(description, '描述', MAX_DESC_LEN)
    if err:
        return jsonify({'message': err}), 400

    try:
        price = float(data.get('price', 0))
        if price <= 0:
            return jsonify({'message': '价格必须大于0'}), 400
    except (ValueError, TypeError):
        return jsonify({'message': '价格格式无效'}), 400

    cur = g.db.execute(
        "INSERT INTO dishes (name, description, price, image, category, available) VALUES (?,?,?,?,?,?)",
        (name, description, price,
         data.get('image', ''), data.get('category', '其他'), data.get('available', 1))
    )
    g.db.commit()
    return jsonify({'id': cur.lastrowid, 'message': '添加成功'}), 201


@app.route('/api/admin/dishes/<int:dish_id>', methods=['PUT'])
@admin_required
def admin_update_dish(dish_id):
    data = request.json
    if not data:
        return jsonify({'message': '请求体不能为空'}), 400

    cur = g.db.execute("SELECT id FROM dishes WHERE id=?", (dish_id,))
    if not cur.fetchone():
        return jsonify({'message': '菜品不存在'}), 404

    sanitize_dict(data, ['name', 'description', 'category', 'image'])

    name = data.get('name', '').strip()
    if not name:
        return jsonify({'message': '菜品名称不能为空'}), 400
    err = validate_length(name, '菜品名称', MAX_NAME_LEN)
    if err:
        return jsonify({'message': err}), 400

    description = data.get('description', '')
    err = validate_length(description, '描述', MAX_DESC_LEN)
    if err:
        return jsonify({'message': err}), 400

    try:
        price = float(data.get('price', 0))
        if price <= 0:
            return jsonify({'message': '价格必须大于0'}), 400
    except (ValueError, TypeError):
        return jsonify({'message': '价格格式无效'}), 400

    g.db.execute(
        "UPDATE dishes SET name=?, description=?, price=?, image=?, category=?, available=? WHERE id=?",
        (name, description, price,
         data.get('image', ''), data.get('category', '其他'), data.get('available', 1), dish_id)
    )
    g.db.commit()
    return jsonify({'message': '更新成功'})


@app.route('/api/admin/dishes/<int:dish_id>', methods=['DELETE'])
@admin_required
def admin_delete_dish(dish_id):
    cur = g.db.execute("SELECT id, available FROM dishes WHERE id=?", (dish_id,))
    dish = cur.fetchone()
    if not dish:
        return jsonify({'message': '菜品不存在'}), 404
    if not dish['available']:
        return jsonify({'message': '菜品已下架'}), 400
    g.db.execute("UPDATE dishes SET available=0 WHERE id=?", (dish_id,))
    g.db.commit()
    return jsonify({'message': '删除成功'})


# ---------- Orders ----------

MAX_ITEM_QUANTITY = 99


@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    if not data:
        return jsonify({'message': '请求体不能为空'}), 400

    sanitize_dict(data, ['customer_name', 'phone', 'address'])

    items = data.get('items', [])
    if not items:
        return jsonify({'message': '订单为空'}), 400

    customer_name = data.get('customer_name', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()

    if not customer_name:
        return jsonify({'message': '姓名不能为空'}), 400
    if not phone:
        return jsonify({'message': '手机号不能为空'}), 400
    if not address:
        return jsonify({'message': '配送地址不能为空'}), 400

    err = validate_phone(phone)
    if err:
        return jsonify({'message': err}), 400
    err = validate_length(customer_name, '姓名', MAX_NAME_LEN)
    if err:
        return jsonify({'message': err}), 400
    err = validate_length(phone, '手机号', MAX_PHONE_LEN)
    if err:
        return jsonify({'message': err}), 400
    err = validate_length(address, '配送地址', MAX_ADDRESS_LEN)
    if err:
        return jsonify({'message': err}), 400

    # Validate items and re-calculate prices from DB
    order_items = []
    total = 0.0
    unavailable = []
    for item in items:
        dish_id = item.get('dish_id')
        quantity = item.get('quantity', 0)
        if not isinstance(dish_id, int) or dish_id <= 0:
            return jsonify({'message': f'菜品ID格式无效: {dish_id}'}), 400
        if not isinstance(quantity, int) or quantity <= 0:
            return jsonify({'message': f'无效的菜品项: {item}'}), 400
        if quantity > MAX_ITEM_QUANTITY:
            return jsonify({'message': f'单品数量不能超过{MAX_ITEM_QUANTITY}'}), 400
        cur = g.db.execute("SELECT id, name, price, available FROM dishes WHERE id=?", (dish_id,))
        dish = cur.fetchone()
        if not dish:
            return jsonify({'message': f'菜品不存在: ID {dish_id}'}), 400
        if not dish['available']:
            unavailable.append(dish['name'])
        order_items.append({
            'dish_id': dish['id'],
            'dish_name': dish['name'],
            'price': dish['price'],
            'quantity': quantity,
        })
        total += dish['price'] * quantity

    if unavailable:
        return jsonify({'message': f'以下菜品已下架: {", ".join(unavailable)}'}), 400

    lookup_token = secrets.token_hex(16)

    try:
        cur = g.db.execute(
            "INSERT INTO orders (customer_name, phone, address, total_price, lookup_token) VALUES (?,?,?,?,?)",
            (customer_name, phone, address, total, lookup_token)
        )
        order_id = cur.lastrowid
        for item in order_items:
            g.db.execute(
                "INSERT INTO order_items (order_id, dish_id, dish_name, quantity, price) VALUES (?,?,?,?,?)",
                (order_id, item['dish_id'], item['dish_name'], item['quantity'], item['price'])
            )
        g.db.commit()
    except Exception:
        g.db.rollback()
        return jsonify({'message': '下单失败，请重试'}), 500

    return jsonify({'order_id': order_id, 'lookup_token': lookup_token, 'message': '下单成功'}), 201


@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    token = request.args.get('token', '').strip()
    cur = g.db.execute("SELECT * FROM orders WHERE id=?", (order_id,))
    order = cur.fetchone()
    if not order:
        return jsonify({'message': '订单不存在'}), 404
    if not token:
        return jsonify({'message': '请提供订单查询凭证'}), 400
    if token != order['lookup_token']:
        return jsonify({'message': '查询凭证不正确'}), 403
    cur = g.db.execute("SELECT * FROM order_items WHERE order_id=?", (order_id,))
    items = [dict(row) for row in cur.fetchall()]
    result = dict(order)
    result.pop('lookup_token', None)
    result['items'] = items
    return jsonify(result)


@app.route('/api/admin/orders', methods=['GET'])
@admin_required
def admin_get_orders():
    status = request.args.get('status')
    if status:
        cur = g.db.execute(
            "SELECT * FROM orders WHERE status=? ORDER BY created_at DESC",
            (status,)
        )
    else:
        cur = g.db.execute("SELECT * FROM orders ORDER BY created_at DESC")
    orders = []
    order_ids = []
    for row in cur.fetchall():
        order = dict(row)
        order.pop('lookup_token', None)
        orders.append(order)
        order_ids.append(order['id'])

    if order_ids:
        placeholders = ','.join('?' * len(order_ids))
        cur2 = g.db.execute(
            f"SELECT * FROM order_items WHERE order_id IN ({placeholders})",
            order_ids
        )
        items_by_order = {}
        for item_row in cur2.fetchall():
            item = dict(item_row)
            items_by_order.setdefault(item['order_id'], []).append(item)
        for order in orders:
            order['items'] = items_by_order.get(order['id'], [])
    else:
        for order in orders:
            order['items'] = []

    return jsonify(orders)


STATUS_FLOW = {
    'pending': {'confirmed', 'cancelled'},
    'confirmed': {'preparing', 'cancelled'},
    'preparing': {'delivering', 'cancelled'},
    'delivering': {'completed', 'cancelled'},
    'completed': set(),
    'cancelled': set(),
}

NEXT_STATUS_OPTIONS = {
    'pending': [('confirmed', '已确认'), ('cancelled', '已取消')],
    'confirmed': [('preparing', '制作中'), ('cancelled', '已取消')],
    'preparing': [('delivering', '配送中'), ('cancelled', '已取消')],
    'delivering': [('completed', '已完成'), ('cancelled', '已取消')],
    'completed': [],
    'cancelled': [],
}


@app.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def admin_update_order_status(order_id):
    data = request.json
    if not data:
        return jsonify({'message': '请求体不能为空'}), 400

    new_status = data.get('status')
    if new_status not in STATUS_FLOW:
        return jsonify({'message': '无效的状态'}), 400

    cur = g.db.execute("SELECT status FROM orders WHERE id=?", (order_id,))
    order = cur.fetchone()
    if not order:
        return jsonify({'message': '订单不存在'}), 404

    current = order['status']
    if new_status not in STATUS_FLOW.get(current, set()):
        return jsonify({'message': f'状态不能从「{current}」变为「{new_status}」'}), 400

    g.db.execute("UPDATE orders SET status=? WHERE id=?", (new_status, order_id))
    g.db.commit()
    return jsonify({'message': '状态更新成功'})


@app.route('/api/admin/orders/<int:order_id>/next-statuses', methods=['GET'])
@admin_required
def admin_get_next_statuses(order_id):
    cur = g.db.execute("SELECT status FROM orders WHERE id=?", (order_id,))
    order = cur.fetchone()
    if not order:
        return jsonify({'message': '订单不存在'}), 404
    return jsonify({'current': order['status'], 'next': NEXT_STATUS_OPTIONS.get(order['status'], [])})


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
