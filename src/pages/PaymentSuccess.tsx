import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { useCart } from '../context/CartContext'
import './PaymentSuccess.css'

interface OrderItem {
  name: string
  price: number
  quantity: number
  category?: string
}

interface DeliveryLogEntry {
  command: string
  itemName: string
  ok: boolean
  error?: string | null
  status?: string
  at?: string
}

interface OrderData {
  orderId: string
  status: 'pending' | 'paid' | 'cancelled'
  nickname: string
  email?: string | null
  items: OrderItem[]
  amount: number
  currency: string
  createdAt: string
  delivered?: boolean
  deliveredAt?: string | null
  deliveryError?: boolean
  deliveryLog?: DeliveryLogEntry[]
}

const STATUS_LABELS: Record<OrderData['status'], string> = {
  pending: 'Oczekuje na płatność',
  paid: 'Opłacone',
  cancelled: 'Anulowane',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatPrice(value: number) {
  return value.toFixed(2).replace('.', ',')
}

export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [error, setError] = useState('')
  const { clearCart } = useCart()
  const clearedRef = useRef(false)
  // clearCart zmienia tożsamość przy każdym renderze providera - trzymamy aktualną referencję w refie
  const clearCartRef = useRef(clearCart)
  clearCartRef.current = clearCart

  useEffect(() => {
    if (!orderId) {
      setError('Brak numeru zamówienia w adresie URL')
      return
    }

    let cancelled = false
    let timer: number | undefined
    let attempts = 0

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/order/${orderId}`)
        if (!res.ok) throw new Error('Nie znaleziono zamówienia')
        const data: OrderData = await res.json()
        if (cancelled) return
        setOrder(data)
        setError('')
        // Po zaksięgowaniu płatności czyścimy koszyk
        if (data.status === 'paid' && !clearedRef.current) {
          clearedRef.current = true
          clearCartRef.current()
        }
        // Gdy status się zakończył, przestajemy odświeżać
        if (data.status !== 'pending' && timer) {
          window.clearInterval(timer)
          timer = undefined
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Błąd ładowania zamówienia')
        }
      }
    }

    load()
    // Odświeżanie co 3 s, maksymalnie 40 prób (~2 min) - potem przestajemy pytać
    timer = window.setInterval(() => {
      attempts += 1
      if (attempts >= 40) {
        if (timer) window.clearInterval(timer)
        timer = undefined
        return
      }
      load()
    }, 3000)

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
    }
  }, [orderId])

  if (error && !order) {
    return (
      <div className="payment-page">
        <div className="receipt-card error-card">
          <div className="status-icon cancelled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1>Nie udało się wczytać zamówienia</h1>
          <p className="receipt-subtitle">{error}</p>
          <div className="receipt-actions">
            <Link to="/produkty" className="primary-btn">Wróć do sklepu</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="payment-page">
        <div className="receipt-card loading-card">
          <div className="spinner-ring"></div>
          <p>Ładowanie zamówienia…</p>
        </div>
      </div>
    )
  }

  const isPaid = order.status === 'paid'
  const isPending = order.status === 'pending'

  return (
    <div className="payment-page">
      <div className="receipt-card">
        <div className="receipt-top">
          <div className={`status-icon ${order.status}`}>
            {isPaid ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : isPending ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h1>
            {isPaid && 'Dziękujemy za zakup!'}
            {isPending && 'Trwa przetwarzanie płatności…'}
            {!isPaid && !isPending && 'Płatność nie została zrealizowana'}
          </h1>

          <p className="receipt-subtitle">
            {isPaid && `Zamówienie ${order.orderId} zostało opłacone i jest w trakcie realizacji.`}
            {isPending && 'Czekamy na potwierdzenie płatności przez CashBill. Strona odświeży się automatycznie.'}
            {!isPaid && !isPending && 'Żadne środki nie zostały pobrane z Twojego konta.'}
          </p>

          <span className={`status-badge ${order.status}`}>{STATUS_LABELS[order.status]}</span>
        </div>

        <div className="receipt-body">
          <div className="receipt-row">
            <span>Numer zamówienia</span>
            <strong>{order.orderId}</strong>
          </div>
          <div className="receipt-row">
            <span>Data</span>
            <strong>{formatDate(order.createdAt)}</strong>
          </div>
          <div className="receipt-row">
            <span>Nick w grze</span>
            <strong>{order.nickname}</strong>
          </div>
          {order.email && (
            <div className="receipt-row">
              <span>Email</span>
              <strong>{order.email}</strong>
            </div>
          )}

          <div className="receipt-items">
            {order.items.map((item, idx) => (
              <div className="receipt-item" key={idx}>
                <span className="receipt-item-name">
                  {item.name}
                  {item.quantity > 1 && <em> × {item.quantity}</em>}
                </span>
                <span className="receipt-item-price">
                  {formatPrice(item.price * item.quantity)} zł
                </span>
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <span>Do zapłaty</span>
            <strong>{formatPrice(order.amount)} zł</strong>
          </div>

          {isPending && (
            <div className="pending-note">
              <span className="spinner-ring small"></span>
              Sprawdzamy status płatności…
            </div>
          )}

          {isPaid && order.delivered && (
            <div className="delivery-status delivered">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Przedmioty zostały dostarczone na serwer!</span>
            </div>
          )}

          {isPaid && !order.delivered && order.deliveryError && (
            <div className="delivery-status failed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
              </svg>
              <span>Nie udało się dostarczyć przedmiotów — napisz do nas na Discordzie!</span>
            </div>
          )}

          {isPaid && !order.delivered && !order.deliveryError && (
            <div className="delivery-status pending">
              <span className="spinner-ring small"></span>
              <span>Dostarczamy przedmioty na serwer…</span>
            </div>
          )}

          <p className="delivery-note">
            {isPaid
              ? <>Produkty są nadawane automatycznie na nick <strong>{order.nickname}</strong>. Musisz być online na serwerze. Jeśli nic nie dotarło po kilku minutach, skontaktuj się z nami na Discordzie.</>
              : 'Płatność realizowana jest przez zewnętrznego operatora – CashBill. Po zaksięgowaniu płatności produkt zostanie dostarczony na Twój nick.'}
          </p>
        </div>

        <div className="receipt-footer">
          <Link to="/produkty" className="primary-btn">
            Wróć do sklepu
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link to="/regulamin" className="secondary-btn">Regulamin</Link>
        </div>
      </div>
    </div>
  )
}
