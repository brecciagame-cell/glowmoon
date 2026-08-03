import { Link, useSearchParams } from 'react-router-dom'
import './PaymentSuccess.css'

export default function PaymentFailure() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <div className="payment-page">
      <div className="receipt-card">
        <div className="receipt-top">
          <div className="status-icon cancelled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1>Płatność nie została zrealizowana</h1>
          <p className="receipt-subtitle">
            Zamówienie nie zostało opłacone, a z Twojego konta nie pobrano żadnych środków.
            Możesz spróbować zapłacić ponownie lub wrócić do sklepu.
          </p>
          <span className="status-badge cancelled">Anulowane / odrzucone</span>
        </div>

        <div className="receipt-body">
          {orderId && (
            <div className="receipt-row">
              <span>Numer zamówienia</span>
              <strong>{orderId}</strong>
            </div>
          )}
          <p className="delivery-note">
            Jeśli płatność została pobrana, a mimo to widzisz tę stronę, odśwież ją lub
            skontaktuj się z nami – zweryfikujemy status zamówienia.
          </p>
        </div>

        <div className="receipt-footer">
          <Link to="/produkty" className="primary-btn">
            Spróbuj ponownie
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link to="/" className="secondary-btn">Strona główna</Link>
        </div>
      </div>
    </div>
  )
}
