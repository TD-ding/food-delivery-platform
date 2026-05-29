import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import AdminLogin from './AdminLogin'
import AdminDishes from './AdminDishes'
import AdminOrders from './AdminOrders'

export default function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const location = useLocation()

  const isLoggedIn = !!token

  const logout = () => {
    setToken('')
    localStorage.removeItem('admin_token')
  }

  if (!isLoggedIn && !location.pathname.endsWith('/login')) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={t => { setToken(t); localStorage.setItem('admin_token', t) }} />
  }

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <Link to="/admin/dishes" className={location.pathname.includes('dishes') ? 'active' : ''}>菜品管理</Link>
        <Link to="/admin/orders" className={location.pathname.includes('orders') ? 'active' : ''}>订单管理</Link>
        <button onClick={logout} style={{ margin: '12px 24px', color: '#999', background: 'none', fontSize: 14, textAlign: 'left' }}>退出登录</button>
      </nav>
      <div className="admin-content">
        <Routes>
          <Route path="dishes" element={<AdminDishes token={token} />} />
          <Route path="orders" element={<AdminOrders token={token} />} />
          <Route path="*" element={<Navigate to="/admin/dishes" replace />} />
        </Routes>
      </div>
    </div>
  )
}