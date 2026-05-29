import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LoadingSpinner, StatusBadge } from '../Shared'

export default function OrderStatusPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/orders/${id}`).then(r => {
      if (!r.ok) throw new Error()
      return r.json()
    }).then(setOrder).catch(() => setError('订单不存在'))
    .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="order-status-page"><p style={{ textAlign: 'center', color: '#999' }}>{error}</p></div>
  if (!order) return <div style={{ textAlign: 'center', padding: 40 }}>订单不存在</div>

  return (
    <div className="order-status-page">
      <div className="order-card">
        <div className="order-header">
          <span className="order-id">订单 #{order.id}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="order-items-list">
          {order.items && order.items.map(item => (
            <div key={item.id} className="order-item-row">
              <span>{item.dish_name} x{item.quantity}</span>
              <span>¥{(item.price * item.quantity).toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="order-footer">
          <span className="order-total">¥{order.total_price.toFixed(1)}</span>
          <span className="order-time">{order.created_at}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/" style={{ color: '#ff4d4f' }}>继续点餐</Link>
      </div>
    </div>
  )
}