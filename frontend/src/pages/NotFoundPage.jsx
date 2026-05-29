import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1 style={{ fontSize: 72, color: '#ff4d4f', marginBottom: 16 }}>404</h1>
      <p style={{ fontSize: 18, color: '#999', marginBottom: 24 }}>页面不存在</p>
      <Link to="/" style={{ padding: '10px 24px', background: '#ff4d4f', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
        返回首页
      </Link>
    </div>
  )
}
