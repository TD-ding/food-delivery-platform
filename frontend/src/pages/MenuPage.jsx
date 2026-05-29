import React, { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { LoadingSpinner } from '../Shared'

const FOOD_ICONS = {
  '川菜': '🌶️', '家常菜': '🏠', '主食': '🍚', '汤品': '🥣', '饮品': '🥤', '其他': '🍽️'
}

export default function MenuPage() {
  const [dishes, setDishes] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('')
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    fetch('/api/dishes/categories').then(r => r.json()).then(cats => {
      setCategories(cats)
      if (cats.length > 0) setActiveCat(cats[0])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const url = activeCat ? `/api/dishes?category=${encodeURIComponent(activeCat)}` : '/api/dishes'
    fetch(url).then(r => r.json()).then(setDishes)
  }, [activeCat])

  if (loading) return <LoadingSpinner />

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