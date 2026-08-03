import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useState } from 'react'
import CartSidebar from './CartSidebar'
import './Navigation.css'

export default function Navigation() {
  const location = useLocation()
  const { itemCount, total } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="GlowMoon" className="logo-img" />
            </div>
            <span className="logo-text">GlowMoon</span>
          </Link>
          
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/produkty" className={`nav-link ${isActive('/produkty') ? 'active' : ''}`}>
              Produkty
            </Link>
            <Link to="/o-nas" className={`nav-link ${isActive('/o-nas') ? 'active' : ''}`}>
              O nas
            </Link>
            <Link to="/regulamin" className={`nav-link ${isActive('/regulamin') ? 'active' : ''}`}>
              Regulamin
            </Link>
          </div>
          
          <button className="cart-button" onClick={() => setIsCartOpen(true)}>
            <svg className="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="nav-cart-total">{total.toFixed(2).replace('.', ',')} zł</span>
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </button>
        </div>
      </nav>
      
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
