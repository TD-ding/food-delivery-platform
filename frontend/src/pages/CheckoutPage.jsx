import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.customer_name || !form.phone || !form.address) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '下单失败')
        return
      }
      clearCart()
      navigate(`/order/${data.order_id}`)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="checkout-form">
      <h2 style={{ marginBottom: 20 }}>确认订单</h2>
      <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 20 }}>
        {items.map(item => (
          <div key={item.dish_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
            <span>{item.dish_name} x{item.quantity}</span>
            <span style={{ color: '#ff4d4f' }}>¥{(item.price * item.quantity).toFixed(1)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #e8e8e8', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>合计</span>
          <span style={{ color: '#ff4d4f' }}>¥{total.toFixed(1)}</span>
        </div>
      </div>
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>姓名</label>
          <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="请输入姓名" required />
        </div>
        <div className="form-group">
          <label>手机号</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="请输入手机号" required />
        </div>
        <div className="form-group">
          <label>配送地址</label>
          <textarea name="address" value={form.address} onChange={handleChange} placeholder="请输入配送地址" rows={2} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
        </div>
        <button className="btn-submit" type="submit" disabled={submitting}>
          {submitting ? '提交中...' : `提交订单 ¥${total.toFixed(1)}`}
        </button>
      </form>
    </div>
  )
}