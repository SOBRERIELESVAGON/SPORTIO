import { useState } from 'react';

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
  const [recipientType, setRecipientType] = useState<'grupo' | 'individual'>('grupo');
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const selectedAthlete = athletes.find((athlete) => athlete.id === selectedAthleteId);
  const canSendMessage =
    message.trim().length > 0 && (recipientType === 'grupo' || selectedAthleteId !== null);

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
          <a href="#comunicaciones">Comunicaciones</a>
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
          <h2>Lista rapida</h2>
          <div className="athlete-list">
            {athletes.map((athlete) => (
              <article className="athlete-row" key={athlete.id}>
                <div>
                  <strong>{athlete.name}</strong>
                  <span>{athlete.sport}</span>
                </div>
                <span className={`status status-${athlete.status.toLowerCase()}`}>
                  {athlete.status}
                </span>
              </article>
            ))}
          </div>
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

      <section className="panel communication-panel" id="comunicaciones">
        <div className="section-heading">
          <p className="eyebrow">Comunicaciones</p>
          <h2>Enviar aviso al equipo o a un jugador</h2>
        </div>
        <form className="communication-form">
          <fieldset className="recipient-options">
            <legend>Destinatario</legend>
            <label htmlFor="recipient-group">
              <input
                id="recipient-group"
                type="radio"
                name="recipient"
                checked={recipientType === 'grupo'}
                onChange={() => {
                  setRecipientType('grupo');
                  setSelectedAthleteId(null);
                }}
              />
              Grupo completo
            </label>
            <label htmlFor="recipient-individual">
              <input
                id="recipient-individual"
                type="radio"
                name="recipient"
                checked={recipientType === 'individual'}
                onChange={() => setRecipientType('individual')}
              />
              Individual
            </label>
          </fieldset>

          {recipientType === 'individual' && (
            <div className="player-picker" aria-label="Seleccion de jugador">
              <p>Jugadores disponibles</p>
              <div className="player-picker-list" role="listbox" aria-label="Listado de jugadores">
                {athletes.map((athlete) => {
                  const isSelected = athlete.id === selectedAthleteId;
                  return (
                    <button
                      className={`player-option ${isSelected ? 'selected' : ''}`}
                      key={athlete.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedAthleteId(athlete.id)}
                    >
                      <strong>{athlete.name}</strong>
                      <span>{athlete.sport}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="message-field" htmlFor="message">
            Mensaje
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Escribe la comunicacion para el destinatario seleccionado"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <div className="communication-footer">
            <button className="primary-button send-button" type="button" disabled={!canSendMessage}>
              Enviar comunicacion
            </button>
            <p className="communication-note">
              {recipientType === 'individual'
                ? selectedAthlete
                  ? `Recibe: ${selectedAthlete.name}`
                  : 'Selecciona un jugador para continuar.'
                : 'Recibe: todo el equipo.'}
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}

export default App;
