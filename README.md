# 美食外卖平台

一个全栈外卖订购平台，包含用户端和管理后台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + React Router + 纯 CSS |
| 后端 | Python Flask + Flask-CORS + PyJWT + Werkzeug |
| 数据库 | SQLite |
| 认证 | JWT (PyJWT) |

## 目录结构

```
food-delivery-platform/
├── backend/
│   ├── app.py          # Flask 主应用（路由 + 业务逻辑）
│   ├── auth.py         # JWT 生成/验证、admin_required 装饰器
│   ├── config.py       # 配置（SECRET_KEY、DATABASE_PATH）
│   ├── db.py           # 数据库初始化与连接
│   ├── sanitize.py     # XSS 防护（输入消毒）
│   ├── requirements.txt
│   └── .env.example    # 环境变量示例
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── index.js        # 统一请求封装（token、401处理、错误）
│       ├── components/
│       │   └── Shared.jsx    # 共享组件（LoadingSpinner、StatusBadge）
│       ├── context/
│       │   └── CartContext.jsx  # 购物车状态（localStorage 持久化）
│       └── pages/
│           ├── MenuPage.jsx
│           ├── CartPage.jsx
│           ├── CheckoutPage.jsx
│           ├── OrderStatusPage.jsx
│           ├── OrderLookupPage.jsx
│           └── admin/
│               ├── AdminApp.jsx
│               ├── AdminLogin.jsx
│               ├── AdminDishes.jsx
│               └── AdminOrders.jsx
└── README.md
```

## 如何运行

### 环境要求

- Python 3.10+
- Node.js 18+

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python app.py
```

后端运行在 http://localhost:5000

首次启动会自动创建 SQLite 数据库并初始化管理员账号：
- 用户名: `admin`
- 密码: `Admin@2026!Secure`

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000，API 请求自动代理到后端 5000 端口。

## 功能概览

### 用户端
- 浏览菜品菜单（按分类筛选）
- 加入购物车 / 修改数量
- 填写信息下单
- 查看订单状态
- 按订单号 + 查询凭证查询订单

### 管理后台
- 管理员登录（JWT 认证）
- 菜品增删改查
- 订单列表查看与状态管理

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dishes | 获取菜品列表（支持?category=筛选） |
| GET | /api/dishes/categories | 获取菜品分类 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders/:id?token=xxx | 查询订单（需查询凭证验证） |
| POST | /api/admin/login | 管理员登录 |
| POST | /api/admin/change-password | 修改管理员密码 |
| GET | /api/admin/dishes | 获取所有菜品（含下架） |
| POST | /api/admin/dishes | 添加菜品 |
| PUT | /api/admin/dishes/:id | 修改菜品 |
| DELETE | /api/admin/dishes/:id | 删除菜品（软删除） |
| GET | /api/admin/orders | 获取所有订单 |
| PUT | /api/admin/orders/:id/status | 更新订单状态 |
