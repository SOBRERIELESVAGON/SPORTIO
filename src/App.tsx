import { useState, type FormEvent } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

type AttendanceStatus = 'Presente' | 'Ausente' | 'Tarde';

type Athlete = {
  id: number;
  name: string;
  sport: string;
  status: AttendanceStatus;
};

type Session = {
  id: number;
  title: string;
  team: string;
  time: string;
  attendance: number;
};

type GoogleJwtPayload = {
  email?: string;
  given_name?: string;
  name?: string;
  picture?: string;
  sub?: string;
};

type AuthenticatedUser = {
  email: string;
  name: string;
  picture?: string;
};

type AppProps = {
  googleClientIdConfigured: boolean;
};

const sportOptions = [
  'Fútbol',
  'Rugby',
  'Baloncesto',
  'Voleibol',
  'Hockey sobre césped',
  'Cricket',
  'Otro',
  'Hockey sobre hielo',
  'Waterpolo',
  'Ultimate frisbee',
  'Beisbol',
  'Softbol',
  'Fútbol americano',
  'Polo',
  'Futsal',
  'Lacrosse',
];

const initialAthletes: Athlete[] = [
  { id: 1, name: 'Lucia Mendez', sport: 'Fútbol', status: 'Presente' },
  { id: 2, name: 'Mateo Rojas', sport: 'Baloncesto', status: 'Tarde' },
  { id: 3, name: 'Sofia Arias', sport: 'Voleibol', status: 'Presente' },
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

function decodeGoogleCredential(credential: string): GoogleJwtPayload | null {
  const [, payload] = credential.split('.');

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    return JSON.parse(json) as GoogleJwtPayload;
  } catch {
    return null;
  }
}

function userFromGoogleCredential(response: CredentialResponse): AuthenticatedUser | null {
  if (!response.credential) {
    return null;
  }

  const payload = decodeGoogleCredential(response.credential);

  if (!payload?.email) {
    return null;
  }

  return {
    email: payload.email,
    name: payload.name ?? payload.given_name ?? payload.email,
    picture: payload.picture,
  };
}

function LoginScreen({
  error,
  googleClientIdConfigured,
  onDemoAccess,
  onGoogleSuccess,
  onGoogleError,
}: {
  error: string | null;
  googleClientIdConfigured: boolean;
  onDemoAccess: () => void;
  onGoogleSuccess: (response: CredentialResponse) => void;
  onGoogleError: () => void;
}) {
  return (
    <main className="login-layout">
      <section className="login-hero">
        <a className="brand" href="#inicio" aria-label="Sportia inicio">
          <span className="brand-mark">S</span>
          <span>Sportia</span>
        </a>
        <p className="eyebrow">Acceso para entrenadores</p>
        <h1>Entra a Sportia con tu cuenta de Google.</h1>
        <p>
          Centraliza asistencia, equipos y entrenamientos con un acceso simple para
          entrenadores y coordinadores deportivos.
        </p>
      </section>

      <section className="login-card" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Login</p>
          <h2 id="login-title">Continuar con Google</h2>
          <p>
            Usaremos Google Identity Services para validar tu identidad antes de abrir el
            panel de Sportia.
          </p>
        </div>

        {googleClientIdConfigured ? (
          <div className="google-login-frame">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              text="continue_with"
              shape="pill"
              size="large"
              theme="outline"
              useOneTap
            />
          </div>
        ) : (
          <div className="config-warning" role="status">
            <strong>Falta configurar Google.</strong>
            <span>
              Crea un archivo <code>.env</code> con <code>VITE_GOOGLE_CLIENT_ID</code>.
              Mientras tanto puedes entrar en modo demo.
            </span>
          </div>
        )}

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="demo-button" type="button" onClick={onDemoAccess}>
          Entrar en modo demo
        </button>
      </section>
    </main>
  );
}

