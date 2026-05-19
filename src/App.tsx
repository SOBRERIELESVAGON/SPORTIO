import { useState, type FormEvent } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

type AttendanceStatus = 'Presente' | 'Ausente' | 'Tarde';
type ReportPeriod =
  | 'Diario'
  | 'Semanal'
  | 'Mensual'
  | 'Bimestral'
  | 'Trimestral'
  | 'Semestral'
  | 'Anual';
type ReportScope = 'General' | 'División' | 'Equipo' | 'Camada' | 'Individual';

type Athlete = {
  id: number;
  memberNumber: string;
  lastName: string;
  firstName: string;
  dni: string;
  address: string;
  birthDate: string;
  age: string;
  phone: string;
  email: string;
  paymentMethod: string;
  memberStatus: 'Activo' | 'Inactivo';
  membershipType: string;
  nextBillingDate: string;
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

const allSportsReportOption = 'Todos los deportes';

const reportPeriods: ReportPeriod[] = [
  'Diario',
  'Semanal',
  'Mensual',
  'Bimestral',
  'Trimestral',
  'Semestral',
  'Anual',
];

const reportScopes: ReportScope[] = ['General', 'División', 'Equipo', 'Camada', 'Individual'];

const reportGroupsByScope: Record<Exclude<ReportScope, 'Individual'>, string[]> = {
  General: ['Toda la institución'],
  División: ['Sub 14', 'Sub 16', 'Sub 18', 'Primera'],
  Equipo: ['Fútbol Sub 16', 'Rugby M17', 'Voleibol mixto', 'Baloncesto femenino'],
  Camada: ['Camada 2008', 'Camada 2009', 'Camada 2010', 'Camada 2011'],
};

const reportSeriesByPeriod: Record<ReportPeriod, { label: string; attendance: number }[]> = {
  Diario: [
    { label: 'Lun', attendance: 82 },
    { label: 'Mar', attendance: 88 },
    { label: 'Mié', attendance: 91 },
    { label: 'Jue', attendance: 76 },
    { label: 'Vie', attendance: 94 },
  ],
  Semanal: [
    { label: 'Sem 1', attendance: 78 },
    { label: 'Sem 2', attendance: 84 },
    { label: 'Sem 3', attendance: 89 },
    { label: 'Sem 4', attendance: 92 },
  ],
  Mensual: [
    { label: 'Ene', attendance: 72 },
    { label: 'Feb', attendance: 80 },
    { label: 'Mar', attendance: 86 },
    { label: 'Abr', attendance: 90 },
  ],
  Bimestral: [
    { label: 'Bim 1', attendance: 76 },
    { label: 'Bim 2', attendance: 83 },
    { label: 'Bim 3', attendance: 87 },
    { label: 'Bim 4', attendance: 91 },
  ],
  Trimestral: [
    { label: 'Tri 1', attendance: 79 },
    { label: 'Tri 2', attendance: 85 },
    { label: 'Tri 3', attendance: 88 },
    { label: 'Tri 4', attendance: 93 },
  ],
  Semestral: [
    { label: 'Sem 1', attendance: 84 },
    { label: 'Sem 2', attendance: 91 },
  ],
  Anual: [
    { label: '2022', attendance: 74 },
    { label: '2023', attendance: 81 },
    { label: '2024', attendance: 87 },
    { label: '2025', attendance: 90 },
  ],
};

function clampAttendance(value: number) {
  return Math.min(100, Math.max(0, value));
}

function buildSportReportSeries(period: ReportPeriod, sport: string) {
  const baseSeries = reportSeriesByPeriod[period];

  if (sport === allSportsReportOption) {
    return baseSeries;
  }

  const sportIndex = sportOptions.indexOf(sport);
  const sportOffset = ((sportIndex % 5) - 2) * 3;

  return baseSeries.map((item, index) => ({
    ...item,
    attendance: clampAttendance(
      item.attendance + sportOffset + (index % 2 === 0 ? sportIndex % 4 : -(sportIndex % 3)),
    ),
  }));
}

function getAthleteFullName(athlete: Athlete) {
  return `${athlete.lastName} ${athlete.firstName}`.trim();
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

const initialAthletes: Athlete[] = [
  {
    id: 1,
    memberNumber: '4613',
    lastName: 'MENDIVIL',
    firstName: 'BENICIO',
    dni: '60.910.046',
    address: 'Avenida Paraguay 526, Salta',
    birthDate: '27/02/2018',
    age: '8',
    phone: '3874098343',
    email: 'natalia.valdez1317@gmail.com',
    paymentMethod: 'Mercado Pago',
    memberStatus: 'Activo',
    membershipType: 'Menor familia',
    nextBillingDate: '30/04/2026',
    sport: 'Rugby',
    status: 'Presente',
  },
  {
    id: 2,
    memberNumber: '4614',
    lastName: 'MENDEZ',
    firstName: 'LUCIA',
    dni: '54.128.882',
    address: 'Las Heras 120, Salta',
    birthDate: '14/08/2011',
    age: '14',
    phone: '3875551234',
    email: 'lucia.mendez@example.com',
    paymentMethod: 'Transferencia',
    memberStatus: 'Activo',
    membershipType: 'Jugador juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Fútbol',
    status: 'Presente',
  },
  {
    id: 3,
    memberNumber: '4615',
    lastName: 'ROJAS',
    firstName: 'MATEO',
    dni: '52.443.219',
    address: 'Belgrano 880, Salta',
    birthDate: '03/11/2010',
    age: '15',
    phone: '3875556778',
    email: 'mateo.rojas@example.com',
    paymentMethod: 'Efectivo',
    memberStatus: 'Activo',
    membershipType: 'Jugador juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Baloncesto',
    status: 'Tarde',
  },
  {
    id: 4,
    memberNumber: '4616',
    lastName: 'ARIAS',
    firstName: 'SOFIA',
    dni: '53.887.102',
    address: 'San Martin 410, Salta',
    birthDate: '22/05/2012',
    age: '13',
    phone: '3875554321',
    email: 'sofia.arias@example.com',
    paymentMethod: 'Debito automatico',
    memberStatus: 'Activo',
    membershipType: 'Jugadora juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Voleibol',
    status: 'Ausente',
  },
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
    memberNumber: '',
    lastName: '',
    firstName: '',
    dni: '',
    address: '',
    birthDate: '',
    age: '',
    phone: '',
    email: '',
    paymentMethod: '',
    memberStatus: 'Activo' as Athlete['memberStatus'],
    membershipType: '',
    nextBillingDate: '',
    sport: sportOptions[0],
    status: 'Presente' as AttendanceStatus,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('Semanal');
  const [reportSport, setReportSport] = useState(allSportsReportOption);
  const [reportScope, setReportScope] = useState<ReportScope>('General');
  const [reportTarget, setReportTarget] = useState(reportGroupsByScope.General[0]);
  const presentCount = athleteList.filter((athlete) => athlete.status === 'Presente').length;
  const attendancePercentage = Math.round((presentCount / athleteList.length) * 100);
  const teamCount = new Set(athleteList.map((athlete) => athlete.sport)).size;
  const reportSeries = buildSportReportSeries(reportPeriod, reportSport);
  const reportAverage = Math.round(
    reportSeries.reduce((total, item) => total + item.attendance, 0) / reportSeries.length,
  );
  const reportPeak = reportSeries.reduce((best, item) =>
    item.attendance > best.attendance ? item : best,
  );
  const athletesForReportSport =
    reportSport === allSportsReportOption
      ? athleteList
      : athleteList.filter((athlete) => athlete.sport === reportSport);
  const individualReportTargets =
    athletesForReportSport.length > 0
      ? athletesForReportSport.map((athlete) => getAthleteFullName(athlete))
      : ['Sin deportistas cargados'];
  const reportTargetOptions =
    reportScope === 'Individual' ? individualReportTargets : reportGroupsByScope[reportScope];
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

    const trimmedFirstName = newAthlete.firstName.trim();
    const trimmedLastName = newAthlete.lastName.trim();
    const trimmedDni = newAthlete.dni.trim();
    const trimmedSport = newAthlete.sport.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedDni || !trimmedSport) {
      setSaveMessage('Completa apellido, nombre, DNI y deporte para cargar el registro.');
      return;
    }

    const athlete: Athlete = {
      id: Date.now(),
      memberNumber: newAthlete.memberNumber.trim(),
      lastName: trimmedLastName.toUpperCase(),
      firstName: trimmedFirstName.toUpperCase(),
      dni: trimmedDni,
      address: newAthlete.address.trim(),
      birthDate: newAthlete.birthDate.trim(),
      age: newAthlete.age.trim(),
      phone: newAthlete.phone.trim(),
      email: newAthlete.email.trim(),
      paymentMethod: newAthlete.paymentMethod.trim(),
      memberStatus: newAthlete.memberStatus,
      membershipType: newAthlete.membershipType.trim(),
      nextBillingDate: newAthlete.nextBillingDate.trim(),
      sport: trimmedSport,
      status: newAthlete.status,
    };

    setAthleteList((currentAthletes) => [athlete, ...currentAthletes]);
    setNewAthlete({
      memberNumber: '',
      lastName: '',
      firstName: '',
      dni: '',
      address: '',
      birthDate: '',
      age: '',
      phone: '',
      email: '',
      paymentMethod: '',
      memberStatus: 'Activo',
      membershipType: '',
      nextBillingDate: '',
      sport: sportOptions[0],
      status: 'Presente',
    });
    setSaveMessage(
      `${trimmedLastName.toUpperCase()} ${trimmedFirstName.toUpperCase()} fue cargado correctamente.`,
    );
  };

  const exportAthletesToExcel = () => {
    const headers = [
      'Nro socio',
      'Apellido',
      'Nombre',
      'DNI',
      'Deporte',
      'Asistencia',
      'Activo',
      'Domicilio',
      'Fecha nacimiento',
      'Edad',
      'Telefono/Celular',
      'Email',
      'Forma de pago',
      'Tipo socio',
      'Proximo cobro',
    ];
    const rows = athleteList.map((athlete) => [
      athlete.memberNumber,
      athlete.lastName,
      athlete.firstName,
      athlete.dni,
      athlete.sport,
      athlete.status,
      athlete.memberStatus,
      athlete.address,
      athlete.birthDate,
      athlete.age,
      athlete.phone,
      athlete.email,
      athlete.paymentMethod,
      athlete.membershipType,
      athlete.nextBillingDate,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => csvCell(value)).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'jugadores-sportia.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReportScopeChange = (scope: ReportScope) => {
    setReportScope(scope);
    setReportTarget(
      scope === 'Individual' ? individualReportTargets[0] : reportGroupsByScope[scope][0],
    );
  };

  const handleReportSportChange = (sport: string) => {
    const athletesInSelectedSport =
      sport === allSportsReportOption
        ? athleteList
        : athleteList.filter((athlete) => athlete.sport === sport);

    setReportSport(sport);

    if (reportScope === 'Individual') {
      setReportTarget(
        athletesInSelectedSport[0]
          ? getAthleteFullName(athletesInSelectedSport[0])
          : 'Sin deportistas cargados',
      );
    }
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
          <a href="#reportes">Reportes</a>
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
            <a className="secondary-button" href="#reportes">
              Ver reportes
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
                  <strong>{getAthleteFullName(athlete)}</strong>
                  <span>{athlete.sport} · DNI {athlete.dni}</span>
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
          <h2 id="data-entry-title">Registrar ficha de jugadores</h2>
          <p>
            Carga apellido, nombre, DNI y datos de socio por separado para exportarlos a Excel
            con columnas independientes.
          </p>
        </div>

        <form className="data-form data-form-expanded" onSubmit={handleAthleteSubmit}>
          <label>
            Nro. socio
            <input
              type="text"
              value={newAthlete.memberNumber}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, memberNumber: event.target.value }))
              }
              placeholder="Ej: 4613"
            />
          </label>

          <label>
            Apellido
            <input
              type="text"
              value={newAthlete.lastName}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, lastName: event.target.value }))
              }
              placeholder="Ej: Mendivil"
            />
          </label>

          <label>
            Nombre
            <input
              type="text"
              value={newAthlete.firstName}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, firstName: event.target.value }))
              }
              placeholder="Ej: Benicio"
            />
          </label>

          <label>
            DNI
            <input
              type="text"
              value={newAthlete.dni}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, dni: event.target.value }))
              }
              placeholder="Ej: 60.910.046"
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
            Activo
            <select
              value={newAthlete.memberStatus}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  memberStatus: event.target.value as Athlete['memberStatus'],
                }))
              }
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>

          <label>
            Asistencia
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

          <label>
            Domicilio
            <input
              type="text"
              value={newAthlete.address}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Ej: Avenida Paraguay 526"
            />
          </label>

          <label>
            Fecha nacimiento
            <input
              type="text"
              value={newAthlete.birthDate}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, birthDate: event.target.value }))
              }
              placeholder="Ej: 27/02/2018"
            />
          </label>

          <label>
            Edad
            <input
              type="text"
              value={newAthlete.age}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, age: event.target.value }))
              }
              placeholder="Ej: 8"
            />
          </label>

          <label>
            Teléfono / celular
            <input
              type="text"
              value={newAthlete.phone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="Ej: 3874098343"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={newAthlete.email}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="Ej: jugador@email.com"
            />
          </label>

          <label>
            Forma de pago
            <input
              type="text"
              value={newAthlete.paymentMethod}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, paymentMethod: event.target.value }))
              }
              placeholder="Ej: Mercado Pago"
            />
          </label>

          <label>
            Tipo socio
            <input
              type="text"
              value={newAthlete.membershipType}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, membershipType: event.target.value }))
              }
              placeholder="Ej: Menor familia"
            />
          </label>

          <label>
            Próximo cobro
            <input
              type="text"
              value={newAthlete.nextBillingDate}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, nextBillingDate: event.target.value }))
              }
              placeholder="Ej: 30/04/2026"
            />
          </label>

          <button className="primary-button form-button" type="submit">
            Guardar registro
          </button>
          <button className="export-button" type="button" onClick={exportAthletesToExcel}>
            Exportar Excel
          </button>
        </form>

        {saveMessage ? <p className="save-message">{saveMessage}</p> : null}

        <div className="data-table" aria-label="Registros cargados">
          <div className="data-table-header">
            <span>Nro. socio</span>
            <span>Jugador</span>
            <span>DNI</span>
            <span>Deporte</span>
            <span>Asistencia</span>
          </div>
          {athleteList.map((athlete) => (
            <article className="data-table-row" key={athlete.id}>
              <span>{athlete.memberNumber || '-'}</span>
              <strong>{getAthleteFullName(athlete)}</strong>
              <span>{athlete.dni}</span>
              <span>{athlete.sport}</span>
              <span className={`status status-${athlete.status.toLowerCase()}`}>
                {athlete.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="report-panel" id="reportes" aria-labelledby="report-title">
        <div className="section-heading">
          <p className="eyebrow">Reportes</p>
          <h2 id="report-title">Ejemplo de reporte de asistencia</h2>
          <p>
            Este ejemplo muestra como Sportia puede medir asistencia por deportista o de forma
            general para toda una división, equipo o camada.
          </p>
        </div>

        <div className="report-filters" aria-label="Filtros de reporte">
          <label>
            Periodo
            <select
              value={reportPeriod}
              onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
            >
              {reportPeriods.map((period) => (
                <option value={period} key={period}>
                  {period}
                </option>
              ))}
            </select>
          </label>

          <label>
            Deporte
            <select value={reportSport} onChange={(event) => handleReportSportChange(event.target.value)}>
              {[allSportsReportOption, ...sportOptions].map((sport) => (
                <option value={sport} key={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>

          <label>
            Alcance
            <select
              value={reportScope}
              onChange={(event) => handleReportScopeChange(event.target.value as ReportScope)}
            >
              {reportScopes.map((scope) => (
                <option value={scope} key={scope}>
                  {scope}
                </option>
              ))}
            </select>
          </label>

          <label>
            {reportScope === 'Individual' ? 'Jugador' : reportScope}
            <select value={reportTarget} onChange={(event) => setReportTarget(event.target.value)}>
              {reportTargetOptions.map((target) => (
                <option value={target} key={target}>
                  {target}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="report-summary">
          <article>
            <span>Reporte</span>
            <strong>
              {reportPeriod} · {reportSport} · {reportTarget}
            </strong>
          </article>
          <article>
            <span>Promedio</span>
            <strong>{reportAverage}%</strong>
          </article>
          <article>
            <span>Mejor marca</span>
            <strong>
              {reportPeak.attendance}% en {reportPeak.label}
            </strong>
          </article>
        </div>

        <div
          className="chart-card"
          aria-label={`Gráfico de asistencia ${reportPeriod} de ${reportSport}`}
        >
          <div className="chart-grid" aria-hidden="true">
            {reportSeries.map((item) => (
              <div className="chart-column" key={`${reportPeriod}-${item.label}`}>
                <span className="chart-value">{item.attendance}%</span>
                <div className="chart-track">
                  <span className="chart-bar" style={{ height: `${item.attendance}%` }} />
                </div>
                <span className="chart-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="report-note">
          Ejemplo: si elegís <strong>Fútbol</strong>, todo el gráfico se recalcula para Fútbol.
          Si además elegís <strong>Individual</strong>, muestra un deportista de ese deporte; con{' '}
          <strong>División</strong>, <strong>Equipo</strong> o <strong>Camada</strong>, muestra el
          consolidado del grupo seleccionado dentro de ese deporte.
        </p>
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
