import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">GlowMoon</span>
            <p>Sklep serwerowy Minecraft</p>
          </div>
          <div className="footer-links">
            <Link to="/produkty">Produkty</Link>
            <Link to="/o-nas">O nas</Link>
            <Link to="/regulamin">Regulamin</Link>
            <a href="#">Discord</a>
          </div>
        </div>
        <div className="footer-company">
          <p>
            Cerebrums Krzysztof Pietruszczak
            <span className="company-sep">|</span>
            NIP: 8431414443
            <span className="company-sep">|</span>
            REGON: 367325261
            <span className="company-sep">|</span>
            ul. Katarzyny 8, 80-209 Chwaszczyno
          </p>
        </div>
        <div className="footer-bottom">
          <p>© 2025 GlowMoon. Nie jesteśmy powiązani z Mojang.</p>
        </div>
      </div>
    </footer>
  )
}
