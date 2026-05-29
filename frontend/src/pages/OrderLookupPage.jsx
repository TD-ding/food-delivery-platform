import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OrderLookupPage() {
  const [orderId, setOrderId] = useState('')
  const navigate = useNavigate()

  const handleLookup = e => {
    e.preventDefault()
    if (orderId.trim()) navigate(`/order/${orderId.trim()}`)
  }

  return (
    <div className="order-lookup">
      <h2>查询订单</h2>
      <form onSubmit={handleLookup}>
        <div className="lookup-input">
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="输入订单号"
            type="number"
          />
          <button type="submit">查询</button>
        </div>
      </form>
    </div>
  )
}