function App({ googleClientIdConfigured }: AppProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [athleteList, setAthleteList] = useState<Athlete[]>(initialAthletes);
  const [newAthlete, setNewAthlete] = useState({
    name: '',
    sport: sportOptions[0],
    status: 'Presente' as AttendanceStatus,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const presentCount = athleteList.filter((athlete) => athlete.status === 'Presente').length;
  const attendancePercentage = Math.round((presentCount / athleteList.length) * 100);
  const teamCount = new Set(athleteList.map((athlete) => athlete.sport)).size;
  const metrics = [
    { label: 'Deportistas cargados', value: String(athleteList.length) },
    { label: 'Asistencia de hoy', value: `${attendancePercentage}%` },
    { label: 'Deportes activos', value: String(teamCount) },
  ];

  const handleGoogleSuccess = (response: CredentialResponse) => {
    const googleUser = userFromGoogleCredential(response);

    if (!googleUser) {
      setAuthError('No pudimos leer los datos de Google. Intentalo nuevamente.');
      return;
    }

    setUser(googleUser);
    setAuthError(null);
  };

  const handleDemoAccess = () => {
    setUser({
      email: 'demo@sportia.app',
      name: 'Entrenador demo',
    });
    setAuthError(null);
  };

  const handleAthleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newAthlete.name.trim();
    const trimmedSport = newAthlete.sport.trim();

    if (!trimmedName || !trimmedSport) {
      setSaveMessage('Completa nombre y deporte para cargar el registro.');
      return;
    }

    const athlete: Athlete = {
      id: Date.now(),
      name: trimmedName,
      sport: trimmedSport,
      status: newAthlete.status,
    };

    setAthleteList((currentAthletes) => [athlete, ...currentAthletes]);
    setNewAthlete({ name: '', sport: sportOptions[0], status: 'Presente' });
    setSaveMessage(`${trimmedName} fue cargado correctamente.`);
  };

  if (!user) {
    return (
      <LoginScreen
        error={authError}
        googleClientIdConfigured={googleClientIdConfigured}
        onDemoAccess={handleDemoAccess}
        onGoogleError={() => setAuthError('Google no pudo iniciar sesion. Intentalo otra vez.')}
        onGoogleSuccess={handleGoogleSuccess}
      />
    );
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Principal">
        <a className="brand" href="#inicio" aria-label="Sportia inicio">
          <span className="brand-mark">S</span>
          <span>Sportia</span>
        </a>
        <div className="nav-links">
          <a href="#asistencia">Asistencia</a>
          <a href="#carga-datos">Carga</a>
          <a href="#equipos">Equipos</a>
          <a href="#sesiones">Sesiones</a>
        </div>
        <div className="user-menu">
          {user.picture ? (
            <img className="user-avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="user-avatar fallback">{user.name.charAt(0)}</span>
          )}
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button className="sign-out-button" type="button" onClick={() => setUser(null)}>
            Salir
          </button>
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
            <a className="secondary-button" href="#carga-datos">
              Cargar datos
            </a>
          </div>
        </div>

        <aside className="attendance-card" id="asistencia" aria-label="Resumen de asistencia de hoy">
          <div className="card-header">
            <span>Entrenamiento de hoy</span>
            <strong>{presentCount}/{athleteList.length}</strong>
          </div>
          <h2>Lista rapida</h2>
          <div className="athlete-list">
            {athleteList.slice(0, 5).map((athlete) => (
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

      <section className="data-entry-panel" id="carga-datos" aria-labelledby="data-entry-title">
        <div className="section-heading">
          <p className="eyebrow">Carga de datos</p>
          <h2 id="data-entry-title">Registrar asistencia de deportistas</h2>
          <p>
            Carga un deportista, asignale deporte o equipo y marca su estado para que el
            tablero se actualice al instante.
          </p>
        </div>

        <form className="data-form" onSubmit={handleAthleteSubmit}>
          <label>
            Nombre del deportista
            <input
              type="text"
              value={newAthlete.name}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ej: Valentina Perez"
            />
          </label>

          <label>
            Deporte
            <select
              value={newAthlete.sport}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, sport: event.target.value }))
              }
            >
              {sportOptions.map((sport) => (
                <option value={sport} key={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado
            <select
              value={newAthlete.status}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  status: event.target.value as AttendanceStatus,
                }))
              }
            >
              <option value="Presente">Presente</option>
              <option value="Tarde">Tarde</option>
              <option value="Ausente">Ausente</option>
            </select>
          </label>

          <button className="primary-button form-button" type="submit">
            Guardar registro
          </button>
        </form>

        {saveMessage ? <p className="save-message">{saveMessage}</p> : null}

        <div className="data-table" aria-label="Registros cargados">
          <div className="data-table-header">
            <span>Deportista</span>
            <span>Deporte/equipo</span>
            <span>Estado</span>
          </div>
          {athleteList.map((athlete) => (
            <article className="data-table-row" key={athlete.id}>
              <strong>{athlete.name}</strong>
              <span>{athlete.sport}</span>
              <span className={`status status-${athlete.status.toLowerCase()}`}>
                {athlete.status}
              </span>
            </article>
          ))}
        </div>
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
          <a className="secondary-button light" href="#carga-datos">
            Empezar carga
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
