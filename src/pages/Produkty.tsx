import { useCart } from '../context/CartContext'
import { useState } from 'react'
import { useScrollAnimationGroup } from '../hooks/useScrollAnimation'
import '../styles/animations.css'
import './Produkty.css'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  badge?: string
  image: string
  category: 'keys' | 'ranks' | 'support'
  /** Nazwa klucza w pluginie /case (dostawa przez RCON). Bez tego produkt nie jest nadawany. */
  key?: string
  /** Ranga LuckPerms (vip/svip) - dostawa przez lp user <nick> parent addtemp. */
  rank?: string
}

const products: Product[] = [
  {
    id: 'key-rare',
    name: 'Klucz Rzadki',
    price: 1.99,
    description: 'Dostęp do skrzynki rzadkiej',
    image: '/keys.jpg',
    category: 'keys',
    key: 'Rzadka'
  },
  {
    id: 'key-epic',
    name: 'Klucz Epicki',
    price: 3.99,
    description: 'Dostęp do skrzynki epickiej',
    image: '/keys.jpg',
    category: 'keys',
    key: 'Epicka'
  },
  {
    id: 'key-legendary',
    name: 'Klucz Legendarny',
    price: 5.99,
    description: 'Dostęp do skrzynki legendarnej',
    badge: 'HIT',
    image: '/keys.jpg',
    category: 'keys',
    key: 'Legendarna'
  },
  {
    id: 'key-survival',
    name: 'Klucz Survivalowy',
    price: 10.99,
    description: 'Specjalne itemy survivalowe',
    image: '/keys.jpg',
    category: 'keys',
    key: 'Survival'
  },
  {
    id: 'rank-vip',
    name: 'Ranga VIP',
    price: 15.99,
    description: 'Prefix, kit, dodatkowe domy',
    image: '/vip.jpg',
    category: 'ranks',
    rank: 'vip'
  },
  {
    id: 'rank-svip',
    name: 'Ranga SVIP',
    price: 25.99,
    description: 'Wszystko z VIP + /fly',
    badge: 'POPULARNE',
    image: '/svip.jpg',
    category: 'ranks',
    rank: 'svip'
  },
  {
    id: 'support',
    name: 'Wsparcie Serwera',
    price: 0.99,
    description: 'Wesprzyj rozwój serwera dowolną kwotą',
    image: '/support.jpg',
    category: 'support'
  }
]

