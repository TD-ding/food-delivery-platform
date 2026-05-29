import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const CartContext = createContext()

const STORAGE_KEY = 'food_delivery_cart'

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    saveCart(items)
  }, [items])

  const addItem = useCallback((dish) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.dish_id === dish.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [...prev, { dish_id: dish.id, dish_name: dish.name, price: dish.price, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((dish_id, delta) => {
    setItems(prev => {
      const next = prev.map(i =>
        i.dish_id === dish_id ? { ...i, quantity: i.quantity + delta } : i
      ).filter(i => i.quantity > 0)
      return next
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
