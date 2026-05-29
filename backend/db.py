import sqlite3
from werkzeug.security import generate_password_hash
from config import Config

DB_PATH = Config.DATABASE_PATH


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            price REAL NOT NULL,
            image TEXT DEFAULT '',
            category TEXT DEFAULT '其他',
            available INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            dish_id INTEGER NOT NULL,
            dish_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (dish_id) REFERENCES dishes(id)
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );
    ''')
    cur = conn.execute("SELECT COUNT(*) FROM admins")
    if cur.fetchone()[0] == 0:
        conn.execute(
            "INSERT INTO admins (username, password_hash) VALUES ('admin', ?)",
            (generate_password_hash('Admin@2026!Secure'),)
        )
    cur = conn.execute("SELECT COUNT(*) FROM dishes")
    if cur.fetchone()[0] == 0:
        dishes = [
            ('宫保鸡丁', '经典川菜，花生与鸡丁的完美搭配', 28.0, '', '川菜'),
            ('红烧肉', '入口即化的家常红烧肉', 35.0, '', '家常菜'),
            ('鱼香肉丝', '酸甜微辣，下饭神器', 26.0, '', '川菜'),
            ('番茄炒蛋', '简单美味的家常菜', 18.0, '', '家常菜'),
            ('麻辣香锅', '自选食材，麻辣鲜香', 42.0, '', '川菜'),
            ('蛋炒饭', '粒粒分明的经典炒饭', 15.0, '', '主食'),
            ('酸辣汤', '酸辣开胃的暖心汤', 12.0, '', '汤品'),
            ('可乐', '冰镇可口可乐', 5.0, '', '饮品'),
        ]
        conn.executemany(
            "INSERT INTO dishes (name, description, price, image, category) VALUES (?,?,?,?,?)",
            dishes
        )
    conn.commit()
    conn.close()


if __name__ == '__main__':
    init_db()
    print("Database initialized.")
