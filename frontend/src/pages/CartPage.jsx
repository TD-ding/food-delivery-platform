import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { items, updateQuantity, total } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <p>购物车是空的</p>
        <p style={{ marginTop: 8, fontSize: 14, color: '#bbb' }}>去菜单页面挑选美食吧</p>
      </div>
    )
  }

  return (
    <div className="cart-page">
      {items.map(item => (
        <div key={item.dish_id} className="cart-item">
          <div className="cart-item-name">{item.dish_name}</div>
          <div className="quantity-control">
            <button className="quantity-btn" onClick={() => updateQuantity(item.dish_id, -1)}>-</button>
            <span className="quantity-num">{item.quantity}</span>
            <button className="quantity-btn" onClick={() => updateQuantity(item.dish_id, 1)}>+</button>
          </div>
          <div className="cart-item-price">¥{(item.price * item.quantity).toFixed(2)}</div>
        </div>
      ))}
      <div className="cart-summary">
        <div className="cart-total">
          <span>合计</span>
          <span className="cart-total-price">¥{total.toFixed(2)}</span>
        </div>
        <button className="btn-checkout" onClick={() => navigate('/checkout')}>去结算</button>
      </div>
    </div>
  )
}
