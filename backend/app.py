from flask import Flask, request, jsonify, g
from flask_cors import CORS
from db import get_db, init_db
import hashlib

app = Flask(__name__)
CORS(app)


@app.before_request
def before_request():
    g.db = get_db()


@app.teardown_request
def teardown_request(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()


# ---------- Auth ----------

def hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()


def check_admin():
    auth = request.headers.get('Authorization', '')
    # Simple token check: "Basic base64(username:password)"
    import base64
    try:
        scheme, token = auth.split(' ', 1)
        decoded = base64.b64decode(token).decode()
        username, password = decoded.split(':', 1)
    except Exception:
        return None
    cur = g.db.execute(
        "SELECT id FROM admins WHERE username=? AND password=?",
        (username, hash_password(password))
    )
    row = cur.fetchone()
    return row['id'] if row else None


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    cur = g.db.execute(
        "SELECT id, username FROM admins WHERE username=? AND password=?",
        (username, hash_password(password))
    )
    row = cur.fetchone()
    if row:
        import base64
        token = base64.b64encode(f"{username}:{password}".encode()).decode()
        return jsonify({'success': True, 'token': token, 'username': row['username']})
    return jsonify({'success': False, 'message': '用户名或密码错误'}), 401


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
def admin_get_dishes():
    if not check_admin():
        return jsonify({'message': '未授权'}), 401
    cur = g.db.execute("SELECT * FROM dishes ORDER BY id")
    return jsonify([dict(row) for row in cur.fetchall()])


@app.route('/api/admin/dishes', methods=['POST'])
def admin_add_dish():
    if not check_admin():
        return jsonify({'message': '未授权'}), 401
    data = request.json
    cur = g.db.execute(
        "INSERT INTO dishes (name, description, price, image, category, available) VALUES (?,?,?,?,?,?)",
        (data['name'], data.get('description', ''), data['price'],
         data.get('image', ''), data.get('category', '其他'), data.get('available', 1))
    )
    g.db.commit()
    return jsonify({'id': cur.lastrowid, 'message': '添加成功'}), 201


@app.route('/api/admin/dishes/<int:dish_id>', methods=['PUT'])
def admin_update_dish(dish_id):
    if not check_admin():
        return jsonify({'message': '未授权'}), 401
    data = request.json
    g.db.execute(
        "UPDATE dishes SET name=?, description=?, price=?, image=?, category=?, available=? WHERE id=?",
        (data['name'], data.get('description', ''), data['price'],
         data.get('image', ''), data.get('category', '其他'), data.get('available', 1), dish_id)
    )
    g.db.commit()
    return jsonify({'message': '更新成功'})


@app.route('/api/admin/dishes/<int:dish_id>', methods=['DELETE'])
def admin_delete_dish(dish_id):
    if not check_admin():
        return jsonify({'message': '未授权'}), 401
    g.db.execute("UPDATE dishes SET available=0 WHERE id=?", (dish_id,))
    g.db.commit()
    return jsonify({'message': '删除成功'})


# ---------- Orders ----------

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    items = data.get('items', [])
    if not items:
        return jsonify({'message': '订单为空'}), 400
    total = sum(item['price'] * item['quantity'] for item in items)
    cur = g.db.execute(
        "INSERT INTO orders (customer_name, phone, address, total_price) VALUES (?,?,?,?)",
        (data['customer_name'], data['phone'], data['address'], total)
    )
    order_id = cur.lastrowid
    for item in items:
        g.db.execute(
            "INSERT INTO order_items (order_id, dish_id, dish_name, quantity, price) VALUES (?,?,?,?,?)",
            (order_id, item['dish_id'], item['dish_name'], item['quantity'], item['price'])
        )
    g.db.commit()
    return jsonify({'order_id': order_id, 'message': '下单成功'}), 201


@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    cur = g.db.execute("SELECT * FROM orders WHERE id=?", (order_id,))
    order = cur.fetchone()
    if not order:
        return jsonify({'message': '订单不存在'}), 404
    cur = g.db.execute("SELECT * FROM order_items WHERE order_id=?", (order_id,))
    items = [dict(row) for row in cur.fetchall()]
    result = dict(order)
    result['items'] = items
    return jsonify(result)


@app.route('/api/admin/orders', methods=['GET'])
def admin_get_orders():
    if not check_admin():
        return jsonify({'message': '未授权'}), 401
    status = request.args.get('status')
    if status:
        cur = g.db.execute("SELECT * FROM orders WHERE status=? ORDER BY created_at DESC", (status,))
    else:
        cur = g.db.execute("SELECT * FROM orders ORDER BY created_at DESC")
    orders = []
    for row in cur.fetchall():
        order = dict(row)
        cur2 = g.db.execute("SELECT * FROM order_items WHERE order_id=?", (order['id'],))
        order['items'] = [dict(r) for r in cur2.fetchall()]
        orders.append(order)
    return jsonify(orders)


@app.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
def admin_update_order_status(order_id):
    if not check_admin():
        return jsonify({'message': '未授权'}), 401
    data = request.json
    new_status = data.get('status')
    valid = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled']
    if new_status not in valid:
        return jsonify({'message': '无效的状态'}), 400
    g.db.execute("UPDATE orders SET status=? WHERE id=?", (new_status, order_id))
    g.db.commit()
    return jsonify({'message': '状态更新成功'})


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
