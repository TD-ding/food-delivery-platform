import React, { useState } from 'react'
import { post, ApiError } from '../../api'

const isDev = import.meta.env.DEV

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      const data = await post('/api/admin/login', { username, password }, { auth: false })
      if (data.success) {
        onLogin(data.token)
      } else {
        setError(data.message || '登录失败')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '网络错误')
    }
  }

  return (
    <div className="admin-login">
      <h2>管理后台登录</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">登录</button>
        {error && <p className="error-msg">{error}</p>}
      </form>
      {isDev && <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>默认账号: admin / Admin@2026!Secure</p>}
    </div>
  )
}
