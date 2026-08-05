import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom'
import { API_BASE } from '../config'
import './Admin.css'

// Wysylka kodu 2FA przez EmailJS — bez backendu, dziala na kazdym hostingu.
// Klucze ustaw w .env / .env.production przed buildem (patrz .env.example).
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
// Adres, na ktory trafia kod 2FA — ustaw przez VITE_ADMIN_EMAIL w .env / .env.production
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'farencjuszek@gmail.com'

// Token dostepu do API admina — MUSI byc TAKI SAM jak ADMIN_API_TOKEN w Vercel.
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || ''

async function adminFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string> | undefined) || {})
  }
  headers['Content-Type'] = 'application/json'
  if (ADMIN_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`
  return fetch(`${API_BASE}${path}`, { ...options, headers })
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function formatPrice(value: number) {
  return value.toFixed(2).replace('.', ',')
}

function formatFullDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function timeAgo(iso: string | null, nowTs: number) {
  if (!iso) return '—'
  const diffMin = Math.floor((nowTs - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'przed chwilą'
  if (diffMin < 60) return `${diffMin} min temu`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} godz temu`
  return formatFullDate(iso)
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Oczekuje',
  paid: 'Opłacone',
  cancelled: 'Anulowane'
}

interface RecentSale {
  orderId: string
  nickname: string
  items: string
  amount: number
  currency: string
  status: string
  delivered: boolean
  deliveryError: boolean
  couponCode: string | null
  createdAt: string | null
}

