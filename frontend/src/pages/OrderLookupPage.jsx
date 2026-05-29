import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OrderLookupPage() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const navigate = useNavigate()

  const handleLookup = e => {
    e.preventDefault()
    if (orderId.trim() && phone.trim()) {
      navigate(`/order/${orderId.trim()}?phone=${encodeURIComponent(phone.trim())}`)
    }
  }

  return (
    <div className="order-lookup">
      <h2>查询订单</h2>
      <form onSubmit={handleLookup}>
        <div style={{ marginBottom: 12 }}>
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="输入订单号"
            type="number"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="输入下单手机号"
            required
          />
        </div>
        <button type="submit">查询</button>
      </form>
    </div>
  )
}
