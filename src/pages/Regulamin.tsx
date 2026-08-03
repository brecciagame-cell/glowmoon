import { Link } from 'react-router-dom'
import { useScrollAnimationGroup } from '../hooks/useScrollAnimation'
import '../styles/animations.css'
import './Regulamin.css'

export default function Regulamin() {
  const { containerRef, visibleItems } = useScrollAnimationGroup(8, 100)
  return (
    <div className="regulamin">
      <div className="container">
        <h1>Regulamin Sklepu</h1>
        
        <div className="rules-content" ref={containerRef}>
          <section className={visibleItems[0] ? 'visible' : ''}>
            <h2>§1. Postanowienia ogólne</h2>
            <p>
              1. Niniejszy regulamin określa zasady korzystania ze sklepu internetowego GlowMoon.<br />
              2. Sklep prowadzi sprzedaż produktów wirtualnych przeznaczonych do użytku na serwerze Minecraft GlowMoon.<br />
              3. Właścicielem sklepu jest administracja serwera GlowMoon.
            </p>
          </section>

          <section className={visibleItems[1] ? 'visible' : ''}>
            <h2>§2. Definicje</h2>
            <ul>
              <li><strong>Klient</strong> - osoba dokonująca zakupu w sklepie</li>
              <li><strong>Produkt</strong> - wirtualny przedmiot lub usługa dostępna w sklepie</li>
              <li><strong>Ranga</strong> - uprawnienia nadawane na serwerze</li>
              <li><strong>MoonCoins</strong> - wirtualna waluta serwerowa</li>
            </ul>
          </section>

          <section className={visibleItems[2] ? 'visible' : ''}>
            <h2>§3. Zasady zakupów</h2>
            <p>
              1. Zakupy w sklepie są dobrowolne.<br />
              2. Wszystkie ceny podawane są w polskich złotych (PLN) i zawierają podatek VAT.<br />
              3. Płatności obsługuje zewnętrzny operator płatności.<br />
              4. Po zaksięgowaniu płatności produkt jest dostarczany automatycznie.
            </p>
          </section>

          <section className={visibleItems[3] ? 'visible' : ''}>
            <h2>§4. Dostawa produktów</h2>
            <p>
              1. Produkty wirtualne dostarczane są automatycznie na konto gracza podane podczas zakupu.<br />
              2. Czas dostawy: do 5 minut od zaksięgowania płatności.<br />
              3. W przypadku problemów należy skontaktować się z administracją przez Discord.
            </p>
          </section>

          <section className={visibleItems[4] ? 'visible' : ''}>
            <h2>§5. Zwroty i reklamacje</h2>
            <p>
              1. Zgodnie z ustawą o prawach konsumenta, produkty wirtualne nie podlegają zwrotowi po dostarczeniu.<br />
              2. Reklamacje rozpatrywane są w ciągu 14 dni od zgłoszenia.<br />
              3. Podstawą reklamacji jest niezgodność produktu z opisem.
            </p>
          </section>

          <section className={visibleItems[5] ? 'visible' : ''}>
            <h2>§6. Zasady użytkowania zakupionych produktów</h2>
            <p>
              1. Zakupione rangi i przedmioty są własnością konta, na które zostały dostarczone.<br />
              2. Zakazane jest handlowanie kontem z zakupionymi produktami.<br />
              3. Administracja ma prawo odebrać rangę w przypadku naruszenia regulaminu serwera.<br />
              4. Zakup nie zwalnia z przestrzegania regulaminu serwera.
            </p>
          </section>

          <section className={visibleItems[6] ? 'visible' : ''}>
            <h2>§7. Odpowiedzialność</h2>
            <p>
              1. Sklep nie odpowiada za błędnie podany nick podczas zakupu.<br />
              2. Sklep nie odpowiada za problemy techniczne po stronie operatora płatności.<br />
              3. Administracja zastrzega sobie prawo do zmiany cen i asortymentu.
            </p>
          </section>

          <section className={visibleItems[7] ? 'visible' : ''}>
            <h2>§8. Postanowienia końcowe</h2>
            <p>
              1. Regulamin wchodzi w życie z dniem publikacji.<br />
              2. Administracja zastrzega sobie prawo do zmiany regulaminu.<br />
              3. W sprawach nieuregulowanych decyduje administracja serwera.
            </p>
          </section>
        </div>

        <div className="back-button-wrapper">
          <Link to="/produkty" className="back-button">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Wróć do sklepu
          </Link>
        </div>
      </div>
    </div>
  )
}
