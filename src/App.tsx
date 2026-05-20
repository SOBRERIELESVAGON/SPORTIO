import { useI18n } from './i18n/I18nContext';
import LanguageSelector from './LanguageSelector';

function App() {
  const { t } = useI18n();

  const statusKey = { present: 'Presente', absent: 'Ausente', late: 'Tarde' } as const;
  type StatusInternal = 'present' | 'absent' | 'late';

  const athletes: { id: number; name: string; sportKey: keyof typeof t.sport; statusKey: StatusInternal }[] = [
    { id: 1, name: 'Lucia Mendez', sportKey: 'football', statusKey: 'present' },
    { id: 2, name: 'Mateo Rojas', sportKey: 'basketball', statusKey: 'late' },
    { id: 3, name: 'Sofia Arias', sportKey: 'volleyball', statusKey: 'present' },
    { id: 4, name: 'Tomas Silva', sportKey: 'rugby', statusKey: 'absent' },
  ];

  const sessions: { id: number; titleKey: keyof typeof t.sessionData; teamKey: keyof typeof t.sessionData; timeKey: keyof typeof t.sessionData; attendance: number }[] = [
    { id: 1, titleKey: 'techniqueAndMobility', teamKey: 'sub16Football', timeKey: 'today', attendance: 92 },
    { id: 2, titleKey: 'zoneDefense', teamKey: 'womenBasketball', timeKey: 'tomorrow', attendance: 86 },
    { id: 3, titleKey: 'blockAndReception', teamKey: 'mixedVolleyball', timeKey: 'friday', attendance: 78 },
  ];

  const metrics = [
    { label: t.metrics.activeAthletes, value: '148' },
    { label: t.metrics.weeklyAttendance, value: '89%' },
    { label: t.metrics.registeredTeams, value: '12' },
  ];

  const presentCount = athletes.filter((a) => a.statusKey === 'present').length;

  const cssClass = (sk: StatusInternal) => statusKey[sk].toLowerCase();

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Principal">
        <a className="brand" href="#inicio" aria-label="Sportia inicio">
          <span className="brand-mark">S</span>
          <span>Sportia</span>
        </a>
        <div className="nav-links">
          <a href="#asistencia">{t.nav.attendance}</a>
          <a href="#equipos">{t.nav.teams}</a>
          <a href="#sesiones">{t.nav.sessions}</a>
          <LanguageSelector />
        </div>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="hero-description">{t.hero.description}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#asistencia">
              {t.hero.cta}
            </a>
            <a className="secondary-button" href="#sesiones">
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>

        <aside className="attendance-card" aria-label={t.card.todayTraining}>
          <div className="card-header">
            <span>{t.card.todayTraining}</span>
            <strong>{presentCount}/{athletes.length}</strong>
          </div>
          <h2>{t.card.quickList}</h2>
          <div className="athlete-list">
            {athletes.map((athlete) => (
              <article className="athlete-row" key={athlete.id}>
                <div>
                  <strong>{athlete.name}</strong>
                  <span>{t.sport[athlete.sportKey]}</span>
                </div>
                <span className={`status status-${cssClass(athlete.statusKey)}`}>
                  {t.status[athlete.statusKey]}
                </span>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="metrics-grid" aria-label={t.metrics.activeAthletes}>
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel" id="sesiones">
          <div className="section-heading">
            <p className="eyebrow">{t.sessions.eyebrow}</p>
            <h2>{t.sessions.title}</h2>
          </div>
          <div className="session-list">
            {sessions.map((session) => (
              <article className="session-card" key={session.id}>
                <div>
                  <h3>{t.sessionData[session.titleKey]}</h3>
                  <p>{t.sessionData[session.teamKey]}</p>
                </div>
                <div className="session-meta">
                  <span>{t.sessionData[session.timeKey]}</span>
                  <strong>{session.attendance}%</strong>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel accent-panel" id="equipos">
          <p className="eyebrow">{t.accent.eyebrow}</p>
          <h2>{t.accent.title}</h2>
          <p>{t.accent.description}</p>
          <a className="secondary-button light" href="#asistencia">
            {t.accent.cta}
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
