import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OrderLookupPage() {
  const [orderId, setOrderId] = useState('')
  const [lookupToken, setLookupToken] = useState('')
  const navigate = useNavigate()

  const handleLookup = e => {
    e.preventDefault()
    if (orderId.trim() && lookupToken.trim()) {
      navigate(`/order/${orderId.trim()}?token=${encodeURIComponent(lookupToken.trim())}`)
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
            inputMode="numeric"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            value={lookupToken}
            onChange={e => setLookupToken(e.target.value)}
            placeholder="输入查询凭证"
            required
          />
        </div>
        <button type="submit">查询</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>查询凭证在下单成功后显示，请妥善保存</p>
    </div>
  )
}
