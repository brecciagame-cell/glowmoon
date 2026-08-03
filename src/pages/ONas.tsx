import { useScrollAnimation, useScrollAnimationGroup } from '../hooks/useScrollAnimation'
import '../styles/animations.css'
import './ONas.css'

const stats = [
  { value: '2022', label: 'Rok startu' },
  { value: '50K+', label: 'Graczy' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Wsparcie' }
]

const timeline = [
  {
    year: '2022',
    title: 'Początki',
    desc: 'Serwer wystartował od małej grupy znajomych. Prosta mapa survival, kilka pluginów i wielkie marzenia.'
  },
  {
    year: '2023',
    title: 'Rozwój',
    desc: 'Pierwsze duże aktualizacje, nowe tryby, system ekonomii. Społeczność rosła z dnia na dzień.'
  },
  {
    year: '2024',
    title: 'Stabilność',
    desc: 'Profesjonalna infrastruktura, autorskie pluginy, regularne eventy i współpraca z YouTuberami.'
  },
  {
    year: '2025',
    title: 'Przyszłość',
    desc: 'Nowe sezony, rozbudowa sklepu, więcej funkcji. GlowMoon staje się jednym z top serwerów w Polsce.'
  }
]

const values = [
  {
    icon: '⚡',
    title: 'Szybkość',
    desc: 'Automatyczne systemy, szybka dostawa, zero czekania.'
  },
  {
    icon: '🛡️',
    title: 'Bezpieczeństwo',
    desc: 'Twoje dane i płatności są zawsze chronione.'
  },
  {
    icon: '💎',
    title: 'Jakość',
    desc: 'Premium hosting, antycheat, 20 TPS - stabilność na lata.'
  },
  {
    icon: '🤝',
    title: 'Społeczność',
    desc: 'Aktywny Discord, wydarzenia, konkursy - razem tworzymy klimat.'
  }
]

export default function ONas() {
  const { containerRef: statsRef, visibleItems: statsVisible } = useScrollAnimationGroup(4, 100)
  const { containerRef: timelineRef, visibleItems: timelineVisible } = useScrollAnimationGroup(4, 150)
  const { containerRef: valuesRef, visibleItems: valuesVisible } = useScrollAnimationGroup(4, 100)
  const { ref: missionRef, isVisible: missionVisible } = useScrollAnimation<HTMLDivElement>()
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation<HTMLDivElement>()

  return (
    <div className="o-nas">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg"></div>
        <div className="container">
          <div className="about-hero-content">
            <span className="about-hero-tag">Kim jesteśmy?</span>
            <h1 className="about-hero-title">
              Serwer stworzony przez <span className="gradient">graczy</span>, dla <span className="gradient">graczy</span>
            </h1>
            <p className="about-hero-desc">
              GlowMoon to nie tylko serwer Minecraft. To miejsce, gdzie pasja spotyka się z profesjonalizmem. 
              Tworzymy przestrzeń, w której każdy gracz może się rozwijać, bawić i tworzyć własne historie.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid" ref={statsRef}>
            {stats.map((stat, i) => (
              <div key={i} className={`stat-card ${statsVisible[i] ? 'visible' : ''}`}>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="about-story">
        <div className="container">
          <div className="story-header">
            <h2>Nasza historia</h2>
            <p>Od małej grupy znajomych do top serwera w Polsce</p>
          </div>
          
          <div className="timeline" ref={timelineRef}>
            {timeline.map((item, i) => (
              <div key={i} className={`timeline-item ${timelineVisible[i] ? 'visible' : ''}`}>
                <div className="timeline-year">{item.year}</div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="container">
          <div className="values-header">
            <h2>Wartości, które nas wyróżniają</h2>
          </div>
          
          <div className="values-grid" ref={valuesRef}>
            {values.map((value, i) => (
              <div key={i} className={`value-card ${valuesVisible[i] ? 'visible' : ''}`}>
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="about-mission">
        <div className="container">
          <div ref={missionRef} className={`mission-content ${missionVisible ? 'visible' : ''}`}>
            <h2>Nasza misja</h2>
            <div className="mission-points">
              <div className="mission-point">
                <span className="mission-num">01</span>
                <p>Stworzyć najlepsze miejsce do gry survival w Polsce - bez pay-to-win, z uczciwą rozgrywką.</p>
              </div>
              <div className="mission-point">
                <span className="mission-num">02</span>
                <p>Organizować eventy, które naprawdę bawią - nie tylko wyglądają ładnie na screenach.</p>
              </div>
              <div className="mission-point">
                <span className="mission-num">03</span>
                <p>Utrzymywać aktywny kontakt ze społecznością - słuchać, reagować, rozwijać się razem.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container">
          <div ref={ctaRef} className={`cta-box ${ctaVisible ? 'visible' : ''}`}>
            <h2>Dołącz do naszej społeczności</h2>
            <p>Discord, wydarzenia, konkursy i mnóstwo ludzi, z którymi możesz grać.</p>
            <div className="cta-buttons">
              <a href="#" className="btn-discord">Wejdź na Discorda</a>
              <a href="#" className="btn-ip">Wejdź na serwer</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