export default function Produkty() {
  const { cart, addToCart, total } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  const [nick, setNick] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>(
    products.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {})
  )
  const [supportAmount, setSupportAmount] = useState<number>(5)

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, Math.min(20, value)) }))
  }

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1
    for (let i = 0; i < qty; i++) {
      addToCart({ name: product.name, price: product.price, category: product.category, key: product.key, rank: product.rank })
    }
  }

  const handleSupportAdd = () => {
    // Add custom support amount - we'll add it as a single item with that price (bez klucza /case)
    if (supportAmount >= 0.99) {
      addToCart({ name: `Wsparcie Serwera (${supportAmount.toFixed(2)} zł)`, price: supportAmount, category: 'support' })
    }
  }

  const handleCheckout = () => {
    if (!nick) {
      alert('Podaj swój nick!')
      return
    }
    alert(`Zamówienie przyjęte! Przedmioty zostaną dostarczone na konto: ${nick}`)
    setShowCheckout(false)
  }

  const keys = products.filter(p => p.category === 'keys')
  const ranks = products.filter(p => p.category === 'ranks')
  const support = products.filter(p => p.category === 'support')

  // Scroll animations for each section
  const { containerRef: keysRef, visibleItems: keysVisible } = useScrollAnimationGroup(keys.length, 100)
  const { containerRef: ranksRef, visibleItems: ranksVisible } = useScrollAnimationGroup(ranks.length, 150)
  const { containerRef: supportRef, visibleItems: supportVisible } = useScrollAnimationGroup(support.length, 100)

  return (
    <div className="produkty">
      <header className="products-header">
        <div className="container">
          <h1>Produkty</h1>
          <p>Wybierz produkty. Wsparcie serwera możesz dostosować do swoich możliwości.</p>
        </div>
      </header>

      <div className="container">
        {/* Klucze */}
        <section className="products-section">
          <h2 className="section-title">
            <span className="dot"></span>
            Klucze do Skrzynek
          </h2>
          <div className="products-grid" ref={keysRef}>
            {keys.map((product, index) => (
              <div key={product.id} className={`product-card ${product.badge ? 'featured' : ''} ${keysVisible[index] ? 'visible' : ''}`}>
                {product.badge && <span className="discount-badge">{product.badge}</span>}
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                
                <div className="quantity-control">
                  <label>Ilość:</label>
                  <div className="slider-wrapper">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={quantities[product.id]}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                      className="quantity-slider"
                    />
                    <span className="quantity-value">{quantities[product.id]}x</span>
                  </div>
                </div>

                <div className="product-footer">
                  <span className="price">{product.price.toFixed(2).replace('.', ',')} zł</span>
                  <span className="total-price">
                    = {(product.price * quantities[product.id]).toFixed(2).replace('.', ',')} zł
                  </span>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  Dodaj {quantities[product.id]}x do koszyka
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Rangi */}
        <section className="products-section">
          <h2 className="section-title">
            <span className="dot"></span>
            Rangi Premium
          </h2>
          <div className="products-grid ranks" ref={ranksRef}>
            {ranks.map((product, index) => (
              <div key={product.id} className={`product-card large ${product.badge ? 'featured' : ''} ${ranksVisible[index] ? 'visible' : ''}`}>
                {product.badge && <span className="discount-badge">{product.badge}</span>}
                <div className="product-image large">
                  <img src={product.image} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>

                <div className="product-footer">
                  <span className="price">{product.price.toFixed(2).replace('.', ',')} zł</span>
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  Dodaj do koszyka
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Wsparcie - Custom Amount */}
        <section className="products-section">
          <h2 className="section-title">
            <span className="dot"></span>
            Wesprzyj Serwer
          </h2>
          <div className="products-grid" ref={supportRef}>
            {support.map((product, index) => (
              <div key={product.id} className={`product-card support-card ${supportVisible[index] ? 'visible' : ''}`}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                
                {/* Custom Amount Input */}
                <div className="custom-amount-control">
                  <label>Wpisz kwotę (min. 0,99 zł):</label>
                  <div className="amount-input-wrapper">
                    <input
                      type="number"
                      min="0.99"
                      max="500"
                      step="0.01"
                      value={supportAmount}
                      onChange={(e) => setSupportAmount(parseFloat(e.target.value) || 0)}
                      className="amount-input"
                    />
                    <span className="currency">zł</span>
                  </div>
                  {/* Quick amount buttons */}
                  <div className="quick-amounts">
                    {[1, 5, 10, 25, 50].map(amount => (
                      <button
                        key={amount}
                        className={`quick-btn ${supportAmount === amount ? 'active' : ''}`}
                        onClick={() => setSupportAmount(amount)}
                      >
                        {amount} zł
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  className="add-to-cart-btn support"
                  onClick={handleSupportAdd}
                  disabled={supportAmount < 0.99}
                >
                  Wesprzyj serwer {supportAmount.toFixed(2).replace('.', ',')} zł
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="checkout-overlay" onClick={() => setShowCheckout(false)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()}>
            <div className="checkout-header">
              <h2>Finalizacja</h2>
              <button className="close-btn" onClick={() => setShowCheckout(false)}>✕</button>
            </div>
            
            <div className="checkout-form">
              <div className="form-group">
                <label>Nick z gry</label>
                <input 
                  type="text" 
                  value={nick}
                  onChange={e => setNick(e.target.value)}
                  placeholder="Twój nick"
                />
              </div>
              
              <div className="form-group">
                <label>Metoda płatności</label>
                <div className="payment-methods">
                  {['blik', 'przelew', 'paypal', 'psc'].map(method => (
                    <button
                      key={method}
                      className={`payment-btn ${paymentMethod === method ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === 'blik' && 'BLIK'}
                      {method === 'przelew' && 'Przelew'}
                      {method === 'paypal' && 'PayPal'}
                      {method === 'psc' && 'Paysafecard'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Items in Checkout */}
              <div className="checkout-items">
                <label>Zamówienie:</label>
                {cart.map((item, index) => (
                  <div key={index} className="checkout-item">
                    <span>{item.name}</span>
                    <span>{item.price.toFixed(2).replace('.', ',')} zł</span>
                  </div>
                ))}
              </div>
              
              <div className="checkout-total">
                <span>Do zapłaty:</span>
                <span className="total">{total.toFixed(2).replace('.', ',')} zł</span>
              </div>
              
              <button className="pay-btn" onClick={handleCheckout}>
                Zapłać
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
