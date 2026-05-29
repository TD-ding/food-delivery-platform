import React, { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { LoadingSpinner } from '../Shared'
import { get, ApiError } from '../api'

const FOOD_ICONS = {
  '川菜': '🌶️', '家常菜': '🏠', '主食': '🍚', '汤品': '🥣', '饮品': '🥤', '其他': '🍽️'
}

export default function MenuPage() {
  const [dishes, setDishes] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem } = useCart()

  useEffect(() => {
    setLoading(true)
    get('/api/dishes/categories', { auth: false })
      .then(cats => {
        setCategories(cats)
        if (cats.length > 0) setActiveCat(cats[0])
      })
      .catch(() => setError('加载分类失败，请刷新重试'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeCat && categories.length === 0) return
    const url = activeCat ? `/api/dishes?category=${encodeURIComponent(activeCat)}` : '/api/dishes'
    get(url, { auth: false })
      .then(setDishes)
      .catch(() => setError('加载菜品失败，请刷新重试'))
  }, [activeCat])

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 20px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>重试</button>
    </div>
  )

  return (
    <div>
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-tab ${activeCat === cat ? 'active' : ''}`}
            onClick={() => setActiveCat(cat)}
          >
            {FOOD_ICONS[cat] || '🍽️'} {cat}
          </button>
        ))}
        <button
          className={`category-tab ${activeCat === '' ? 'active' : ''}`}
          onClick={() => setActiveCat('')}
        >
          全部
        </button>
      </div>
      <div className="dish-grid">
        {dishes.map(dish => (
          <div key={dish.id} className="dish-card">
            <div className="dish-image">{FOOD_ICONS[dish.category] || '🍽️'}</div>
            <div className="dish-info">
              <div className="dish-name">{dish.name}</div>
              <div className="dish-desc">{dish.description}</div>
              <div className="dish-bottom">
                <div className="dish-price">{dish.price}</div>
                <button className="btn-add-cart" onClick={() => addItem(dish)}>加入购物车</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
