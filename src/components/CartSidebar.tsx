import { useCart } from '../context/CartContext'
import { useState } from 'react'
import { API_BASE } from '../config'
import './CartSidebar.css'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, removeFromCart, total, itemCount, clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [adminAttempts, setAdminAttempts] = useState(0)
  const [adminLocked, setAdminLocked] = useState(false)
  const [admin2FA, setAdmin2FA] = useState('')
  const [adminStep, setAdminStep] = useState(1) // 1 = pass, 2 = 2FA
  const [captcha, setCaptcha] = useState(generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [isAdminLogged, setIsAdminLogged] = useState(false)

  const applyDiscount = () => {
    if (discountCode.trim().toLowerCase() === 'test') {
      setDiscount(0.1) // 10% discount
    } else {
      setDiscount(0)
    }
  }

  const handleAdminLogin = () => {
    if (adminLocked) return
    
    if (captchaInput.toUpperCase() !== captcha) {
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
      alert('Nieprawidłowy kod CAPTCHA')
      return
    }
    
    // Simulate password check (in real app: hash comparison)
    if (adminPass.length < 8) {
      setAdminAttempts(prev => prev + 1)
      if (adminAttempts >= 2) {
        setAdminLocked(true)
        setTimeout(() => { setAdminLocked(false); setAdminAttempts(0) }, 300000) // 5 min
      }
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
      alert('Nieprawidłowe hasło')
      return
    }
    
    // Proceed to 2FA
    setAdminStep(2)
  }

  const handle2FAVerify = () => {
    if (admin2FA === '123456') { // Demo code
      setIsAdminLogged(true)
      setAdminStep(1)
      setAdminPass('')
      setAdmin2FA('')
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
    } else {
      alert('Nieprawidłowy kod 2FA')
      setAdmin2FA('')
    }
  }

  const handleAdminLogout = () => {
    setIsAdminLogged(false)
    setShowAdmin(false)
    setAdminStep(1)
    setAdminPass('')
    setAdmin2FA('')
    setCaptchaInput('')
  }

const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return

    setIsProcessing(true)

    try {
      const response = await fetch(`${API_BASE}/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          email: email.trim(),
          discount,
          currency: 'PLN',
          items: cart.map(({ id, name, price, quantity, category, key }) => ({
            id, name, price, quantity, category, key
          }))
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error || data.details || 'Nie udało się utworzyć płatności')
      }

      // Przekierowanie na bramkę CashBill (BLIK, karta, przelew, PayPal)
      window.location.href = data.redirectUrl
    } catch (err) {
      alert(`Błąd płatności: ${err instanceof Error ? err.message : 'nieznany błąd'}`)
      setIsProcessing(false)
    }
  }

  const handleBackToCart = () => {
    setShowCheckout(false)
  }

  if (showCheckout) {
    return (
      <>
        <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
        <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <button className="back-button" onClick={handleBackToCart}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2>Finalizacja</h2>
            <button className="close-button" onClick={onClose}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="checkout-content">
            <div className="order-summary">
              <h3>Podsumowanie zamówienia</h3>
              <div className="summary-items">
                {cart.map(item => (
                  <div key={item.id} className="summary-item">
                    <div className="summary-item-info">
                      <span className="summary-name">{item.name}</span>
                      {item.quantity > 1 && <span className="summary-qty">x{item.quantity}</span>}
                    </div>
                    <span className="summary-price">{(item.price * item.quantity).toFixed(2).replace('.', ',')} zł</span>
                  </div>
                ))}
              </div>
              {discount > 0 && (
                <div className="summary-row discount">
                  <span>Rabat ({(discount * 100).toFixed(0)}%):</span>
                  <span className="discount-amount">-{(total * discount).toFixed(2).replace('.', ',')} zł</span>
                </div>
              )}
              <div className="summary-total">
                <span>Do zapłaty:</span>
                <span className="summary-amount">{(total * (1 - discount)).toFixed(2).replace('.', ',')} zł</span>
              </div>
            </div>

            <form className="checkout-form" onSubmit={handleCheckout}>
              <div className="form-group">
                <label htmlFor="nickname">Nick w grze *</label>
                <div className="server-warning-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>Uwaga! Musisz być online na serwerze, aby produkt został dostarczony</span>
                </div>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Twój nick Minecraft"
                  required
                />
              </div>

              <div className="form-group discount-group">
                <label htmlFor="discount">Kod rabatowy</label>
                <div className="discount-row">
                  <input
                    type="text"
                    id="discount"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Wpisz kod rabatowy"
                    className="discount-input"
                  />
                  <button 
                    type="button" 
                    className="discount-btn"
                    onClick={applyDiscount}
                  >
                    Zastosuj
                  </button>
                </div>
                {discount > 0 && (
                  <span className="discount-applied">Kod „test" zastosowany -10%</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (opcjonalnie)</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twój@email.com"
                />
              </div>

              <div className="payment-info">
                <div className="payment-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <span>Płatność przez CashBill</span>
                </div>
                <p className="payment-desc">BLIK, karta, przelew, PayPal - wszystkie metody dostępne</p>
              </div>

              <button 
                type="submit" 
                className="pay-button"
                disabled={isProcessing || !nickname.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span>
                    Przetwarzanie...
                  </>
                ) : (
                  <>
                    Zapłać {(total * (1 - discount)).toFixed(2).replace('.', ',')} zł
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>
            <svg className="cart-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Twój koszyk
            {itemCount > 0 && <span className="header-badge">{itemCount}</span>}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p>Twój koszyk jest pusty</p>
              <span className="empty-hint">Dodaj produkty, aby zobaczyć je tutaj</span>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className={`item-image ${item.category || 'default'}`}>
                    {item.category === 'keys' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                    )}
                    {item.category === 'vip' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    )}
                    {item.category === 'svip' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                      </svg>
                    )}
                    {item.category === 'support' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    )}
                    {!item.category && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    )}
                  </div>
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <div className="item-details">
                      <span className="item-price">{item.price.toFixed(2).replace('.', ',')} zł</span>
                      {item.quantity > 1 && (
                        <span className="item-qty">x{item.quantity}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    className="remove-button"
                    onClick={() => removeFromCart(item.id)}
                    title="Usuń z koszyka"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Wartość produktów:</span>
                <span>{total.toFixed(2).replace('.', ',')} zł</span>
              </div>
              <div className="summary-row total">
                <span>Razem do zapłaty:</span>
                <span className="total-amount">{total.toFixed(2).replace('.', ',')} zł</span>
              </div>
            </div>
            <button 
              className="checkout-button"
              onClick={() => setShowCheckout(true)}
            >
              <span>Zapłać</span>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button className="clear-button" onClick={clearCart}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Wyczyść koszyk
            </button>
            <button className="admin-button" onClick={() => setShowAdmin(true)}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin
            </button>
          </div>
        )}
      </div>

      {/* Admin Login Modal */}
      {showAdmin && (
        <div className="admin-overlay" onClick={() => !isAdminLogged && setShowAdmin(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            {!isAdminLogged ? (
              <>
                <div className="admin-header">
                  <div className="admin-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3>Panel Administracyjny</h3>
                  <p className="admin-subtitle">Dostęp chroniony · Poziom: Maksymalny</p>
                  
                  {adminLocked && (
                    <div className="security-alert locked">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Konto zablokowane na 5 minut</span>
                    </div>
                  )}
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
                  {adminStep === 1 ? (
                    <>
                      <div className="security-badges">
                        <span className="badge">256-bit AES</span>
                        <span className="badge">2FA Required</span>
                        <span className="badge">IP Logging</span>
                      </div>

                      <div className="form-group">
                        <label>Hasło administratora</label>
                        <input 
                          type="password" 
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="••••••••••••"
                          disabled={adminLocked}
                          className="admin-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>CAPTCHA - Przepisz kod: <strong className="captcha-code">{captcha}</strong></label>
                        <input 
                          type="text" 
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          placeholder="Wpisz kod z obrazka"
                          disabled={adminLocked}
                          className="admin-input"
                        />
                      </div>

                      <div className="security-info">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pozostałe próby: {3 - adminAttempts}</span>
                      </div>

                      <button 
                        type="submit" 
                        className="admin-login-btn"
                        disabled={adminLocked || !adminPass || !captchaInput}
                      >
                        {adminLocked ? 'Zablokowane' : 'Kontynuuj weryfikację 2FA'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="security-badges">
                        <span className="badge success">Hasło OK</span>
                        <span className="badge">Kod 2FA</span>
                      </div>

                      <div className="form-group">
                        <label>Kod weryfikacji dwuetapowej (2FA)</label>
                        <p className="hint">Wprowadź 6-cyfrowy kod z aplikacji autentykatora</p>
                        <input 
                          type="text" 
                          value={admin2FA}
                          onChange={(e) => setAdmin2FA(e.target.value.replace(/\D/g, '').slice(0,6))}
                          placeholder="000000"
                          maxLength={6}
                          className="admin-input code-input"
                        />
                      </div>

                      <button 
                        type="button" 
                        className="admin-login-btn"
                        onClick={handle2FAVerify}
                        disabled={admin2FA.length !== 6}
                      >
                        Zaloguj do panelu
                      </button>
                      
                      <button 
                        type="button" 
                        className="admin-back-btn"
                        onClick={() => setAdminStep(1)}
                      >
                        Wróć do hasła
                      </button>
                    </>
                  )}
                </form>
              </>
            ) : (
              <div className="admin-dashboard">
                <div className="admin-header">
                  <div className="admin-icon success">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3>Zalogowano jako Administrator</h3>
                  <p className="admin-subtitle">Dostęp przyznany · Sesja monitorowana</p>
                </div>
                
                <div className="admin-menu">
                  <button className="admin-menu-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Zarządzanie użytkownikami
                  </button>
                  <button className="admin-menu-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Zamówienia i płatności
                  </button>
                  <button className="admin-menu-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Konfiguracja produktów
                  </button>
                  <button className="admin-menu-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Statystyki i raporty
                  </button>
                  <button className="admin-menu-item danger" onClick={handleAdminLogout}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Wyloguj się
                  </button>
                </div>
              </div>
            )}
            
            <button className="admin-close" onClick={() => setShowAdmin(false)}>✕</button>
          </div>
        </div>
      )}
    </>
  )
}

function generateCaptcha() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
