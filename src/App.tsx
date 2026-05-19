import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import {
  downloadPlayerImportTemplate,
  parseSpreadsheetFile,
  recognizePlayerFromImage,
  type PlayerImportData,
} from './playerImport';

type AttendanceStatus = 'Presente' | 'Ausente';
type AttendanceActivity = 'Entrenamiento' | 'Partido';
type UserRole = 'Jugador' | 'Staff' | 'Coordinación' | 'Master';
type ProtectedRole = Exclude<UserRole, 'Jugador'>;
type LanguageCode =
  | 'es'
  | 'en'
  | 'pt'
  | 'fr'
  | 'it'
  | 'de'
  | 'nl'
  | 'ca'
  | 'gl'
  | 'eu'
  | 'zh';
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
  playerPhone: string;
  fatherPhone: string;
  motherPhone: string;
  email: string;
  healthInsurance: string;
  healthInsuranceNumber: string;
  paymentMethod: string;
  memberStatus: 'Activo' | 'Inactivo';
  membershipType: string;
  nextBillingDate: string;
  sport: string;
  team: string;
  cohort: string;
  perfectAttendance30Days: boolean;
  trainingsAttended: number;
  trainingsTotal: number;
  matchesAttended: number;
  matchesTotal: number;
  toursAttended: number;
  toursTotal: number;
  stayedAsGuest: boolean;
  hostedGuest: boolean;
  status: AttendanceStatus;
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
  'Básquet',
  'Vóley',
  'Hockey sobre césped',
  'Handball',
  'Futsal',
  'Hockey sobre hielo',
  'Waterpolo',
  'Béisbol',
  'Sóftbol',
  'Fútbol americano',
  'Polo',
  'Lacrosse',
  'Cricket',
  'Ultimate frisbee',
  'Tenis',
  'Pádel',
  'Atletismo',
  'Natación',
  'Ciclismo',
  'Boxeo',
  'Judo',
  'Taekwondo',
  'Karate',
  'Gimnasia artística',
  'Remo',
  'Canotaje',
  'Esgrima',
  'Golf',
];

const allSportsReportOption = 'Todos los deportes';
const rememberedRoleKey = 'sportia.rememberedRole';
const rememberedPasswordKey = 'sportia.rememberedPassword';
const preferredSportKey = 'sportia.preferredSport';
const languageOptions: { code: LanguageCode; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ca', label: 'Català' },
  { code: 'gl', label: 'Galego' },
  { code: 'eu', label: 'Euskera' },
  { code: 'zh', label: '中文' },
];
const protectedRoles: ProtectedRole[] = ['Staff', 'Coordinación', 'Master'];
const rolePasswords: Record<ProtectedRole, string> = {
  Staff: 'staff2026',
  Coordinación: 'coord2026',
  Master: 'master2026',
};
const rankingScopes = ['Camada', 'Edad', 'Equipo'] as const;

const adSlots = [
  {
    id: 'hero-ad',
    title: 'Publicidad principal',
    placement: 'Home / Ranking',
    size: '970 x 250',
  },
  {
    id: 'sidebar-ad',
    title: 'Publicidad lateral',
    placement: 'Paneles internos',
    size: '300 x 250',
  },
  {
    id: 'footer-ad',
    title: 'Publicidad inferior',
    placement: 'Todas las vistas',
    size: '728 x 90',
  },
];

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
  Equipo: ['Fútbol Sub 16', 'Rugby M17', 'Vóley mixto', 'Básquet femenino'],
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

function ratio(attended: number, total: number) {
  return total > 0 ? attended / total : 0;
}

function calculateRankingScore(athlete: Athlete) {
  const trainingScore = ratio(athlete.trainingsAttended, athlete.trainingsTotal) * 10;
  const matchScore = ratio(athlete.matchesAttended, athlete.matchesTotal) * 10;
  const tourScore = ratio(athlete.toursAttended, athlete.toursTotal) * 10;
  const hostingScore = (athlete.stayedAsGuest ? 20 : 0) + (athlete.hostedGuest ? 20 : 0);

  return Math.round(trainingScore + matchScore + tourScore + hostingScore);
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function numberFromForm(value: string) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}

function athleteFromImportData(data: PlayerImportData, id: number): Athlete {
  return {
    id,
    memberNumber: data.memberNumber.trim(),
    lastName: data.lastName.trim().toUpperCase(),
    firstName: data.firstName.trim().toUpperCase(),
    dni: data.dni.trim(),
    address: data.address.trim(),
    birthDate: data.birthDate.trim(),
    age: data.age.trim(),
    playerPhone: data.playerPhone.trim(),
    fatherPhone: data.fatherPhone.trim(),
    motherPhone: data.motherPhone.trim(),
    email: data.email.trim(),
    healthInsurance: data.healthInsurance.trim(),
    healthInsuranceNumber: data.healthInsuranceNumber.trim(),
    paymentMethod: data.paymentMethod.trim(),
    memberStatus: data.memberStatus,
    membershipType: data.membershipType.trim(),
    nextBillingDate: data.nextBillingDate.trim(),
    sport: data.sport.trim(),
    team: data.team.trim(),
    cohort: data.cohort.trim(),
    perfectAttendance30Days: data.perfectAttendance30Days,
    trainingsAttended: data.trainingsAttended,
    trainingsTotal: data.trainingsTotal,
    matchesAttended: data.matchesAttended,
    matchesTotal: data.matchesTotal,
    toursAttended: data.toursAttended,
    toursTotal: data.toursTotal,
    stayedAsGuest: data.stayedAsGuest,
    hostedGuest: data.hostedGuest,
    status: data.status,
  };
}

function importDataToFormState(data: PlayerImportData, preferredSport: string) {
  return {
    memberNumber: data.memberNumber,
    lastName: data.lastName,
    firstName: data.firstName,
    dni: data.dni,
    address: data.address,
    birthDate: data.birthDate,
    age: data.age,
    playerPhone: data.playerPhone,
    fatherPhone: data.fatherPhone,
    motherPhone: data.motherPhone,
    email: data.email,
    healthInsurance: data.healthInsurance,
    healthInsuranceNumber: data.healthInsuranceNumber,
    paymentMethod: data.paymentMethod,
    memberStatus: data.memberStatus,
    membershipType: data.membershipType,
    nextBillingDate: data.nextBillingDate,
    sport: data.sport || preferredSport,
    team: data.team,
    cohort: data.cohort,
    perfectAttendance30Days: data.perfectAttendance30Days,
    trainingsAttended: String(data.trainingsAttended),
    trainingsTotal: String(data.trainingsTotal),
    matchesAttended: String(data.matchesAttended),
    matchesTotal: String(data.matchesTotal),
    toursAttended: String(data.toursAttended),
    toursTotal: String(data.toursTotal),
    stayedAsGuest: data.stayedAsGuest,
    hostedGuest: data.hostedGuest,
    status: data.status,
  };
}

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage can be unavailable in private browsing or restricted contexts.
  }
}

