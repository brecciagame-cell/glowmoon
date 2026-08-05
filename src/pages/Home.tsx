import { Link } from 'react-router-dom'
import { useScrollAnimation, useScrollAnimationGroup } from '../hooks/useScrollAnimation'
import '../styles/animations.css'
import './Home.css'

export default function Home() {
  const { containerRef: featuredRef, visibleItems: featuredVisible } = useScrollAnimationGroup(4, 150)
  const { containerRef: aboutRef, visibleItems: aboutVisible } = useScrollAnimationGroup(4, 100)
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation<HTMLDivElement>()
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}></div>
          ))}
        </div>
        
        <div className="container">
          <div className="hero-content">
            <img src="/logo.png" alt="GlowMoon" className="hero-logo" />
            <h1 className="hero-title">
              <span className="title-line">GlowMoon.pl</span>
              <span className="title-gradient">Sklep</span>
            </h1>
            
            <p className="hero-desc">
              Nie trać czasu na grind. Kup rangę, otwórz skrzynkę, 
              <br />
              <span className="highlight">zdominuj serwer.</span>
            </p>
            
            <div className="hero-buttons">
              <Link to="/produkty" className="btn-primary">
                <span className="btn-text">Przeglądaj ofertę</span>
                <span className="btn-arrow">→</span>
              </Link>
              <a href="#produkty" className="btn-secondary">
                Zobacz więcej
              </a>
            </div>
          </div>
        </div>
        
      </section>

      {/* Featured Products with Images */}
      <section id="produkty" className="featured">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Oferta</span>
            <h2 className="section-title">Wybierz coś dla siebie</h2>
          </div>
          
          <div className="featured-grid" ref={featuredRef}>
            {/* VIP Card */}
            <div className={`feature-card vip ${featuredVisible[0] ? 'visible' : ''}`}>
              <div className="card-image">
                <img src="/vip.jpg" alt="VIP" />
                <div className="image-overlay"></div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <span className="card-badge">Ranga</span>
                  <span className="card-price">1,99 zł</span>
                </div>
                <h3>VIP</h3>
                <ul className="card-perks">
                  <li><span className="check">✓</span> Prefix [VIP]</li>
                  <li><span className="check">✓</span> /kit vip</li>
                  <li><span className="check">✓</span> 5 dodatkowych domów</li>
                  <li><span className="check">✓</span> Bez kolejki</li>
                </ul>
                <Link to="/produkty" className="card-btn vip-btn">
                  Wybieram VIP
                </Link>
              </div>
            </div>

            {/* SVIP Card */}
            <div className={`feature-card svip ${featuredVisible[1] ? 'visible' : ''}`}>
              <div className="card-image">
                <img src="/svip.jpg" alt="SVIP" />
                <div className="image-overlay"></div>
                <span className="popular-tag">NAJPOPULARNIEJSZE</span>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <span className="card-badge">Ranga</span>
                  <span className="card-price">25,99 zł</span>
                </div>
                <h3>SVIP</h3>
                <ul className="card-perks">
                  <li><span className="check">✓</span> Wszystko z VIP</li>
                  <li><span className="check">✓</span> /fly</li>
                  <li><span className="check">✓</span> /kit svip</li>
                  <li><span className="check">✓</span> 10 domów</li>
                </ul>
                <Link to="/produkty" className="card-btn svip-btn">
                  Wybieram SVIP
                </Link>
              </div>
            </div>

            {/* Keys Card */}
            <div className={`feature-card keys ${featuredVisible[2] ? 'visible' : ''}`}>
              <div className="card-image">
                <img src="/keys.jpg" alt="Klucze" />
                <div className="image-overlay"></div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <span className="card-badge">Klucze</span>
                  <span className="card-price">od 1,99 zł</span>
                </div>
                <h3>Klucze do skrzynek</h3>
                <ul className="card-perks">
                  <li><span className="check">✓</span> Rzadki - 1,99 zł</li>
                  <li><span className="check">✓</span> Epicki - 3,99 zł</li>
                  <li><span className="check">✓</span> Legendarny - 5,99 zł</li>
                  <li><span className="check">✓</span> Survivalowy - 10,99 zł</li>
                </ul>
                <Link to="/produkty" className="card-btn keys-btn">
                  Zobacz klucze
                </Link>
              </div>
            </div>

            {/* Support Card */}
            <div className={`feature-card support ${featuredVisible[3] ? 'visible' : ''}`}>
              <div className="card-image">
                <img src="/support.jpg" alt="Wsparcie" />
                <div className="image-overlay"></div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <span className="card-badge">Wsparcie</span>
                  <span className="card-price">Dowolna kwota</span>
                </div>
                <h3>Wesprzyj serwer</h3>
                <ul className="card-perks">
                  <li><span className="check">✓</span> Od 0,99 zł</li>
                  <li><span className="check">✓</span> Wpłać ile chcesz</li>
                  <li><span className="check">✓</span> Pomóż nam rosnąć</li>
                  <li><span className="check">✓</span> Doceniamy każdą złotówkę</li>
                </ul>
                <Link to="/produkty" className="card-btn support-btn">
                  Wesprzyj nas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="about">
        <div className="container">
          <div className="about-header">
            <h2 className="about-title">Dlaczego GlowMoon?</h2>
            <p className="about-subtitle">Serwer stworzony przez graczy, dla graczy</p>
          </div>
          
          <div className="about-grid" ref={aboutRef}>
            <div className={`about-card ${aboutVisible[0] ? 'visible' : ''}`}>
              <div className="about-number">01</div>
              <div className="about-content">
                <h3>Automatyczna dostawa</h3>
                <p>Kupujesz, dostajesz. Bez czekania na admina, bez pisania ticketów. System automatycznie przesyła przedmioty na Twoje konto.</p>
              </div>
            </div>
            
            <div className={`about-card ${aboutVisible[1] ? 'visible' : ''}`}>
              <div className="about-number">02</div>
              <div className="about-content">
                <h3>Bezpieczne płatności</h3>
                <p>BLIK, PayPal, Paysafecard, przelew bankowy. Wszystkie metody są w pełni zabezpieczone i sprawdzone przez tysiące graczy.</p>
              </div>
            </div>
            
            <div className={`about-card ${aboutVisible[2] ? 'visible' : ''}`}>
              <div className="about-number">03</div>
              <div className="about-content">
                <h3>Rangi na zawsze</h3>
                <p>Kup raz, używaj wiecznie. Nasze rangi nie wygasają po miesiącu czy roku. Raz kupione, są Twoje na zawsze.</p>
              </div>
            </div>
            
            <div className={`about-card ${aboutVisible[3] ? 'visible' : ''}`}>
              <div className="about-number">04</div>
              <div className="about-content">
                <h3>Aktywna społeczność</h3>
                <p>Dołącz do społeczności, która rośnie każdego dnia. Discord, wydarzenia, konkursy - u nas zawsze coś się dzieje.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div ref={ctaRef} className={`cta-box ${ctaVisible ? 'visible' : ''}`}>
            <h2>Gotowy na upgrade?</h2>
            <p>Dołącz do setek graczy, którzy już kupili rangi.</p>
            <Link to="/produkty" className="btn-cta">
              Kup teraz
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