interface DashboardData {
  stats: {
    ordersToday: number
    revenueToday: number
    totalOrders: number
    totalRevenue: number
  }
  recent: RecentSale[]
  nowTs: number
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!ADMIN_TOKEN) {
      setNotice('Brak VITE_ADMIN_API_TOKEN w buildzie — panel pokazuje dane demo. Dodaj token do .env.production i przebuduj.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/stats')
      if (res.status === 401) {
        setError('Nieautoryzowany dostęp. Sprawdź ADMIN_API_TOKEN na Vercel i VITE_ADMIN_API_TOKEN w buildzie.')
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Błąd serwera (HTTP ${res.status})`)
      } else {
        setData(await res.json())
      }
    } catch {
      setError('Błąd połączenia z API admina')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats

  return (
    <div>
      <h2>Dashboard</h2>

      {notice && <div className="admin-notice">{notice}</div>}
      {error && <div className="admin-error">{error}</div>}
      {!ADMIN_TOKEN && !data && <button className="admin-btn" onClick={load}>Spróbuj ponownie</button>}

      {loading && data === null && <div className="admin-loading">Ładowanie danych…</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <span>{stats ? stats.ordersToday : '—'}</span>
          <label>Zamówienia dziś</label>
        </div>
        <div className="stat-card">
          <span>{stats ? `${formatPrice(stats.revenueToday)} zł` : '—'}</span>
          <label>Przychód dziś</label>
        </div>
        <div className="stat-card">
          <span>{stats ? stats.totalOrders : '—'}</span>
          <label>Zamówienia łącznie</label>
        </div>
        <div className="stat-card">
          <span>{stats ? `${formatPrice(stats.totalRevenue)} zł` : '—'}</span>
          <label>Przychód łącznie</label>
        </div>
      </div>

      <div className="panel-card">
        <h3>Ostatnio sprzedane</h3>
        {loading && data === null && <div className="admin-loading">Ładowanie…</div>}
        {data && data.recent.length === 0 && <p>Brak zamówień.</p>}
        {data && data.recent.length > 0 && (
          <>
            <div className="sales-head">
              <span>Produkt / zamówienie</span>
              <span className="right">Wartość</span>
              <span className="right">Czas</span>
              <span className="right">Status</span>
            </div>
            <div className="sales-list">
              {data.recent.map((sale) => (
                <div key={sale.orderId} className="sale-row">
                  <div className="sale-product">
                    <strong>{sale.items}</strong>
                    <p>
                      {sale.orderId} · {sale.nickname}
                      {sale.couponCode && <em className="sale-coupon"> kupon {sale.couponCode}</em>}
                    </p>
                  </div>
                  <div className="sale-value">
                    <strong>{formatPrice(sale.amount)} zł</strong>
                    <p>{sale.currency}</p>
                  </div>
                  <div className="sale-time">
                    <strong>{timeAgo(sale.createdAt, data.nowTs)}</strong>
                    <p>{formatFullDate(sale.createdAt)}</p>
                  </div>
                  <div className="sale-status">
                    <span
                      className={`status-pill ${sale.status}${sale.status === 'paid' && sale.delivered ? ' delivered' : ''}${
                        sale.status === 'paid' && sale.deliveryError ? ' failed' : ''
                      }`}
                    >
                      {sale.status === 'paid' && sale.delivered
                        ? 'Dostarczone'
                        : STATUS_LABELS[sale.status] || sale.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface Coupon {
  id: number
  code: string
  discount: number
  maxUses: number | null
  active: boolean
  usesCount: number
  createdAt: string
}

function KuponyContent() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newDiscount, setNewDiscount] = useState('10')
  const [newUses, setNewUses] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!ADMIN_TOKEN) {
      setNotice('Brak VITE_ADMIN_API_TOKEN w buildzie. Dodaj token do .env.production, aby zarządzać kuponami.')
      return
    }
    setError('')
    try {
      const res = await adminFetch('/api/admin/coupons')
      if (res.status === 401) {
        setError('Nieautoryzowany dostęp. Sprawdź ADMIN_API_TOKEN na Vercel i VITE_ADMIN_API_TOKEN w buildzie.')
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Błąd serwera (HTTP ${res.status})`)
      } else {
        const data = await res.json()
        setCoupons(data.coupons || [])
      }
    } catch {
      setError('Błąd połączenia z API admina')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addCoupon = async () => {
    if (!newCode.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.trim(),
          discount: Number(newDiscount) || 0,
          maxUses: newUses.trim() === '' ? null : Number(newUses)
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Nie udało się dodać kuponu')
      } else {
        setCoupons(data.coupons || [])
        setNewCode('')
        setNewDiscount('10')
        setNewUses('')
      }
    } catch {
      setError('Błąd połączenia z API admina')
    } finally {
      setSaving(false)
    }
  }

  const saveCoupon = async (coupon: Coupon) => {
    setSaving(true)
    setError('')
    try {
      const res = await adminFetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          code: coupon.code,
          discount: coupon.discount,
          maxUses: coupon.maxUses,
          active: coupon.active
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Nie udało się zapisać kuponu')
      } else {
        setEditingId(null)
        await load()
      }
    } catch {
      setError('Błąd połączenia z API admina')
    } finally {
      setSaving(false)
    }
  }

  const removeCoupon = async (id: number) => {
    if (!window.confirm('Na pewno usunąć ten kupon?')) return
    setError('')
    try {
      const res = await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Nie udało się usunąć kuponu')
      } else {
        setCoupons((prev) => (prev ? prev.filter((c) => c.id !== id) : prev))
        setEditingId(null)
      }
    } catch {
      setError('Błąd połączenia z API admina')
    }
  }

  const updateCoupon = (id: number, field: 'code' | 'discount' | 'maxUses' | 'active', value: string | number | boolean | null) => {
    setCoupons((prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)) : prev
    )
  }

  return (
    <div>
      <h2>Kupony</h2>
      <div className="panel-card">
        <p>Dodawaj, edytuj i usuwaj kupony rabatowe. Liczba użyć rośnie automatycznie po każdym opłaconym zamówieniu.</p>

        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

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
            title="Rabat w %"
            placeholder="Rabat %"
          />
          <input
            className="admin-input small"
            type="number"
            min={0}
            value={newUses}
            onChange={(e) => setNewUses(e.target.value)}
            title="Limit użyć (puste = bez limitu)"
            placeholder="Limit użyć"
          />
          <button className="admin-btn" onClick={addCoupon} disabled={saving}>
            {saving ? 'Zapisywanie…' : 'Dodaj'}
          </button>
        </div>

        <div className="coupon-legend">
          <span><strong>Rabat</strong> — % obniżki</span>
          <span><strong>Użycia</strong> — ile razy wykorzystano / limit</span>
        </div>

        <div className="admin-list">
          {coupons === null && <div className="admin-loading">Ładowanie kuponów…</div>}
          {coupons !== null && coupons.length === 0 && <p>Brak kuponów. Dodaj pierwszy powyżej.</p>}
          {coupons?.map((coupon) => (
            <div key={coupon.id} className="admin-item coupon">
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
              <span className={`coupon-uses${editingId === coupon.id ? ' editing' : ''}`}>
                {editingId === coupon.id ? (
                  <input
                    className="admin-input small"
                    type="number"
                    min={0}
                    value={coupon.maxUses ?? ''}
                    placeholder="∞"
                    onChange={(e) => updateCoupon(coupon.id, 'maxUses', e.target.value === '' ? null : Number(e.target.value))}
                  />
                ) : (
                  <>
                    <strong>{coupon.usesCount}</strong>
                    {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ' / ∞'}
                  </>
                )}
              </span>
              <label className="admin-check">
                <input
                  type="checkbox"
                  disabled={editingId !== coupon.id}
                  checked={coupon.active}
                  onChange={(e) => updateCoupon(coupon.id, 'active', e.target.checked)}
                />
                Aktywny
              </label>
              <div className="admin-actions">
                {editingId === coupon.id ? (
                  <>
                    <button className="admin-btn" onClick={() => saveCoupon(coupon)} disabled={saving}>
                      Zapisz
                    </button>
                    <button className="admin-btn ghost" onClick={() => { setEditingId(null); load() }}>Anuluj</button>
                  </>
                ) : (
                  <button className="admin-btn ghost" onClick={() => setEditingId(coupon.id)}>Edytuj</button>
                )}
                <button className="admin-btn danger" onClick={() => removeCoupon(coupon.id)} disabled={saving}>Usuń</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface AdminOrder {
  orderId: string
  status: string
  nickname: string
  email: string | null
  items: Array<{ name: string; quantity: number; price: number }>
  amount: number
  currency: string
  couponCode: string | null
  delivered: boolean
  deliveryError: boolean
  createdAt: string
  updatedAt: string
}

function ZamowieniaContent() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!ADMIN_TOKEN) {
      setNotice('Brak VITE_ADMIN_API_TOKEN w buildzie. Dodaj token do .env.production, aby zobaczyć zamówienia.')
      return
    }
    setError('')
    try {
      const res = await adminFetch('/api/admin/orders')
      if (res.status === 401) {
        setError('Nieautoryzowany dostęp. Sprawdź ADMIN_API_TOKEN na Vercel i VITE_ADMIN_API_TOKEN w buildzie.')
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Błąd serwera (HTTP ${res.status})`)
      } else {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      setError('Błąd połączenia z API admina')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <h2>Zamówienia</h2>
      <div className="panel-card">
        <p>Ostatnie 100 zamówień z bazy.</p>

        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

        {orders === null && <div className="admin-loading">Ładowanie zamówień…</div>}
        {orders !== null && orders.length === 0 && <p>Brak zamówień.</p>}
        {orders && orders.length > 0 && (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Zamówienie</th>
                  <th>Data</th>
                  <th>Nick</th>
                  <th>Produkty</th>
                  <th>Wartość</th>
                  <th>Status</th>
                  <th>Dostawa</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>
                      <strong>{order.orderId}</strong>
                      {order.couponCode && <p className="table-sub">kupon {order.couponCode}</p>}
                    </td>
                    <td>{formatFullDate(order.createdAt)}</td>
                    <td>{order.nickname}</td>
                    <td>
                      {order.items.map((item, idx) => (
                        <div key={idx}>
                          {item.name}
                          {item.quantity > 1 && ` x${item.quantity}`}
                        </div>
                      ))}
                    </td>
                    <td>{formatPrice(order.amount)} zł</td>
                    <td>
                      <span className={`status-pill ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                    </td>
                    <td>
                      {order.delivered ? (
                        <span className="status-pill paid delivered">Dostarczone</span>
                      ) : order.deliveryError ? (
                        <span className="status-pill paid failed">Błąd</span>
                      ) : (
                        <span className="status-pill muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ProduktyContent() {
  const [products, setProducts] = useState([
    { id: 'vip', name: 'VIP', price: '1,99', active: true, desc: 'Prefix [VIP], /kit vip, 5 domow' },
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
        <p>Produkty ze sklepu GlowMoon. Ceny i klucze /case trzyma serwer (api/_lib/catalog.js) — edycja tutaj jest poglądowa.</p>
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