function removeStoredValue(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Local storage can be unavailable in private browsing or restricted contexts.
  }
}

function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
}: {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}) {
  return (
    <label className="language-selector">
      Idioma
      <select
        value={selectedLanguage}
        onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}
      >
        {languageOptions.map((language) => (
          <option value={language.code} key={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SportPreferenceSelector({
  selectedSport,
  onSportChange,
}: {
  selectedSport: string;
  onSportChange: (sport: string) => void;
}) {
  return (
    <label className="sport-preference-selector">
      Deporte fijo
      <select value={selectedSport} onChange={(event) => onSportChange(event.target.value)}>
        {sportOptions.map((sport) => (
          <option value={sport} key={sport}>
            {sport}
          </option>
        ))}
      </select>
    </label>
  );
}

function AdSlot({ title, placement, size }: { title: string; placement: string; size: string }) {
  return (
    <aside className="ad-slot" aria-label={title}>
      <span>Espacio publicitario</span>
      <strong>{title}</strong>
      <p>{placement}</p>
      <small>{size} · Administrado por el dueño de Sportia</small>
    </aside>
  );
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
    playerPhone: '3874098343',
    fatherPhone: '3875001001',
    motherPhone: '3875001002',
    email: 'natalia.valdez1317@gmail.com',
    healthInsurance: 'OSDE',
    healthInsuranceNumber: '2-4613-08',
    paymentMethod: 'Mercado Pago',
    memberStatus: 'Activo',
    membershipType: 'Menor familia',
    nextBillingDate: '30/04/2026',
    sport: 'Rugby',
    team: 'Rugby M8',
    cohort: 'Camada 2018',
    perfectAttendance30Days: true,
    trainingsAttended: 12,
    trainingsTotal: 12,
    matchesAttended: 4,
    matchesTotal: 4,
    toursAttended: 1,
    toursTotal: 1,
    stayedAsGuest: true,
    hostedGuest: true,
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
    playerPhone: '3875551234',
    fatherPhone: '3875551200',
    motherPhone: '3875551201',
    email: 'lucia.mendez@example.com',
    healthInsurance: 'Swiss Medical',
    healthInsuranceNumber: 'SM-54128882',
    paymentMethod: 'Transferencia',
    memberStatus: 'Activo',
    membershipType: 'Jugador juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Fútbol',
    team: 'Fútbol Sub 14',
    cohort: 'Camada 2011',
    perfectAttendance30Days: true,
    trainingsAttended: 11,
    trainingsTotal: 12,
    matchesAttended: 3,
    matchesTotal: 4,
    toursAttended: 1,
    toursTotal: 1,
    stayedAsGuest: false,
    hostedGuest: true,
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
    playerPhone: '3875556778',
    fatherPhone: '3875556700',
    motherPhone: '3875556701',
    email: 'mateo.rojas@example.com',
    healthInsurance: 'Galeno',
    healthInsuranceNumber: 'GA-52443219',
    paymentMethod: 'Efectivo',
    memberStatus: 'Activo',
    membershipType: 'Jugador juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Básquet',
    team: 'Básquet Sub 15',
    cohort: 'Camada 2010',
    perfectAttendance30Days: false,
    trainingsAttended: 9,
    trainingsTotal: 12,
    matchesAttended: 4,
    matchesTotal: 5,
    toursAttended: 1,
    toursTotal: 1,
    stayedAsGuest: true,
    hostedGuest: false,
    status: 'Presente',
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
    playerPhone: '3875554321',
    fatherPhone: '3875554300',
    motherPhone: '3875554301',
    email: 'sofia.arias@example.com',
    healthInsurance: 'Medife',
    healthInsuranceNumber: 'ME-53887102',
    paymentMethod: 'Debito automatico',
    memberStatus: 'Activo',
    membershipType: 'Jugadora juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Vóley',
    team: 'Vóley Sub 13',
    cohort: 'Camada 2012',
    perfectAttendance30Days: false,
    trainingsAttended: 8,
    trainingsTotal: 12,
    matchesAttended: 2,
    matchesTotal: 4,
    toursAttended: 1,
    toursTotal: 1,
    stayedAsGuest: false,
    hostedGuest: false,
    status: 'Presente',
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
  athletes,
  googleClientIdConfigured,
  onPlayerAccess,
  onStaffAccess,
  onGoogleError,
  onLanguageChange,
  onPreferredSportChange,
  preferredSport,
  selectedLanguage,
}: {
  error: string | null;
  athletes: Athlete[];
  googleClientIdConfigured: boolean;
  onPlayerAccess: (athleteId: number) => void;
  onStaffAccess: (role: ProtectedRole, password: string, rememberPassword: boolean) => void;
  onGoogleError: () => void;
  onLanguageChange: (language: LanguageCode) => void;
  onPreferredSportChange: (sport: string) => void;
  preferredSport: string;
  selectedLanguage: LanguageCode;
}) {
  const [staffRole, setStaffRole] = useState<ProtectedRole>(() => {
    const savedRole = readStoredValue(rememberedRoleKey);

    return protectedRoles.includes(savedRole as ProtectedRole) ? (savedRole as ProtectedRole) : 'Staff';
  });
  const [staffPassword, setStaffPassword] = useState(() => readStoredValue(rememberedPasswordKey) ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(() =>
    Boolean(readStoredValue(rememberedPasswordKey)),
  );
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? 0);
  const [googleIdentity, setGoogleIdentity] = useState<string | null>(null);

  const handleStaffSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStaffAccess(staffRole, staffPassword, rememberPassword);
  };

  const handleGoogleSuccess = (response: CredentialResponse) => {
    const googleUser = userFromGoogleCredential(response);

    if (!googleUser) {
      onGoogleError();
      return;
    }

    setGoogleIdentity(googleUser.email);
  };

  return (
    <main className="login-layout">
      <section className="login-hero">
        <a className="brand" href="#inicio" aria-label="Sportia inicio">
          <span className="brand-mark">S</span>
          <span>Sportia</span>
        </a>
        <p className="eyebrow">Acceso por rol</p>
        <h1>Usuarios gratis, publicidad gestionada por vos.</h1>
        <p>
          Clubes, entrenadores, staff, jugadores y coordinación usan Sportia gratis. El ingreso
          Master permite ver todo y administrar el modelo con espacios publicitarios.
        </p>
      </section>

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-language-row">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
          <SportPreferenceSelector
            selectedSport={preferredSport}
            onSportChange={onPreferredSportChange}
          />
        </div>

        <div>
          <p className="eyebrow">Login</p>
          <h2 id="login-title">Elegí cómo entrar</h2>
          <p>
            Las claves de demo son <strong>staff2026</strong> para Staff y{' '}
            <strong>coord2026</strong> para Coordinación. Master usa <strong>master2026</strong>.
          </p>
        </div>

        <form className="access-form" onSubmit={handleStaffSubmit}>
          <label>
            Rol con clave
            <select
              value={staffRole}
              onChange={(event) => setStaffRole(event.target.value as ProtectedRole)}
            >
              {protectedRoles.map((role) => (
                <option value={role} key={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            Clave
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={staffPassword}
                onChange={(event) => setStaffPassword(event.target.value)}
                placeholder="Ingresá la clave"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar clave' : 'Ver clave'}
                onClick={() => setShowPassword((currentValue) => !currentValue)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <label className="remember-password-field">
            <input
              type="checkbox"
              checked={rememberPassword}
              onChange={(event) => setRememberPassword(event.target.checked)}
            />
            Guardar permanentemente esta clave en este navegador
          </label>

          <button className="demo-button" type="submit">
            Entrar como {staffRole}
          </button>
        </form>

        {googleClientIdConfigured ? (
          <div className="google-login-frame">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
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
            <strong>Google opcional no configurado.</strong>
            <span>
              Crea un archivo <code>.env</code> con <code>VITE_GOOGLE_CLIENT_ID</code>.
              Las claves de Staff/Coordinación funcionan igual para esta demo.
            </span>
          </div>
        )}

        {googleIdentity ? (
          <p className="save-message">Google validó {googleIdentity}. Ingresá la clave del rol.</p>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="player-access-card">
          <div>
            <p className="eyebrow">Jugador</p>
            <h3>Entrar sin clave</h3>
            <p>El jugador solo podrá ver su ficha individual y el ranking.</p>
          </div>
          <label>
            Jugador
            <select
              value={selectedAthleteId}
              onChange={(event) => setSelectedAthleteId(Number(event.target.value))}
            >
              {athletes.map((athlete) => (
                <option value={athlete.id} key={athlete.id}>
                  {getAthleteFullName(athlete)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="export-button"
            type="button"
            onClick={() => onPlayerAccess(selectedAthleteId)}
          >
            Entrar como jugador
          </button>
        </div>
      </section>
    </main>
  );
}

function App({ googleClientIdConfigured }: AppProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('es');
  const [preferredSport, setPreferredSport] = useState(() => {
    const storedSport = readStoredValue(preferredSportKey);

    return storedSport && sportOptions.includes(storedSport) ? storedSport : sportOptions[0];
  });
  const [userRole, setUserRole] = useState<UserRole>('Jugador');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
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
    playerPhone: '',
    fatherPhone: '',
    motherPhone: '',
    email: '',
    healthInsurance: '',
    healthInsuranceNumber: '',
    paymentMethod: '',
    memberStatus: 'Activo' as Athlete['memberStatus'],
    membershipType: '',
    nextBillingDate: '',
    sport: preferredSport,
    team: '',
    cohort: '',
    perfectAttendance30Days: false,
    trainingsAttended: '0',
    trainingsTotal: '0',
    matchesAttended: '0',
    matchesTotal: '0',
    toursAttended: '0',
    toursTotal: '0',
    stayedAsGuest: false,
    hostedGuest: false,
    status: 'Presente' as AttendanceStatus,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [attendanceActivity, setAttendanceActivity] =
    useState<AttendanceActivity>('Entrenamiento');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('Semanal');
  const [reportSport, setReportSport] = useState(preferredSport);
  const [reportScope, setReportScope] = useState<ReportScope>('General');
  const [reportTarget, setReportTarget] = useState(reportGroupsByScope.General[0]);
  const presentCount = athleteList.filter((athlete) => athlete.status === 'Presente').length;
  const isPrivilegedUser = userRole === 'Staff' || userRole === 'Coordinación' || userRole === 'Master';
  const canImportPlayers = userRole === 'Staff' || userRole === 'Coordinación';
  const isMasterUser = userRole === 'Master';
  const selectedPlayer = athleteList.find((athlete) => athlete.id === selectedPlayerId) ?? null;
  const attendancePercentage = Math.round((presentCount / athleteList.length) * 100);
  const perfectAttendanceCount = athleteList.filter(
    (athlete) => athlete.perfectAttendance30Days,
  ).length;
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
  const [rankingSport, setRankingSport] = useState(preferredSport);
  const [rankingScope, setRankingScope] = useState<(typeof rankingScopes)[number]>('Camada');
  const rankingCandidates =
    rankingSport === allSportsReportOption
      ? athleteList
      : athleteList.filter((athlete) => athlete.sport === rankingSport);
  const rankingGroupOptions = Array.from(
    new Set(
      rankingCandidates.map((athlete) => {
        if (rankingScope === 'Camada') {
          return athlete.cohort;
        }

        if (rankingScope === 'Edad') {
          return `${athlete.age} años`;
        }

        return athlete.team;
      }),
    ),
  ).filter(Boolean);
  const [rankingGroup, setRankingGroup] = useState('Todos');
  const normalizedRankingGroup =
    rankingGroup === 'Todos' || rankingGroupOptions.includes(rankingGroup)
      ? rankingGroup
      : 'Todos';
  const rankedAthletes = rankingCandidates
    .filter((athlete) => {
      if (normalizedRankingGroup === 'Todos') {
        return true;
      }

      if (rankingScope === 'Camada') {
        return athlete.cohort === normalizedRankingGroup;
      }

      if (rankingScope === 'Edad') {
        return `${athlete.age} años` === normalizedRankingGroup;
      }

      return athlete.team === normalizedRankingGroup;
    })
    .map((athlete) => ({
      athlete,
      score: calculateRankingScore(athlete),
    }))
    .sort((left, right) => right.score - left.score);
  const metrics = [
    { label: 'Deportistas cargados', value: String(athleteList.length) },
    { label: 'Asistencia de hoy', value: `${attendancePercentage}%` },
    { label: 'Medallas 30 días', value: String(perfectAttendanceCount) },
  ];
  const activePlayersCount = athleteList.filter((athlete) => athlete.memberStatus === 'Activo').length;
  const totalTeamsCount = new Set(athleteList.map((athlete) => athlete.team).filter(Boolean)).size;
  const totalCohortsCount = new Set(athleteList.map((athlete) => athlete.cohort).filter(Boolean)).size;
  const averageRankingScore = Math.round(
    athleteList.reduce((total, athlete) => total + calculateRankingScore(athlete), 0) /
      athleteList.length,
  );
  const masterStats = [
    { label: 'Jugadores totales', value: String(athleteList.length) },
    { label: 'Jugadores activos', value: String(activePlayersCount) },
    { label: 'Equipos registrados', value: String(totalTeamsCount) },
    { label: 'Camadas registradas', value: String(totalCohortsCount) },
    { label: 'Staff demo', value: '2' },
    { label: 'Coordinación demo', value: '1' },
    { label: 'Clubes demo', value: '1' },
    { label: 'Promedio ranking', value: `${averageRankingScore} pts` },
  ];

  const handleStaffAccess = (role: ProtectedRole, password: string, rememberPassword: boolean) => {
    if (rolePasswords[role] !== password) {
      setAuthError('Clave incorrecta para el rol seleccionado.');
      return;
    }

    if (rememberPassword) {
      writeStoredValue(rememberedRoleKey, role);
      writeStoredValue(rememberedPasswordKey, password);
    } else {
      removeStoredValue(rememberedRoleKey);
      removeStoredValue(rememberedPasswordKey);
    }

    setUser({
      email: `${role.toLowerCase()}@sportia.app`,
      name: role,
    });
    setUserRole(role);
    setSelectedPlayerId(null);
    setAuthError(null);
  };

  const handlePreferredSportChange = (sport: string) => {
    setPreferredSport(sport);
    writeStoredValue(preferredSportKey, sport);
    setReportSport(sport);
    setRankingSport(sport);
    setNewAthlete((currentAthlete) => ({ ...currentAthlete, sport }));
  };

  const handlePlayerAccess = (athleteId: number) => {
    const athlete = athleteList.find((currentAthlete) => currentAthlete.id === athleteId);

    if (!athlete) {
      setAuthError('No encontramos la ficha del jugador seleccionado.');
      return;
    }

    setUser({
      email: athlete.email || `${athlete.memberNumber || athlete.id}@sportia.app`,
      name: getAthleteFullName(athlete),
    });
    setUserRole('Jugador');
    setSelectedPlayerId(athlete.id);
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
      playerPhone: newAthlete.playerPhone.trim(),
      fatherPhone: newAthlete.fatherPhone.trim(),
      motherPhone: newAthlete.motherPhone.trim(),
      email: newAthlete.email.trim(),
      healthInsurance: newAthlete.healthInsurance.trim(),
      healthInsuranceNumber: newAthlete.healthInsuranceNumber.trim(),
      paymentMethod: newAthlete.paymentMethod.trim(),
      memberStatus: newAthlete.memberStatus,
      membershipType: newAthlete.membershipType.trim(),
      nextBillingDate: newAthlete.nextBillingDate.trim(),
      sport: trimmedSport,
      team: newAthlete.team.trim(),
      cohort: newAthlete.cohort.trim(),
      perfectAttendance30Days: newAthlete.perfectAttendance30Days,
      trainingsAttended: numberFromForm(newAthlete.trainingsAttended),
      trainingsTotal: numberFromForm(newAthlete.trainingsTotal),
      matchesAttended: numberFromForm(newAthlete.matchesAttended),
      matchesTotal: numberFromForm(newAthlete.matchesTotal),
      toursAttended: numberFromForm(newAthlete.toursAttended),
      toursTotal: numberFromForm(newAthlete.toursTotal),
      stayedAsGuest: newAthlete.stayedAsGuest,
      hostedGuest: newAthlete.hostedGuest,
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
      playerPhone: '',
      fatherPhone: '',
      motherPhone: '',
      email: '',
      healthInsurance: '',
      healthInsuranceNumber: '',
      paymentMethod: '',
      memberStatus: 'Activo',
      membershipType: '',
      nextBillingDate: '',
      sport: preferredSport,
      team: '',
      cohort: '',
      perfectAttendance30Days: false,
      trainingsAttended: '0',
      trainingsTotal: '0',
      matchesAttended: '0',
      matchesTotal: '0',
      toursAttended: '0',
      toursTotal: '0',
      stayedAsGuest: false,
      hostedGuest: false,
      status: 'Presente',
    });
    setSaveMessage(
      `${trimmedLastName.toUpperCase()} ${trimmedFirstName.toUpperCase()} fue cargado correctamente.`,
    );
  };

  const addImportedPlayers = (players: PlayerImportData[]) => {
    const baseId = Date.now();

    setAthleteList((currentAthletes) => [
      ...players.map((player, index) => athleteFromImportData(player, baseId + index)),
      ...currentAthletes,
    ]);
  };

  const clearPhotoSelection = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoPreviewUrl(null);
    setPhotoFile(null);

    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleSpreadsheetImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportLoading(true);
    setImportMessage(null);

    try {
      const { players, skipped } = await parseSpreadsheetFile(
        file,
        preferredSport,
        sportOptions,
      );

      if (players.length === 0) {
        setImportMessage(
          'No se encontraron filas válidas. Descargá la plantilla y completá apellido, nombre y DNI.',
        );
        return;
      }

      addImportedPlayers(players);
      setImportMessage(
        `Se importaron ${players.length} jugador(es).${
          skipped > 0 ? ` ${skipped} fila(s) se omitieron por datos incompletos.` : ''
        }`,
      );
      setSaveMessage(null);
    } catch {
      setImportMessage(
        'No se pudo leer la planilla. Verificá que sea Excel (.xlsx, .xls) o CSV compatible.',
      );
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setImportMessage(null);
  };

  const handlePhotoImport = async () => {
    if (!photoFile) {
      setImportMessage('Seleccioná una foto de la ficha antes de extraer los datos.');
      return;
    }

    setImportLoading(true);
    setImportProgress(0);
    setImportMessage(null);

    try {
      const extracted = await recognizePlayerFromImage(
        photoFile,
        preferredSport,
        setImportProgress,
      );

      if (
        !extracted.lastName.trim() ||
        !extracted.firstName.trim() ||
        !extracted.dni.trim()
      ) {
        setNewAthlete((current) => ({
          ...current,
          ...importDataToFormState(extracted, preferredSport),
        }));
        setImportMessage(
          'Extracción parcial desde la foto: revisá y completá los campos antes de guardar.',
        );
        return;
      }

      addImportedPlayers([extracted]);
      setImportMessage(
        `Jugador ${extracted.lastName.toUpperCase()} ${extracted.firstName.toUpperCase()} importado desde la foto.`,
      );
      clearPhotoSelection();
      setSaveMessage(null);
    } catch {
      setImportMessage(
        'No se pudo leer la foto. Usá buena luz, encuadre la ficha completa e intentá de nuevo.',
      );
    } finally {
      setImportLoading(false);
      setImportProgress(0);
    }
  };

  const exportAthletesToExcel = () => {
    const headers = [
      'Nro socio',
      'Apellido',
      'Nombre',
      'DNI',
      'Deporte',
      'Equipo',
      'Camada',
      'Asistencia',
      'Medalla asistencia perfecta 30 dias',
      'Entrenamientos asistidos',
      'Entrenamientos totales',
      'Partidos asistidos',
      'Partidos totales',
      'Giras asistidas',
      'Giras totales',
      'Se aloja',
      'Hospeda/recibe',
      'Puntaje ranking',
      'Activo',
      'Domicilio',
      'Fecha nacimiento',
      'Edad',
      'Celular jugador',
      'Celular padre',
      'Celular madre',
      'Email',
      'Obra social',
      'Numero obra social',
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
      athlete.team,
      athlete.cohort,
      athlete.status,
      athlete.perfectAttendance30Days ? 'Si' : 'No',
      athlete.trainingsAttended,
      athlete.trainingsTotal,
      athlete.matchesAttended,
      athlete.matchesTotal,
      athlete.toursAttended,
      athlete.toursTotal,
      athlete.stayedAsGuest ? 'Si' : 'No',
      athlete.hostedGuest ? 'Si' : 'No',
      calculateRankingScore(athlete),
      athlete.memberStatus,
      athlete.address,
      athlete.birthDate,
      athlete.age,
      athlete.playerPhone,
      athlete.fatherPhone,
      athlete.motherPhone,
      athlete.email,
      athlete.healthInsurance,
      athlete.healthInsuranceNumber,
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

  const updateAthlete = (athleteId: number, updates: Partial<Athlete>) => {
    setAthleteList((currentAthletes) =>
      currentAthletes.map((athlete) =>
        athlete.id === athleteId ? { ...athlete, ...updates } : athlete,
      ),
    );
  };

  const markAllAttendancePresent = () => {
    setAthleteList((currentAthletes) =>
      currentAthletes.map((athlete) => {
        if (attendanceActivity === 'Entrenamiento') {
          const trainingsTotal = Math.max(athlete.trainingsTotal, 1);

          return {
            ...athlete,
            status: 'Presente',
            trainingsTotal,
            trainingsAttended: trainingsTotal,
          };
        }

        const matchesTotal = Math.max(athlete.matchesTotal, 1);

        return {
          ...athlete,
          status: 'Presente',
          matchesTotal,
          matchesAttended: matchesTotal,
        };
      }),
    );
  };

  const updateActivityAttendance = (athlete: Athlete, status: AttendanceStatus) => {
    const isPresent = status === 'Presente';

    if (attendanceActivity === 'Entrenamiento') {
      const trainingsTotal = Math.max(athlete.trainingsTotal, 1);

      updateAthlete(athlete.id, {
        status,
        trainingsTotal,
        trainingsAttended: isPresent ? trainingsTotal : 0,
      });
      return;
    }

    const matchesTotal = Math.max(athlete.matchesTotal, 1);

    updateAthlete(athlete.id, {
      status,
      matchesTotal,
      matchesAttended: isPresent ? matchesTotal : 0,
    });
  };

  const updateTourAttendance = (athlete: Athlete, isPresent: boolean) => {
    const toursTotal = Math.max(athlete.toursTotal, 1);

    updateAthlete(athlete.id, {
      toursTotal,
      toursAttended: isPresent ? toursTotal : 0,
    });
  };

  const markAllToursPresent = () => {
    setAthleteList((currentAthletes) =>
      currentAthletes.map((athlete) => {
        const toursTotal = Math.max(athlete.toursTotal, 1);

        return {
          ...athlete,
          toursTotal,
          toursAttended: toursTotal,
        };
      }),
    );
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
        athletes={athleteList}
        googleClientIdConfigured={googleClientIdConfigured}
        onGoogleError={() => setAuthError('Google no pudo iniciar sesion. Intentalo otra vez.')}
        onLanguageChange={setSelectedLanguage}
        onPreferredSportChange={handlePreferredSportChange}
        onPlayerAccess={handlePlayerAccess}
        onStaffAccess={handleStaffAccess}
        preferredSport={preferredSport}
        selectedLanguage={selectedLanguage}
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
          {isPrivilegedUser ? <a href="#control-asistencia">Asistencia</a> : null}
          {isPrivilegedUser ? <a href="#carga-datos">Carga</a> : null}
          {userRole === 'Jugador' ? <a href="#mi-ficha">Mi ficha</a> : null}
          <a href="#ranking">Ranking</a>
          {isMasterUser ? <a href="#master-panel">Master</a> : null}
          {isPrivilegedUser ? <a href="#reportes">Reportes</a> : null}
          {isPrivilegedUser ? <a href="#equipos">Equipos</a> : null}
        </div>
        <div className="user-menu">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
          <SportPreferenceSelector
            selectedSport={preferredSport}
            onSportChange={handlePreferredSportChange}
          />
          {user.picture ? (
            <img className="user-avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="user-avatar fallback">{user.name.charAt(0)}</span>
          )}
          <div>
            <strong>{user.name}</strong>
            <span>{userRole}</span>
          </div>
          <button
            className="sign-out-button"
            type="button"
            onClick={() => {
              setUser(null);
              setUserRole('Jugador');
              setSelectedPlayerId(null);
            }}
          >
            Salir
          </button>
        </div>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Gestion deportiva multi-deporte</p>
          <h1>Controla asistencia, equipos y entrenamientos sin cobrarle a los usuarios.</h1>
          <p className="hero-description">
            Sportia es gratis para clubes, entrenadores, staff, jugadores y coordinación. La
            monetización queda en espacios de publicidad administrados por vos.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#ranking">
              Ver ranking
            </a>
            {isPrivilegedUser ? (
              <a className="secondary-button" href="#carga-datos">
                Cargar datos
              </a>
            ) : null}
            {isPrivilegedUser ? (
              <a className="secondary-button" href="#reportes">
                Ver reportes
              </a>
            ) : null}
          </div>
        </div>

        {isPrivilegedUser ? (
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
        ) : (
          <aside className="attendance-card public-access-card">
            <p className="eyebrow">Vista jugador</p>
            <h2>Ficha individual y ranking.</h2>
            <p>
              Entraste como jugador. Solo tenés acceso a tu ficha individual y al ranking público.
            </p>
            <a className="primary-button" href="#mi-ficha">
              Ver mi ficha
            </a>
            <a className="primary-button" href="#ranking">
              Ir al ranking
            </a>
          </aside>
        )}
      </section>

      <section className="free-access-banner" aria-label="Modelo gratis con publicidad">
        <div>
          <p className="eyebrow">Modelo gratuito</p>
          <h2>Clubes, entrenadores, staff, jugadores y coordinación no pagan.</h2>
          <p>Los ingresos se generan con espacios publicitarios propios dentro de Sportia.</p>
        </div>
        <span>Publicidad administrada por el dueño</span>
      </section>

      <AdSlot {...adSlots[0]} />

      {isPrivilegedUser ? (
        <section className="metrics-grid" aria-label="Metricas principales">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>
      ) : null}

      {isMasterUser ? (
        <section className="master-panel" id="master-panel" aria-labelledby="master-panel-title">
          <div className="section-heading">
            <p className="eyebrow">Master</p>
            <h2 id="master-panel-title">Panel de control global</h2>
            <p>
              El rol Master ve todo lo que hacen Staff, Coordinación y jugadores. Este panel reúne
              estadísticas, reportes de usuarios y espacios de publicidad.
            </p>
          </div>

          <div className="master-stats-grid">
            {masterStats.map((stat) => (
              <article key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>

          <div className="master-grid">
            <article className="master-card">
              <div className="section-heading compact">
                <p className="eyebrow">Usuarios</p>
                <h3>Reporte por tipo</h3>
              </div>
              <div className="user-report-list">
                <div>
                  <span>Clubes</span>
                  <strong>1</strong>
                  <small>Gratis</small>
                </div>
                <div>
                  <span>Entrenadores</span>
                  <strong>2</strong>
                  <small>Gratis</small>
                </div>
                <div>
                  <span>Staff</span>
                  <strong>2</strong>
                  <small>Gratis</small>
                </div>
                <div>
                  <span>Coordinación</span>
                  <strong>1</strong>
                  <small>Gratis</small>
                </div>
                <div>
                  <span>Jugadores</span>
                  <strong>{athleteList.length}</strong>
                  <small>Gratis</small>
                </div>
              </div>
            </article>

            <article className="master-card">
              <div className="section-heading compact">
                <p className="eyebrow">Publicidad</p>
                <h3>Inventario disponible</h3>
              </div>
              <div className="ad-management-list">
                {adSlots.map((slot) => (
                  <div key={slot.id}>
                    <strong>{slot.title}</strong>
                    <span>{slot.placement}</span>
                    <small>{slot.size}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="master-grid">
            <AdSlot {...adSlots[1]} />
            <article className="master-card">
              <div className="section-heading compact">
                <p className="eyebrow">Actividad</p>
                <h3>Últimos movimientos demo</h3>
              </div>
              <div className="activity-list">
                <span>Staff actualizó asistencia operativa.</span>
                <span>Coordinación revisó reportes por deporte.</span>
                <span>Jugador consultó ficha individual.</span>
                <span>Master visualizó estadísticas globales.</span>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {userRole === 'Jugador' && selectedPlayer ? (
        <section className="player-profile-panel" id="mi-ficha" aria-labelledby="player-profile-title">
          <div className="section-heading">
            <p className="eyebrow">Mi ficha</p>
            <h2 id="player-profile-title">{getAthleteFullName(selectedPlayer)}</h2>
            <p>Esta vista es individual: el jugador solo ve su propia ficha y el ranking público.</p>
          </div>

          <div className="player-profile-grid">
            <article>
              <span>Nro. socio</span>
              <strong>{selectedPlayer.memberNumber || '-'}</strong>
            </article>
            <article>
              <span>DNI</span>
              <strong>{selectedPlayer.dni}</strong>
            </article>
            <article>
              <span>Deporte</span>
              <strong>{selectedPlayer.sport}</strong>
            </article>
            <article>
              <span>Equipo</span>
              <strong>{selectedPlayer.team || '-'}</strong>
            </article>
            <article>
              <span>Camada</span>
              <strong>{selectedPlayer.cohort || '-'}</strong>
            </article>
            <article>
              <span>Edad</span>
              <strong>{selectedPlayer.age || '-'}</strong>
            </article>
            <article>
              <span>Asistencia</span>
              <strong>{selectedPlayer.status}</strong>
            </article>
            <article>
              <span>Ranking</span>
              <strong>{calculateRankingScore(selectedPlayer)} pts</strong>
            </article>
          </div>

          <div className="player-profile-note">
            {selectedPlayer.perfectAttendance30Days ? (
              <span className="medal-badge">🏅 Medalla por asistencia perfecta 30 días</span>
            ) : (
              <span className="muted-badge">Sin medalla de 30 días</span>
            )}
          </div>
        </section>
      ) : null}

      <section className="ranking-panel" id="ranking" aria-labelledby="ranking-title">
        <div className="section-heading">
          <p className="eyebrow">Ranking público</p>
          <h2 id="ranking-title">Ranking por asistencia y compromiso</h2>
          <p>
            Visible para todos los usuarios. Ordena jugadores que comparten camada, edad o equipo,
            sumando 10 pts por entrenamientos, 10 pts por partidos, 10 pts por viaje/gira,
            20 pts si se aloja y 20 pts si hospeda/recibe.
          </p>
        </div>

        <div className="report-filters" aria-label="Filtros de ranking">
          <label>
            Deporte
            <select value={rankingSport} onChange={(event) => setRankingSport(event.target.value)}>
              {[allSportsReportOption, ...sportOptions].map((sport) => (
                <option value={sport} key={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>

          <label>
            Comparar por
            <select
              value={rankingScope}
              onChange={(event) =>
                setRankingScope(event.target.value as (typeof rankingScopes)[number])
              }
            >
              {rankingScopes.map((scope) => (
                <option value={scope} key={scope}>
                  {scope}
                </option>
              ))}
            </select>
          </label>

          <label>
            Grupo
            <select value={normalizedRankingGroup} onChange={(event) => setRankingGroup(event.target.value)}>
              <option value="Todos">Todos</option>
              {rankingGroupOptions.map((group) => (
                <option value={group} key={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ranking-list">
          {rankedAthletes.map(({ athlete, score }, index) => (
            <article className="ranking-row" key={athlete.id}>
              <span className="ranking-position">#{index + 1}</span>
              <div>
                <strong>{getAthleteFullName(athlete)}</strong>
                <span>
                  {athlete.team || athlete.sport} · {athlete.cohort || `${athlete.age} años`}
                </span>
              </div>
              {athlete.perfectAttendance30Days ? (
                <span className="medal-badge">🏅 30 días</span>
              ) : (
                <span className="muted-badge">Sin medalla</span>
              )}
              <div className="ranking-breakdown">
                <span>Entr. {athlete.trainingsAttended}/{athlete.trainingsTotal}</span>
                <span>Part. {athlete.matchesAttended}/{athlete.matchesTotal}</span>
                <span>Viaje {athlete.toursAttended}/{athlete.toursTotal}</span>
                <span>{athlete.stayedAsGuest ? '+20 se aloja' : 'No se aloja'}</span>
                <span>{athlete.hostedGuest ? '+20 hospeda/recibe' : 'No hospeda'}</span>
              </div>
              <strong className="ranking-score">{score} pts</strong>
            </article>
          ))}
        </div>
      </section>

      {isPrivilegedUser ? (
        <>
      <section className="operations-panel" id="control-asistencia" aria-labelledby="attendance-control-title">
        <div className="section-heading">
          <p className="eyebrow">Asistencia operativa</p>
          <h2 id="attendance-control-title">Control de entrenamiento o partido</h2>
          <p>
            Todos los jugadores arrancan como presentes. El operador solo marca ausentes según
            corresponda al entrenamiento o al partido seleccionado.
          </p>
        </div>

        <div className="operation-toolbar">
          <label>
            Tipo de actividad
            <select
              value={attendanceActivity}
              onChange={(event) =>
                setAttendanceActivity(event.target.value as AttendanceActivity)
              }
            >
              <option value="Entrenamiento">Entrenamiento</option>
              <option value="Partido">Partido</option>
            </select>
          </label>
          <button className="export-button" type="button" onClick={markAllAttendancePresent}>
            Todos presentes
          </button>
        </div>

        <div className="attendance-control-list">
          {athleteList.map((athlete) => (
            <article className="attendance-control-row" key={`attendance-${athlete.id}`}>
              <div>
                <strong>{getAthleteFullName(athlete)}</strong>
                <span>
                  {attendanceActivity} · {athlete.team || athlete.sport}
                </span>
              </div>
              <div className="segmented-control" aria-label={`Asistencia de ${getAthleteFullName(athlete)}`}>
                <button
                  className={athlete.status === 'Presente' ? 'active' : ''}
                  type="button"
                  onClick={() => updateActivityAttendance(athlete, 'Presente')}
                >
                  Presente
                </button>
                <button
                  className={athlete.status === 'Ausente' ? 'danger active' : 'danger'}
                  type="button"
                  onClick={() => updateActivityAttendance(athlete, 'Ausente')}
                >
                  Ausente
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="operations-panel" id="control-giras" aria-labelledby="tour-control-title">
        <div className="section-heading">
          <p className="eyebrow">Giras</p>
          <h2 id="tour-control-title">Control de asistencia y hospedaje</h2>
          <p>
            En giras todos arrancan como presentes. Marcá ausentes y luego indicá quién se aloja
            y quién hospeda/recibe jugadores.
          </p>
        </div>

        <div className="operation-toolbar">
          <button className="export-button" type="button" onClick={markAllToursPresent}>
            Todos presentes en gira
          </button>
        </div>

        <div className="tour-control-list">
          {athleteList.map((athlete) => {
            const isTourPresent = athlete.toursTotal === 0 || athlete.toursAttended >= athlete.toursTotal;

            return (
              <article className="tour-control-row" key={`tour-${athlete.id}`}>
                <div>
                  <strong>{getAthleteFullName(athlete)}</strong>
                  <span>{athlete.cohort || athlete.team || athlete.sport}</span>
                </div>
                <div className="segmented-control" aria-label={`Gira de ${getAthleteFullName(athlete)}`}>
                  <button
                    className={isTourPresent ? 'active' : ''}
                    type="button"
                    onClick={() => updateTourAttendance(athlete, true)}
                  >
                    Presente
                  </button>
                  <button
                    className={!isTourPresent ? 'danger active' : 'danger'}
                    type="button"
                    onClick={() => updateTourAttendance(athlete, false)}
                  >
                    Ausente
                  </button>
                </div>
                <label className="inline-checkbox">
                  <input
                    type="checkbox"
                    checked={athlete.stayedAsGuest}
                    onChange={(event) =>
                      updateAthlete(athlete.id, { stayedAsGuest: event.target.checked })
                    }
                  />
                  Se aloja
                </label>
                <label className="inline-checkbox">
                  <input
                    type="checkbox"
                    checked={athlete.hostedGuest}
                    onChange={(event) =>
                      updateAthlete(athlete.id, { hostedGuest: event.target.checked })
                    }
                  />
                  Hospeda / recibe
                </label>
              </article>
            );
          })}
        </div>
      </section>

      <section className="data-entry-panel" id="carga-datos" aria-labelledby="data-entry-title">
        <div className="section-heading">
          <p className="eyebrow">Carga de datos</p>
          <h2 id="data-entry-title">Registrar ficha de jugadores</h2>
          <p>
            Carga apellido, nombre, DNI, obra social y datos de socio por separado, importá una
            planilla Excel o extraé datos desde una foto de la ficha.
          </p>
        </div>

        {canImportPlayers ? (
          <div className="import-panel" aria-labelledby="import-panel-title">
            <div className="section-heading compact">
              <h3 id="import-panel-title">Importar jugadores</h3>
              <p>
                Disponible para staff y coordinación: subí una planilla (.xlsx, .xls o CSV) o una
                foto de la ficha para completar los datos automáticamente.
              </p>
            </div>

            <div className="import-actions">
              <article className="import-card">
                <strong>Planilla Excel</strong>
                <p>Usá la misma estructura de columnas que la exportación de Sportia.</p>
                <div className="import-buttons">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={downloadPlayerImportTemplate}
                  >
                    Descargar plantilla
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={importLoading}
                    onClick={() => spreadsheetInputRef.current?.click()}
                  >
                    {importLoading ? 'Procesando...' : 'Subir planilla'}
                  </button>
                </div>
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  hidden
                  onChange={handleSpreadsheetImport}
                />
              </article>

              <article className="import-card">
                <strong>Foto de ficha</strong>
                <p>
                  Sacá o subí una foto del formulario impreso. El sistema lee el texto y completa
                  apellido, DNI, teléfonos y obra social cuando los detecta.
                </p>
                <div className="import-buttons">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={importLoading}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Elegir foto
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={importLoading || !photoFile}
                    onClick={handlePhotoImport}
                  >
                    {importLoading && photoFile
                      ? `Leyendo foto ${importProgress}%`
                      : 'Extraer datos de foto'}
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handlePhotoSelect}
                />
                {photoPreviewUrl ? (
                  <figure className="import-photo-preview">
                    <img src={photoPreviewUrl} alt="Vista previa de la ficha cargada" />
                    <figcaption>Vista previa de la ficha</figcaption>
                  </figure>
                ) : null}
              </article>
            </div>

            {importMessage ? <p className="import-message">{importMessage}</p> : null}
          </div>
        ) : null}

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
            Equipo
            <input
              type="text"
              value={newAthlete.team}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, team: event.target.value }))
              }
              placeholder="Ej: Rugby M8"
            />
          </label>

          <label>
            Camada
            <input
              type="text"
              value={newAthlete.cohort}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, cohort: event.target.value }))
              }
              placeholder="Ej: Camada 2018"
            />
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
              <option value="Ausente">Ausente</option>
            </select>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={newAthlete.perfectAttendance30Days}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  perfectAttendance30Days: event.target.checked,
                }))
              }
            />
            Medalla por asistencia perfecta 30 días
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
            Celular jugador
            <input
              type="text"
              value={newAthlete.playerPhone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, playerPhone: event.target.value }))
              }
              placeholder="Ej: 3874098343"
            />
          </label>

          <label>
            Celular padre
            <input
              type="text"
              value={newAthlete.fatherPhone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, fatherPhone: event.target.value }))
              }
              placeholder="Ej: 3875001001"
            />
          </label>

          <label>
            Celular madre
            <input
              type="text"
              value={newAthlete.motherPhone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, motherPhone: event.target.value }))
              }
              placeholder="Ej: 3875001002"
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
            Obra social
            <input
              type="text"
              value={newAthlete.healthInsurance}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, healthInsurance: event.target.value }))
              }
              placeholder="Ej: OSDE"
            />
          </label>

          <label>
            Número obra social
            <input
              type="text"
              value={newAthlete.healthInsuranceNumber}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  healthInsuranceNumber: event.target.value,
                }))
              }
              placeholder="Ej: 2-4613-08"
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

          <label>
            Entrenamientos asistidos
            <input
              type="number"
              min="0"
              value={newAthlete.trainingsAttended}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, trainingsAttended: event.target.value }))
              }
              placeholder="Ej: 12"
            />
          </label>

          <label>
            Entrenamientos totales
            <input
              type="number"
              min="0"
              value={newAthlete.trainingsTotal}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, trainingsTotal: event.target.value }))
              }
              placeholder="Ej: 12"
            />
          </label>

          <label>
            Partidos asistidos
            <input
              type="number"
              min="0"
              value={newAthlete.matchesAttended}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, matchesAttended: event.target.value }))
              }
              placeholder="Ej: 4"
            />
          </label>

          <label>
            Partidos totales
            <input
              type="number"
              min="0"
              value={newAthlete.matchesTotal}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, matchesTotal: event.target.value }))
              }
              placeholder="Ej: 4"
            />
          </label>

          <label>
            Giras asistidas
            <input
              type="number"
              min="0"
              value={newAthlete.toursAttended}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, toursAttended: event.target.value }))
              }
              placeholder="Ej: 1"
            />
          </label>

          <label>
            Giras totales
            <input
              type="number"
              min="0"
              value={newAthlete.toursTotal}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, toursTotal: event.target.value }))
              }
              placeholder="Ej: 1"
            />
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={newAthlete.stayedAsGuest}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, stayedAsGuest: event.target.checked }))
              }
            />
            Se hospeda en gira
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={newAthlete.hostedGuest}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, hostedGuest: event.target.checked }))
              }
            />
            Hospeda a otro jugador
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
            <span>Medalla 30 días</span>
            <span>Asistencia</span>
          </div>
          {athleteList.map((athlete) => (
            <article className="data-table-row" key={athlete.id}>
              <span>{athlete.memberNumber || '-'}</span>
              <strong>{getAthleteFullName(athlete)}</strong>
              <span>{athlete.dni}</span>
              <span>{athlete.sport}</span>
              <span className={athlete.perfectAttendance30Days ? 'medal-badge' : 'muted-badge'}>
                {athlete.perfectAttendance30Days ? '🏅 Perfecta' : 'Sin medalla'}
              </span>
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
          <article>
            <span>Medallas 30 días</span>
            <strong>{perfectAttendanceCount}</strong>
          </article>
        </div>

        <div className="medal-report-card" aria-label="Gráfico de medallas por asistencia perfecta">
          <div className="medal-graphic" aria-hidden="true">
            <span>★</span>
          </div>
          <div>
            <p className="eyebrow">Asistencia perfecta</p>
            <h3>{perfectAttendanceCount} jugadores con medalla</h3>
            <p>
              La medalla se asigna cuando el jugador completa 30 días sin ausencias en su ficha.
            </p>
          </div>
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

      <section className="content-grid single-panel-grid">
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
        </>
      ) : null}
      <AdSlot {...adSlots[2]} />
    </main>
  );
}

export default App;
