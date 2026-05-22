import { useEffect, useRef, useState } from 'react';

type Athlete = {
  id: number;
  name: string;
  sport: string;
  status: 'Presente' | 'Ausente' | 'Tarde';
};

type Session = {
  id: number;
  title: string;
  team: string;
  time: string;
  attendance: number;
};

const athletes: Athlete[] = [
  { id: 1, name: 'Lucia Mendez', sport: 'Futbol', status: 'Presente' },
  { id: 2, name: 'Mateo Rojas', sport: 'Basquet', status: 'Tarde' },
  { id: 3, name: 'Sofia Arias', sport: 'Voley', status: 'Presente' },
  { id: 4, name: 'Tomas Silva', sport: 'Rugby', status: 'Ausente' },
];

const sessions: Session[] = [
  {
    id: 1,
    title: 'Tecnica y movilidad',
    team: 'Sub 16 futbol',
    time: 'Hoy, 18:30',
    attendance: 92,
  },
  {
    id: 2,
    title: 'Defensa en zona',
    team: 'Basquet femenino',
    time: 'Manana, 10:00',
    attendance: 86,
  },
  {
    id: 3,
    title: 'Bloqueo y recepcion',
    team: 'Voley mixto',
    time: 'Viernes, 19:00',
    attendance: 78,
  },
];

const metrics = [
  { label: 'Deportistas activos', value: '148' },
  { label: 'Asistencia semanal', value: '89%' },
  { label: 'Equipos registrados', value: '12' },
];

function App() {
  const presentCount = athletes.filter((athlete) => athlete.status === 'Presente').length;
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const playerSelectorRef = useRef<HTMLDivElement>(null);
  const selectedAthlete = athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null;

  useEffect(() => {
    if (!isPlayerPickerOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!playerSelectorRef.current?.contains(event.target as Node)) {
        setIsPlayerPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlayerPickerOpen]);

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Principal">
        <a className="brand" href="#inicio" aria-label="Sportia inicio">
          <span className="brand-mark">S</span>
          <span>Sportia</span>
        </a>
        <div className="nav-links">
          <a href="#asistencia">Asistencia</a>
          <a href="#equipos">Equipos</a>
          <a href="#sesiones">Sesiones</a>
        </div>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Gestion deportiva multi-deporte</p>
          <h1>Controla asistencia, equipos y entrenamientos desde un solo lugar.</h1>
          <p className="hero-description">
            Sportia ayuda a entrenadores y clubes a saber quien entreno, que sesiones vienen y
            como evoluciona la participacion de cada equipo.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#asistencia">
              Ver asistencia
            </a>
            <a className="secondary-button" href="#sesiones">
              Planificar sesion
            </a>
          </div>
        </div>

        <aside className="attendance-card" aria-label="Resumen de asistencia de hoy">
          <div className="card-header">
            <span>Entrenamiento de hoy</span>
            <strong>{presentCount}/{athletes.length}</strong>
          </div>
          <h2>Seleccion de jugador</h2>
          <div className="player-selector" ref={playerSelectorRef}>
            <button
              type="button"
              className="player-selector-trigger"
              aria-haspopup="listbox"
              aria-expanded={isPlayerPickerOpen}
              onClick={() => setIsPlayerPickerOpen((prevOpen) => !prevOpen)}
            >
              {selectedAthlete ? selectedAthlete.name : 'Seleccionar jugador'}
            </button>
            {isPlayerPickerOpen && (
              <div className="player-selector-menu" role="listbox" aria-label="Listado de jugadores">
                {athletes.map((athlete) => (
                  <button
                    key={athlete.id}
                    type="button"
                    role="option"
                    aria-selected={selectedAthlete?.id === athlete.id}
                    className="player-selector-option"
                    onClick={() => {
                      setSelectedAthleteId(athlete.id);
                      setIsPlayerPickerOpen(false);
                    }}
                  >
                    <span>{athlete.name}</span>
                    <small>
                      {athlete.sport} · {athlete.status}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedAthlete && (
            <p className="selected-athlete-note">
              Jugador seleccionado: <strong>{selectedAthlete.name}</strong>
            </p>
          )}
          {selectedAthlete ? (
            <article className="athlete-row selected-athlete-card">
              <div>
                <strong>{selectedAthlete.name}</strong>
                <span>{selectedAthlete.sport}</span>
              </div>
              <span className={`status status-${selectedAthlete.status.toLowerCase()}`}>
                {selectedAthlete.status}
              </span>
            </article>
          ) : (
            <p className="selected-athlete-empty">Abre el listado y selecciona un jugador.</p>
          )}
        </aside>
      </section>

      <section className="metrics-grid" aria-label="Metricas principales">
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
            <p className="eyebrow">Agenda</p>
            <h2>Proximas sesiones</h2>
          </div>
          <div className="session-list">
            {sessions.map((session) => (
              <article className="session-card" key={session.id}>
                <div>
                  <h3>{session.title}</h3>
                  <p>{session.team}</p>
                </div>
                <div className="session-meta">
                  <span>{session.time}</span>
                  <strong>{session.attendance}%</strong>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel accent-panel" id="equipos">
          <p className="eyebrow">Siguiente paso</p>
          <h2>Primer modulo listo para conectar datos reales.</h2>
          <p>
            Esta base deja preparada la experiencia principal: registrar asistencia,
            visualizar indicadores y ordenar entrenamientos por deporte o equipo.
          </p>
          <a className="secondary-button light" href="#asistencia">
            Empezar carga
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
