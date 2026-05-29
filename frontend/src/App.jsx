import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { CartProvider, useCart } from './context/CartContext'
import { ErrorBoundary } from './components/Shared'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderStatusPage from './pages/OrderStatusPage'
import OrderLookupPage from './pages/OrderLookupPage'
import AdminApp from './pages/admin/AdminApp'
import NotFoundPage from './pages/NotFoundPage'

function Header() {
  const { count } = useCart()
  return (
    <header className="header">
      <Link to="/" className="header-logo">🍜 美食外卖</Link>
      <nav className="header-nav">
        <Link to="/">菜单</Link>
        <Link to="/cart">购物车{count > 0 && <span className="cart-badge">{count}</span>}</Link>
        <Link to="/order-lookup">查订单</Link>
        <Link to="/admin">管理后台</Link>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
          <div className="app-container">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/:id" element={<OrderStatusPage />} />
                <Route path="/order-lookup" element={<OrderLookupPage />} />
                <Route path="/admin/*" element={<AdminApp />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  )
}
