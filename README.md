# 美食外卖平台 Food Delivery Platform

一个全栈外卖订购平台，包含用户端和管理后台。

## 技术栈

- **前端**: React 18 + Vite + React Router + 纯 CSS
- **后端**: Python Flask + Flask-CORS
- **数据库**: SQLite

## 功能

### 用户端
- 浏览菜品菜单（按分类筛选）
- 加入购物车 / 修改数量
- 填写信息下单
- 查看订单状态
- 按订单号查询订单

### 管理后台
- 管理员登录（默认账号: admin / admin123）
- 菜品增删改查
- 订单列表查看与状态管理

## 快速启动

```bash
# 1. 安装后端依赖
cd backend
pip install -r requirements.txt

# 2. 初始化数据库并启动后端
python app.py
# 后端运行在 http://localhost:5000

# 3. 新终端 - 安装前端依赖并启动
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000
```

打开浏览器访问 http://localhost:3000

## 项目结构

```
food-delivery-platform/
├── backend/
│   ├── app.py          # Flask 主应用
│   ├── db.py           # 数据库初始化与连接
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/
│       │   └── CartContext.jsx
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

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dishes | 获取菜品列表（支持?category=筛选） |
| GET | /api/dishes/categories | 获取菜品分类 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders/:id | 查询订单 |
| POST | /api/admin/login | 管理员登录 |
| GET | /api/admin/dishes | 获取所有菜品（含下架） |
| POST | /api/admin/dishes | 添加菜品 |
| PUT | /api/admin/dishes/:id | 修改菜品 |
| DELETE | /api/admin/dishes/:id | 删除菜品（软删除） |
| GET | /api/admin/orders | 获取所有订单 |
| PUT | /api/admin/orders/:id/status | 更新订单状态 |
