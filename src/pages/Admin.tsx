import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom'
import './Admin.css'

// Wysylka kodu 2FA przez EmailJS — bez backendu, dziala na kazdym hostingu.
// Klucze ustaw w .env / .env.production przed buildem (patrz .env.example).
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
// Adres, na ktory trafia kod 2FA — ustaw przez VITE_ADMIN_EMAIL w .env / .env.production
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'farencjuszek@gmail.com'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function DashboardContent() {
  const recentSales = [
    { id: '#1084', product: 'SVIP', buyer: 'KacperX', amount: '25,99 zl', time: '2 min temu' },
    { id: '#1083', product: 'VIP', buyer: 'NoNamePL', amount: '15,99 zl', time: '11 min temu' },
    { id: '#1082', product: 'Klucz epicki x3', buyer: 'MoonCat', amount: '11,97 zl', time: '27 min temu' },
    { id: '#1081', product: 'Wsparcie serwera', buyer: 'Karolix', amount: '20,00 zl', time: '42 min temu' }
  ]

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span>1,247</span>
          <label>Uzytkownicy</label>
        </div>
        <div className="stat-card">
          <span>89</span>
          <label>Zamowienia dzis</label>
        </div>
        <div className="stat-card">
          <span>3,456 zl</span>
          <label>Przychod dzis</label>
        </div>
      </div>

      <div className="panel-card">
        <h3>Ostatnio sprzedane</h3>
        <div className="sales-list">
          {recentSales.map((sale) => (
            <div key={sale.id} className="sale-row">
              <div>
                <strong>{sale.product}</strong>
                <p>{sale.id} - {sale.buyer}</p>
              </div>
              <div className="sale-meta">
                <strong>{sale.amount}</strong>
                <p>{sale.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KuponyContent() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'WELCOME10', discount: 10, usesLeft: 34, active: true },
    { id: 2, code: 'SVIP20', discount: 20, usesLeft: 8, active: true }
  ])
  const [newCode, setNewCode] = useState('')
  const [newDiscount, setNewDiscount] = useState('10')
  const [newUses, setNewUses] = useState('10')
  const [editingId, setEditingId] = useState<number | null>(null)

  const addCoupon = () => {
    if (!newCode.trim()) return
    const coupon = {
      id: Date.now(),
      code: newCode.trim().toUpperCase(),
      discount: Number(newDiscount) || 0,
      usesLeft: Number(newUses) || 0,
      active: true
    }
    setCoupons((prev) => [coupon, ...prev])
    setNewCode('')
    setNewDiscount('10')
    setNewUses('10')
  }

  const removeCoupon = (id: number) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCoupon = (id: number, field: 'code' | 'discount' | 'usesLeft' | 'active', value: string | number | boolean) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  return (
    <div>
      <h2>Kupony</h2>
      <div className="panel-card">
        <p>Dodawaj, edytuj i usuwaj kupony rabatowe.</p>

        <div className="admin-form-row">
          <input
            className="admin-input"
            placeholder="Kod kuponu, np. WELCOME10"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
          <input
            className="admin-input small"
            type="number"
            min={1}
            max={100}
            value={newDiscount}
            onChange={(e) => setNewDiscount(e.target.value)}
          />
          <input
            className="admin-input small"
            type="number"
            min={0}
            value={newUses}
            onChange={(e) => setNewUses(e.target.value)}
          />
          <button className="admin-btn" onClick={addCoupon}>Dodaj</button>
        </div>

        <div className="admin-list">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="admin-item">
              <input
                className="admin-input"
                disabled={editingId !== coupon.id}
                value={coupon.code}
                onChange={(e) => updateCoupon(coupon.id, 'code', e.target.value.toUpperCase())}
              />
              <input
                className="admin-input small"
                disabled={editingId !== coupon.id}
                type="number"
                value={coupon.discount}
                onChange={(e) => updateCoupon(coupon.id, 'discount', Number(e.target.value))}
              />
              <input
                className="admin-input small"
                disabled={editingId !== coupon.id}
                type="number"
                value={coupon.usesLeft}
                onChange={(e) => updateCoupon(coupon.id, 'usesLeft', Number(e.target.value))}
              />
              <label className="admin-check">
                <input
                  type="checkbox"
                  disabled={editingId !== coupon.id}
                  checked={coupon.active}
                  onChange={(e) => updateCoupon(coupon.id, 'active', e.target.checked)}
                />
                Aktywny
              </label>
              {editingId === coupon.id ? (
                <button className="admin-btn ghost" onClick={() => setEditingId(null)}>Zapisz</button>
              ) : (
                <button className="admin-btn ghost" onClick={() => setEditingId(coupon.id)}>Edytuj</button>
              )}
              <button className="admin-btn danger" onClick={() => removeCoupon(coupon.id)}>Usun</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ZamowieniaContent() {
  return (
    <div>
      <h2>Zamowienia</h2>
      <div className="panel-card">
        <p>Podglad najnowszych zamowien.</p>
        <ul className="simple-list">
          <li>#1084 - SVIP - oplacone</li>
          <li>#1083 - VIP - oplacone</li>
          <li>#1082 - Klucze - oplacone</li>
        </ul>
      </div>
    </div>
  )
}

function ProduktyContent() {
  const [products, setProducts] = useState([
    { id: 'vip', name: 'VIP', price: '15,99', active: true, desc: 'Prefix [VIP], /kit vip, 5 domow' },
    { id: 'svip', name: 'SVIP', price: '25,99', active: true, desc: 'Wszystko z VIP + /fly + 10 domow' },
    { id: 'keys', name: 'Klucze do skrzynek', price: 'od 1,99', active: true, desc: 'Rzadki, epicki, legendarny, survivalowy' },
    { id: 'support', name: 'Wsparcie serwera', price: 'od 0,99', active: true, desc: 'Dowolna kwota wsparcia serwera' }
  ])
  const [editingId, setEditingId] = useState<string | null>(null)

  const updateProduct = (id: string, field: 'name' | 'price' | 'desc' | 'active', value: string | boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  return (
    <div>
      <h2>Produkty</h2>
      <div className="panel-card">
        <p>Produkty ze sklepu GlowMoon. Mozesz je edytowac:</p>
        <div className="admin-list">
          {products.map((product) => (
            <div key={product.id} className="admin-item product">
              <input
                className="admin-input"
                disabled={editingId !== product.id}
                value={product.name}
                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
              />
              <input
                className="admin-input small"
                disabled={editingId !== product.id}
                value={product.price}
                onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
              />
              <input
                className="admin-input wide"
                disabled={editingId !== product.id}
                value={product.desc}
                onChange={(e) => updateProduct(product.id, 'desc', e.target.value)}
              />
              <label className="admin-check">
                <input
                  type="checkbox"
                  disabled={editingId !== product.id}
                  checked={product.active}
                  onChange={(e) => updateProduct(product.id, 'active', e.target.checked)}
                />
                Aktywny
              </label>
              {editingId === product.id ? (
                <button className="admin-btn ghost" onClick={() => setEditingId(null)}>Zapisz</button>
              ) : (
                <button className="admin-btn ghost" onClick={() => setEditingId(product.id)}>Edytuj</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const location = useLocation()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState(1)
  const [emailCode, setEmailCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isLogged, setIsLogged] = useState(() => localStorage.getItem('admin_logged') === '1')
  const [lockout, setLockout] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [sending, setSending] = useState(false)

  const handleLogin = async () => {
    if (lockout) return

    if (login !== 'admin' || password !== 'admin123') {
      setAttempts((a) => a + 1)
      if (attempts >= 2) {
        setLockout(true)
        setTimeout(() => {
          setLockout(false)
          setAttempts(0)
        }, 300000)
      }
      alert('Bledny login lub haslo')
      return
    }

    const code = generateCode()
    setGeneratedCode(code)
    setSending(true)

    // Tryb DEV: bez kluczy EmailJS kod pokazujemy od razu (login nadal dziala)
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setStep(2)
      setSending(false)
      console.log('[DEV] Kod 2FA:', code)
      alert(`EmailJS nie jest skonfigurowany (brak kluczy w buildzie). Twoj kod: ${code}`)
      return
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            code,
            to_email: ADMIN_EMAIL
          }
        })
      })

      const text = await response.text()
      if (!response.ok) {
        throw new Error(text || `EmailJS: blad ${response.status}`)
      }

      setStep(2)
      alert('Kod wyslany. Sprawdz skrzynke odbiorcy (adres ustawiony w szablonie EmailJS).')
    } catch (error) {
      console.error('Blad:', error)
      alert(`Nie udalo sie wyslac kodu: ${error instanceof Error ? error.message : 'nieznany blad'}`)
    } finally {
      setSending(false)
    }
  }

  const verifyCode = () => {
    if (emailCode === generatedCode) {
      setIsLogged(true)
      setStep(1)
      setLogin('')
      setPassword('')
      setEmailCode('')
    } else {
      alert('Bledny kod')
      setEmailCode('')
    }
  }

  const logout = () => {
    setIsLogged(false)
    setStep(1)
    setLogin('')
    setPassword('')
    setEmailCode('')
    setGeneratedCode('')
  }

  useEffect(() => {
    if (isLogged) {
      localStorage.setItem('admin_logged', '1')
    } else {
      localStorage.removeItem('admin_logged')
    }
  }, [isLogged])

  if (!isLogged) {
    return (
      <div className="admin-page">
        <div className="admin-login-box">
          <h1>Panel Admina</h1>

          {lockout && <div className="lock-alert">Zbyt wiele prob. Zablokowane na 5 min.</div>}

          {step === 1 ? (
            <div className="login-form">
              <div className="form-group">
                <label>Login</label>
                <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="admin" disabled={lockout} />
              </div>

              <div className="form-group">
                <label>Haslo</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  disabled={lockout}
                />
              </div>

              <button className="login-btn" onClick={handleLogin} disabled={lockout || !login || !password || sending}>
                {sending ? 'Wysylanie...' : lockout ? 'Zablokowane' : 'Zaloguj'}
              </button>

              <p className="hint">Demo: admin / admin123</p>
            </div>
          ) : (
            <div className="login-form">
              <div className="email-info">
                <p>Kod wyslano na email</p>
                <small>{ADMIN_EMAIL}</small>
              </div>

              <div className="form-group">
                <label>Kod z emaila</label>
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 cyfr"
                  maxLength={6}
                />
              </div>

              <button className="login-btn" onClick={verifyCode} disabled={emailCode.length !== 6}>
                Potwierdz
              </button>

              <button className="back-btn" onClick={() => setStep(1)}>
                Wroc
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Navigate to="/admin/dashboard" replace />
  }

  const renderSection = () => {
    if (location.pathname.startsWith('/admin/kupony')) return <KuponyContent />
    if (location.pathname.startsWith('/admin/zamowienia')) return <ZamowieniaContent />
    if (location.pathname.startsWith('/admin/produkty')) return <ProduktyContent />
    return <DashboardContent />
  }

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <h3>GlowMoon Admin</h3>
        <nav>
          <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/kupony" className={({ isActive }) => (isActive ? 'active' : '')}>
            Kupony
          </NavLink>
          <NavLink to="/admin/zamowienia" className={({ isActive }) => (isActive ? 'active' : '')}>
            Zamowienia
          </NavLink>
          <NavLink to="/admin/produkty" className={({ isActive }) => (isActive ? 'active' : '')}>
            Produkty
          </NavLink>
        </nav>
        <Link className="logout" to="/admin" onClick={logout}>
          Wyloguj
        </Link>
      </aside>

      <main>{renderSection()}</main>
    </div>
  )
}
