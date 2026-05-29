import React, { useState } from 'react'

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        onLogin(data.token)
      } else {
        setError(data.message || '登录失败')
      }
    } catch {
      setError('网络错误')
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
      <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>默认账号: admin / Admin@2026!Secure</p>
    </div>
  )
}
