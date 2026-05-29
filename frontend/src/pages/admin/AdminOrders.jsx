import React, { useState, useEffect } from 'react'
import { LoadingSpinner, StatusBadge, STATUS_OPTIONS } from '../Shared'
import { get, put, ApiError } from '../../api'

export default function AdminOrders({ token, onAuthError }) {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const url = filter ? `/api/admin/orders?status=${filter}` : '/api/admin/orders'
    get(url).then(data => {
      setOrders(data)
    }).catch(err => {
      if (err.status === 401) onAuthError()
    }).finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const updateStatus = async (orderId, status) => {
    try {
      await put(`/api/admin/orders/${orderId}/status`, { status })
      load()
    } catch (err) {
      if (err.status === 401) onAuthError()
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>订单管理</h3>
          <select className="status-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">全部状态</option>
            {STATUS_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {orders.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无订单</p>}
        {orders.map(order => (
          <div key={order.id} className="order-card" style={{ marginTop: 12 }}>
            <div className="order-header">
              <span className="order-id">订单 #{order.id}</span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              {order.customer_name} | {order.phone} | {order.address}
            </div>
            <div className="order-items-list">
              {order.items && order.items.map(item => (
                <div key={item.id} className="order-item-row">
                  <span>{item.dish_name} x{item.quantity}</span>
                  <span>¥{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-footer">
              <div>
                <span className="order-total">¥{order.total_price.toFixed(2)}</span>
                <span className="order-time" style={{ marginLeft: 12 }}>{order.created_at}</span>
              </div>
              <select
                className="status-select"
                value={order.status}
                onChange={e => updateStatus(order.id, e.target.value)}
              >
                {STATUS_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
