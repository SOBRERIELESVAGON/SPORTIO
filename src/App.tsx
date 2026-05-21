import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import {
  createTranslator,
  getAllSportsLabel,
  isLanguageCode,
  languageKey,
  languageOptions,
  translateActivity,
  translateAttendanceStatus,
  translateMemberStatus,
  translateRankingScope,
  translateReportPeriod,
  translateReportScope,
  translateRole,
  type LanguageCode,
  type Translator,
} from './i18n';
import { GoogleAd } from './GoogleAd';
import {
  googleAdsConfig,
  isGoogleAdPlacementConfigured,
  isGoogleAdsClientConfigured,
  type GoogleAdPlacement,
} from './googleAds';
import {
  downloadPlayerImportTemplate,
  parseSpreadsheetFile,
  recognizePlayerFromImage,
  type PlayerImportData,
} from './playerImport';
import {
  DEFAULT_ORGANIZATION_ID,
  assertSameOrganization,
  filterByOrganizationId,
  type OrganizationId,
} from './tenantAccess';

type AttendanceStatus = 'Presente' | 'Ausente';
type AttendanceActivity = 'Entrenamiento' | 'Partido';
type UserRole = 'Jugador' | 'Staff' | 'Coordinación' | 'Master';
type ProtectedRole = Exclude<UserRole, 'Jugador'>;
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
  organizationId: OrganizationId;
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
  organizationId: OrganizationId;
  picture?: string;
};

type AppProps = {
  googleClientIdConfigured: boolean;
  googleAdsConfigured: boolean;
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

const ALL_SPORTS_VALUE = '__all_sports__';
const rememberedRoleKey = 'sportia.rememberedRole';
const rememberedPasswordKey = 'sportia.rememberedPassword';
const preferredSportKey = 'sportia.preferredSport';
const organizationOptionsKey = 'sportia.organizations';
const preferredOrganizationKey = 'sportia.preferredOrganization';
const athleteListStorageKey = 'sportia.athletes';
const protectedRoles: ProtectedRole[] = ['Staff', 'Coordinación', 'Master'];
const rolePasswords: Record<ProtectedRole, string> = {
  Staff: 'staff2026',
  Coordinación: 'coord2026',
  Master: 'master2026',
};
const rankingScopes = ['Camada', 'Edad', 'Equipo'] as const;

const adSlots: {
  id: string;
  placement: GoogleAdPlacement;
  titleKey: 'ad.hero.title' | 'ad.sidebar.title' | 'ad.footer.title';
  placementKey: 'ad.hero.placement' | 'ad.sidebar.placement' | 'ad.footer.placement';
  size: string;
}[] = [
  {
    id: 'hero-ad',
    placement: 'hero',
    titleKey: 'ad.hero.title',
    placementKey: 'ad.hero.placement',
    size: '970 x 250',
  },
  {
    id: 'sidebar-ad',
    placement: 'sidebar',
    titleKey: 'ad.sidebar.title',
    placementKey: 'ad.sidebar.placement',
    size: '300 x 250',
  },
  {
    id: 'footer-ad',
    placement: 'footer',
    titleKey: 'ad.footer.title',
    placementKey: 'ad.footer.placement',
    size: '728 x 90',
  },
];
const advertisingWhatsAppNumber = '5493875313231';
const advertisingWhatsAppUrl = `https://wa.me/${advertisingWhatsAppNumber}`;

type OrganizationOption = {
  id: OrganizationId;
  name: string;
};

const defaultOrganizationOptions: OrganizationOption[] = [
  { id: DEFAULT_ORGANIZATION_ID, name: 'Sportia Demo Club' },
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

  if (sport === ALL_SPORTS_VALUE) {
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

function filterAthletesBySport(athletes: Athlete[], sport: string) {
  return sport === ALL_SPORTS_VALUE ? athletes : athletes.filter((athlete) => athlete.sport === sport);
}

function getDivisionFromTeam(team: string) {
  const trimmedTeam = team.trim();

  if (!trimmedTeam) {
    return '';
  }

  const subDivision = trimmedTeam.match(/Sub\s*\d+/i);

  if (subDivision) {
    return subDivision[0].replace(/\s+/g, ' ');
  }

  const youthDivision = trimmedTeam.match(/\bM\d+\b/i);

  if (youthDivision) {
    return youthDivision[0];
  }

  if (/primera/i.test(trimmedTeam)) {
    return 'Primera';
  }

  return trimmedTeam;
}

function getReportGroupOptions(
  athletes: Athlete[],
  scope: ReportScope,
  sport: string,
  labels: { wholeInstitution: string; noAthletes: string },
) {
  if (scope === 'Individual') {
    return athletes.length > 0
      ? athletes.map((athlete) => getAthleteFullName(athlete))
      : [labels.noAthletes];
  }

  if (scope === 'General') {
    if (sport === ALL_SPORTS_VALUE) {
      return [labels.wholeInstitution];
    }

    return sport ? [sport] : [labels.noAthletes];
  }

  if (scope === 'Equipo') {
    const teams = Array.from(new Set(athletes.map((athlete) => athlete.team).filter(Boolean))).sort();

    return teams.length > 0 ? teams : [labels.noAthletes];
  }

  if (scope === 'Camada') {
    const cohorts = Array.from(
      new Set(athletes.map((athlete) => athlete.cohort).filter(Boolean)),
    ).sort();

    return cohorts.length > 0 ? cohorts : [labels.noAthletes];
  }

  const divisions = Array.from(
    new Set(athletes.map((athlete) => getDivisionFromTeam(athlete.team)).filter(Boolean)),
  ).sort();

  return divisions.length > 0 ? divisions : [labels.noAthletes];
}

function filterAthletesForReportScope(
  athletes: Athlete[],
  scope: ReportScope,
  target: string,
  emptyTargetLabel: string,
) {
  if (target === emptyTargetLabel) {
    return [];
  }

  if (scope === 'General') {
    return athletes;
  }

  if (scope === 'Equipo') {
    return athletes.filter((athlete) => athlete.team === target);
  }

  if (scope === 'Camada') {
    return athletes.filter((athlete) => athlete.cohort === target);
  }

  if (scope === 'División') {
    return athletes.filter((athlete) => getDivisionFromTeam(athlete.team) === target);
  }

  return athletes.filter((athlete) => getAthleteFullName(athlete) === target);
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

function athleteFromImportData(
  data: PlayerImportData,
  id: number,
  organizationId: OrganizationId,
): Athlete {
  return {
    id,
    organizationId,
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

function readStoredOrganizations() {
  const storedOrganizations = readStoredValue(organizationOptionsKey);

  if (!storedOrganizations) {
    return defaultOrganizationOptions;
  }

  try {
    const parsedOrganizations = JSON.parse(storedOrganizations) as OrganizationOption[];
    const validOrganizations = parsedOrganizations.filter(
      (organization) => organization.id && organization.name.trim(),
    );

    return validOrganizations.length > 0 ? validOrganizations : defaultOrganizationOptions;
  } catch {
    return defaultOrganizationOptions;
  }
}

function writeStoredOrganizations(organizations: OrganizationOption[]) {
  writeStoredValue(organizationOptionsKey, JSON.stringify(organizations));
}

function createOrganizationId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `club-${slug || 'institucion'}-${Date.now()}`;
}

function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  t,
}: {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  t: Translator;
}) {
  return (
    <label className="language-selector">
      {t('common.language')}
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

function OrganizationSelector({
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
  onOrganizationCreate,
}: {
  organizations: OrganizationOption[];
  selectedOrganizationId: OrganizationId;
  onOrganizationChange: (organizationId: OrganizationId) => void;
  onOrganizationCreate: (organizationName: string) => void;
}) {
  const [newOrganizationName, setNewOrganizationName] = useState('');
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);

  const handleCreateOrganization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newOrganizationName.trim();

    if (!trimmedName) {
      return;
    }

    onOrganizationCreate(trimmedName);
    setNewOrganizationName('');
    setIsCreatingOrganization(false);
  };

  return (
    <div className="organization-selector">
      <label>
        Club / Institución
        <select
          value={selectedOrganizationId}
          onChange={(event) => onOrganizationChange(event.target.value)}
        >
          {organizations.map((organization) => (
            <option value={organization.id} key={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      {isCreatingOrganization ? (
        <form className="organization-create-form" onSubmit={handleCreateOrganization}>
          <input
            type="text"
            value={newOrganizationName}
            onChange={(event) => setNewOrganizationName(event.target.value)}
            placeholder="Nombre del club o institución"
            autoFocus
          />
          <button type="submit">Agregar</button>
        </form>
      ) : (
        <button
          className="organization-create-toggle"
          type="button"
          onClick={() => setIsCreatingOrganization(true)}
        >
          No está mi club / Cargar institución
        </button>
      )}
    </div>
  );
}

function SportPreferenceSelector({
  selectedSport,
  onSportChange,
  t,
}: {
  selectedSport: string;
  onSportChange: (sport: string) => void;
  t: Translator;
}) {
  return (
    <label className="sport-preference-selector">
      {t('common.fixedSport')}
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

function AdSlot({
  googlePlacement,
  title,
  placementLabel,
  size,
  t,
}: {
  googlePlacement: GoogleAdPlacement;
  title: string;
  placementLabel: string;
  size: string;
  t: Translator;
}) {
  const showsGoogleAd = isGoogleAdPlacementConfigured(googlePlacement);
  const showsPendingGoogle =
    isGoogleAdsClientConfigured() && !showsGoogleAd;

  return (
    <aside
      className={`ad-slot ${showsGoogleAd ? 'ad-slot-live' : ''}`}
      aria-label={title}
    >
      {showsGoogleAd ? (
        <>
          <span className="ad-slot-badge">{t('ad.googleLive')}</span>
          <GoogleAd placement={googlePlacement} />
          <small>{t('ad.googleServed', { size })}</small>
        </>
      ) : (
        <>
          <span>{t('ad.space')}</span>
          <strong>{title}</strong>
          <p>{placementLabel}</p>
          {showsPendingGoogle ? (
            <small>{t('ad.googlePending')}</small>
          ) : (
            <small className="ad-slot-contact">
              <span>{size}</span>
              <a
                className="ad-whatsapp-link"
                href={advertisingWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Consultar publicidad por WhatsApp al +54 9 387 531 3231"
              >
                <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
                  <path d="M16 3.2A12.7 12.7 0 0 0 5.1 22.4L3.6 28.8l6.5-1.7A12.8 12.8 0 1 0 16 3.2Zm0 22.9a10.1 10.1 0 0 1-5.2-1.4l-.4-.3-3.8 1 1-3.7-.2-.4A10.1 10.1 0 1 1 16 26.1Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6 0-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9 0 1.7 1.3 3.4 1.5 3.6.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4Z" />
                </svg>
                Consultar +54 9 387 531 3231
              </a>
            </small>
          )}
        </>
      )}
    </aside>
  );
}

const initialAthletes: Athlete[] = ([
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
    memberNumber: '4618',
    lastName: 'GIMENEZ',
    firstName: 'VALENTINA',
    dni: '53.118.904',
    address: 'España 1550, Salta',
    birthDate: '18/03/2011',
    age: '14',
    playerPhone: '3875558800',
    fatherPhone: '3875558801',
    motherPhone: '3875558802',
    email: 'valentina.gimenez@example.com',
    healthInsurance: 'Sancor Salud',
    healthInsuranceNumber: 'SS-53118904',
    paymentMethod: 'Transferencia',
    memberStatus: 'Activo',
    membershipType: 'Jugadora juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Fútbol',
    team: 'Fútbol Sub 14',
    cohort: 'Camada 2011',
    perfectAttendance30Days: false,
    trainingsAttended: 10,
    trainingsTotal: 12,
    matchesAttended: 2,
    matchesTotal: 4,
    toursAttended: 0,
    toursTotal: 1,
    stayedAsGuest: false,
    hostedGuest: false,
    status: 'Presente',
  },
  {
    id: 4,
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
    id: 5,
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
  {
    id: 6,
    memberNumber: '4617',
    lastName: 'FERRERO',
    firstName: 'TOMAS',
    dni: '55.102.441',
    address: 'Mitre 220, Salta',
    birthDate: '09/02/2009',
    age: '17',
    playerPhone: '3875559988',
    fatherPhone: '3875559900',
    motherPhone: '3875559901',
    email: 'tomas.ferrero@example.com',
    healthInsurance: 'OSDE',
    healthInsuranceNumber: 'OS-55102441',
    paymentMethod: 'Debito automatico',
    memberStatus: 'Activo',
    membershipType: 'Jugador juvenil',
    nextBillingDate: '30/04/2026',
    sport: 'Rugby',
    team: 'Rugby M17',
    cohort: 'Camada 2009',
    perfectAttendance30Days: true,
    trainingsAttended: 12,
    trainingsTotal: 12,
    matchesAttended: 5,
    matchesTotal: 5,
    toursAttended: 2,
    toursTotal: 2,
    stayedAsGuest: false,
    hostedGuest: true,
    status: 'Presente',
  },
] satisfies Omit<Athlete, 'organizationId'>[]).map((athlete) => ({
  ...athlete,
  organizationId: DEFAULT_ORGANIZATION_ID,
}));

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === 'Presente' || value === 'Ausente';
}

function isMemberStatus(value: unknown): value is Athlete['memberStatus'] {
  return value === 'Activo' || value === 'Inactivo';
}

function normalizeStoredAthlete(value: unknown): Athlete | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const athlete = value as Partial<Athlete>;

  if (
    typeof athlete.id !== 'number' ||
    typeof athlete.lastName !== 'string' ||
    typeof athlete.firstName !== 'string'
  ) {
    return null;
  }

  return {
    id: athlete.id,
    organizationId: athlete.organizationId ?? DEFAULT_ORGANIZATION_ID,
    memberNumber: athlete.memberNumber ?? '',
    lastName: athlete.lastName,
    firstName: athlete.firstName,
    dni: athlete.dni ?? '',
    address: athlete.address ?? '',
    birthDate: athlete.birthDate ?? '',
    age: athlete.age ?? '',
    playerPhone: athlete.playerPhone ?? '',
    fatherPhone: athlete.fatherPhone ?? '',
    motherPhone: athlete.motherPhone ?? '',
    email: athlete.email ?? '',
    healthInsurance: athlete.healthInsurance ?? '',
    healthInsuranceNumber: athlete.healthInsuranceNumber ?? '',
    paymentMethod: athlete.paymentMethod ?? '',
    memberStatus: isMemberStatus(athlete.memberStatus) ? athlete.memberStatus : 'Activo',
    membershipType: athlete.membershipType ?? '',
    nextBillingDate: athlete.nextBillingDate ?? '',
    sport: athlete.sport ?? sportOptions[0],
    team: athlete.team ?? '',
    cohort: athlete.cohort ?? '',
    perfectAttendance30Days: Boolean(athlete.perfectAttendance30Days),
    trainingsAttended: athlete.trainingsAttended ?? 0,
    trainingsTotal: athlete.trainingsTotal ?? 0,
    matchesAttended: athlete.matchesAttended ?? 0,
    matchesTotal: athlete.matchesTotal ?? 0,
    toursAttended: athlete.toursAttended ?? 0,
    toursTotal: athlete.toursTotal ?? 0,
    stayedAsGuest: Boolean(athlete.stayedAsGuest),
    hostedGuest: Boolean(athlete.hostedGuest),
    status: isAttendanceStatus(athlete.status) ? athlete.status : 'Presente',
  };
}

function readStoredAthletes(): Athlete[] {
  const storedAthletes = readStoredValue(athleteListStorageKey);

  if (!storedAthletes) {
    return initialAthletes;
  }

  try {
    const parsedAthletes = JSON.parse(storedAthletes) as unknown[];

    if (!Array.isArray(parsedAthletes)) {
      return initialAthletes;
    }

    return parsedAthletes
      .map((athlete) => normalizeStoredAthlete(athlete))
      .filter((athlete): athlete is Athlete => athlete !== null);
  } catch {
    return initialAthletes;
  }
}

function writeStoredAthletes(athletes: Athlete[]) {
  writeStoredValue(athleteListStorageKey, JSON.stringify(athletes));
}

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
    organizationId: DEFAULT_ORGANIZATION_ID,
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
  onOrganizationChange,
  onOrganizationCreate,
  onPreferredSportChange,
  organizations,
  preferredSport,
  selectedOrganizationId,
  selectedLanguage,
  t,
}: {
  error: string | null;
  athletes: Athlete[];
  googleClientIdConfigured: boolean;
  onPlayerAccess: (athleteId: number) => void;
  onStaffAccess: (role: ProtectedRole, password: string, rememberPassword: boolean) => void;
  onGoogleError: () => void;
  onLanguageChange: (language: LanguageCode) => void;
  onOrganizationChange: (organizationId: OrganizationId) => void;
  onOrganizationCreate: (organizationName: string) => void;
  onPreferredSportChange: (sport: string) => void;
  organizations: OrganizationOption[];
  preferredSport: string;
  selectedOrganizationId: OrganizationId;
  selectedLanguage: LanguageCode;
  t: Translator;
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
  const activeAthleteId = athletes.some((athlete) => athlete.id === selectedAthleteId)
    ? selectedAthleteId
    : (athletes[0]?.id ?? 0);

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
        <a className="brand brand-login" href="#inicio" aria-label={t('common.brandHome')}>
          <span className="brand-mark">S</span>
          <span>{t('common.brandName')}</span>
        </a>
        <p className="login-hero-tagline">{t('login.heroTagline')}</p>
        <p className="login-hero-tagline-en">
          Free sports attendance tracking app available in multiple languages.
        </p>
      </section>

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-language-row">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            t={t}
          />
          <OrganizationSelector
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onOrganizationChange={onOrganizationChange}
            onOrganizationCreate={onOrganizationCreate}
          />
          <SportPreferenceSelector
            selectedSport={preferredSport}
            onSportChange={onPreferredSportChange}
            t={t}
          />
        </div>

        <div>
          <p className="eyebrow">Login</p>
          <h2 id="login-title">{t('login.title')}</h2>
          <p>
            {t('login.demoKeys', {
              staffKey: 'staff2026',
              coordKey: 'coord2026',
              masterKey: 'master2026',
            })}
          </p>
        </div>

        <form className="access-form" onSubmit={handleStaffSubmit}>
          <label>
            {t('login.roleWithPassword')}
            <select
              value={staffRole}
              onChange={(event) => setStaffRole(event.target.value as ProtectedRole)}
            >
              {protectedRoles.map((role) => (
                <option value={role} key={role}>
                  {translateRole(selectedLanguage, role)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('login.password')}
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={staffPassword}
                onChange={(event) => setStaffPassword(event.target.value)}
                placeholder={t('login.passwordPlaceholder')}
              />
              <button
                type="button"
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
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
            {t('login.rememberPassword')}
          </label>

          <button className="demo-button" type="submit">
            {t('login.enterAs', { role: translateRole(selectedLanguage, staffRole) })}
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
            <strong>{t('login.googleNotConfigured')}</strong>
            <span>{t('login.googleNotConfiguredHint')}</span>
          </div>
        )}

        {googleIdentity ? (
          <p className="save-message">{t('login.googleValidated', { email: googleIdentity })}</p>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="player-access-card">
          <div>
            <p className="eyebrow">{t('login.player')}</p>
            <h3>{t('login.playerNoPassword')}</h3>
            <p>{t('login.playerDesc')}</p>
          </div>
          <label>
            {t('login.playerLabel')}
            <select
              value={activeAthleteId}
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
            onClick={() => onPlayerAccess(activeAthleteId)}
          >
            {t('login.enterAsPlayer')}
          </button>
        </div>
      </section>
    </main>
  );
}

function App({ googleClientIdConfigured, googleAdsConfigured }: AppProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>(() =>
    readStoredOrganizations(),
  );
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<OrganizationId>(() => {
    const storedOrganizationId = readStoredValue(preferredOrganizationKey);
    const storedOrganizations = readStoredOrganizations();

    return storedOrganizations.some((organization) => organization.id === storedOrganizationId)
      ? (storedOrganizationId as OrganizationId)
      : DEFAULT_ORGANIZATION_ID;
  });
  const currentOrganizationId = user?.organizationId ?? selectedOrganizationId;
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => {
    const storedLanguage = readStoredValue(languageKey);

    return isLanguageCode(storedLanguage) ? storedLanguage : 'es';
  });
  const t = useMemo(() => createTranslator(selectedLanguage), [selectedLanguage]);

  useEffect(() => {
    document.documentElement.lang = selectedLanguage;
  }, [selectedLanguage]);

  const handleLanguageChange = (language: LanguageCode) => {
    setSelectedLanguage(language);
    writeStoredValue(languageKey, language);
  };

  const handleOrganizationChange = (organizationId: OrganizationId) => {
    setSelectedOrganizationId(organizationId);
    writeStoredValue(preferredOrganizationKey, organizationId);
    setUser((currentUser) =>
      currentUser ? { ...currentUser, organizationId } : currentUser,
    );
    setSelectedPlayerId(null);
    setSelectedDeleteIds([]);
    setAthleteUndoStack([]);
  };

  const handleOrganizationCreate = (organizationName: string) => {
    const trimmedName = organizationName.trim();

    if (!trimmedName) {
      return;
    }

    const organization: OrganizationOption = {
      id: createOrganizationId(trimmedName),
      name: trimmedName,
    };
    const nextOrganizations = [...organizations, organization];

    setOrganizations(nextOrganizations);
    writeStoredOrganizations(nextOrganizations);
    handleOrganizationChange(organization.id);
  };

  const [preferredSport, setPreferredSport] = useState(() => {
    const storedSport = readStoredValue(preferredSportKey);

    return storedSport && sportOptions.includes(storedSport) ? storedSport : sportOptions[0];
  });
  const [userRole, setUserRole] = useState<UserRole>('Jugador');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [athleteList, setAthleteList] = useState<Athlete[]>(() => readStoredAthletes());
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
  const playersTableRef = useRef<HTMLDivElement>(null);
  const [spreadsheetFileName, setSpreadsheetFileName] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle',
  );
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<number[]>([]);
  const [athleteUndoStack, setAthleteUndoStack] = useState<Athlete[][]>([]);
  const [attendanceActivity, setAttendanceActivity] =
    useState<AttendanceActivity>('Entrenamiento');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('Semanal');
  const [reportSport, setReportSport] = useState(preferredSport);
  const [reportScope, setReportScope] = useState<ReportScope>('General');
  const [reportTarget, setReportTarget] = useState(() =>
    getReportGroupOptions(
      filterByOrganizationId(athleteList, currentOrganizationId),
      'General',
      preferredSport,
      {
        wholeInstitution: 'Toda la institución',
        noAthletes: 'Sin deportistas cargados',
      },
    )[0],
  );
  useEffect(() => {
    writeStoredAthletes(athleteList);
  }, [athleteList]);
  const tenantAthleteList = useMemo(
    () => filterByOrganizationId(athleteList, currentOrganizationId),
    [athleteList, currentOrganizationId],
  );
  const athletesForView = useMemo(
    () => tenantAthleteList.filter((athlete) => athlete.sport === preferredSport),
    [tenantAthleteList, preferredSport],
  );
  const presentCount = athletesForView.filter((athlete) => athlete.status === 'Presente').length;
  const absentAthletesForQuickList = useMemo(
    () => athletesForView.filter((athlete) => athlete.status === 'Ausente'),
    [athletesForView],
  );
  const isPrivilegedUser = userRole === 'Staff' || userRole === 'Coordinación' || userRole === 'Master';
  const canImportPlayers =
    userRole === 'Staff' || userRole === 'Coordinación' || userRole === 'Master';
  const isMasterUser = userRole === 'Master';
  const selectedPlayer =
    tenantAthleteList.find((athlete) => athlete.id === selectedPlayerId) ?? null;
  const attendancePercentage =
    athletesForView.length > 0
      ? Math.round((presentCount / athletesForView.length) * 100)
      : 0;
  const reportLabels = useMemo(
    () => ({
      wholeInstitution: t('report.wholeInstitution'),
      noAthletes: t('report.noAthletes'),
    }),
    [t],
  );
  const athletesForReportSport = useMemo(
    () => filterAthletesBySport(tenantAthleteList, reportSport),
    [tenantAthleteList, reportSport],
  );
  const reportTargetOptions = useMemo(
    () => getReportGroupOptions(athletesForReportSport, reportScope, reportSport, reportLabels),
    [athletesForReportSport, reportScope, reportSport, reportLabels],
  );
  const normalizedReportTarget = reportTargetOptions.includes(reportTarget)
    ? reportTarget
    : reportTargetOptions[0];
  const reportScopedAthletes = useMemo(
    () =>
      filterAthletesForReportScope(
        athletesForReportSport,
        reportScope,
        normalizedReportTarget,
        reportLabels.noAthletes,
      ),
    [athletesForReportSport, reportScope, normalizedReportTarget, reportLabels.noAthletes],
  );
  const scopedPerfectAttendanceCount = reportScopedAthletes.filter(
    (athlete) => athlete.perfectAttendance30Days,
  ).length;
  const reportSeries = buildSportReportSeries(reportPeriod, reportSport);
  const reportAverage = Math.round(
    reportSeries.reduce((total, item) => total + item.attendance, 0) / reportSeries.length,
  );
  const reportPeak = reportSeries.reduce((best, item) =>
    item.attendance > best.attendance ? item : best,
  );
  const [rankingSport, setRankingSport] = useState(preferredSport);
  const [rankingScope, setRankingScope] = useState<(typeof rankingScopes)[number]>('Camada');
  const rankingCandidates = useMemo(
    () => filterAthletesBySport(tenantAthleteList, rankingSport),
    [tenantAthleteList, rankingSport],
  );
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
    { label: t('metrics.loadedAthletes'), value: String(athletesForView.length) },
    { label: t('metrics.todayAttendance'), value: `${attendancePercentage}%` },
    {
      label: t('metrics.medals30'),
      value: String(
        athletesForView.filter((athlete) => athlete.perfectAttendance30Days).length,
      ),
    },
  ];
  const activePlayersCount = athletesForView.filter(
    (athlete) => athlete.memberStatus === 'Activo',
  ).length;
  const totalTeamsCount = new Set(
    athletesForView.map((athlete) => athlete.team).filter(Boolean),
  ).size;
  const totalCohortsCount = new Set(
    athletesForView.map((athlete) => athlete.cohort).filter(Boolean),
  ).size;
  const averageRankingScore =
    athletesForView.length > 0
      ? Math.round(
          athletesForView.reduce((total, athlete) => total + calculateRankingScore(athlete), 0) /
            athletesForView.length,
        )
      : 0;
  const masterStats = [
    { label: t('master.stat.totalPlayers'), value: String(athletesForView.length) },
    { label: t('master.stat.activePlayers'), value: String(activePlayersCount) },
    { label: t('master.stat.teams'), value: String(totalTeamsCount) },
    { label: t('master.stat.cohorts'), value: String(totalCohortsCount) },
    { label: t('master.stat.staffDemo'), value: '2' },
    { label: t('master.stat.coordDemo'), value: '1' },
    { label: t('master.stat.clubsDemo'), value: '1' },
    { label: t('master.stat.avgRanking'), value: `${averageRankingScore} ${t('common.pts')}` },
  ];

  const handleStaffAccess = (role: ProtectedRole, password: string, rememberPassword: boolean) => {
    if (rolePasswords[role] !== password) {
      setAuthError(t('auth.wrongPassword'));
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
      organizationId: currentOrganizationId,
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

    const athletesInSport = filterAthletesBySport(tenantAthleteList, sport);
    const nextTargetOptions = getReportGroupOptions(
      athletesInSport,
      reportScope,
      sport,
      reportLabels,
    );

    setReportTarget(nextTargetOptions[0]);
  };

  const handlePlayerAccess = (athleteId: number) => {
    const athlete = tenantAthleteList.find((currentAthlete) => currentAthlete.id === athleteId);

    if (!athlete) {
      setAuthError(t('auth.playerNotFound'));
      return;
    }

    setUser({
      email: athlete.email || `${athlete.memberNumber || athlete.id}@sportia.app`,
      name: getAthleteFullName(athlete),
      organizationId: athlete.organizationId,
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
      setSaveMessage(t('message.saveRequired'));
      return;
    }

    const athlete: Athlete = {
      id: Date.now(),
      organizationId: currentOrganizationId,
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
      t('message.saveSuccess', {
        lastName: trimmedLastName.toUpperCase(),
        firstName: trimmedFirstName.toUpperCase(),
      }),
    );
  };

  const addImportedPlayers = (players: PlayerImportData[]) => {
    const baseId = Date.now();

    setAthleteList((currentAthletes) => [
      ...players.map((player, index) =>
        athleteFromImportData(player, baseId + index, currentOrganizationId),
      ),
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

  const scrollToPlayersTable = () => {
    window.setTimeout(() => {
      playersTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSpreadsheetImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSpreadsheetFileName(file.name);
    setImportLoading(true);
    setImportStatus('processing');
    setImportMessage(t('import.fileReceived', { name: file.name }));
    setSaveMessage(null);

    try {
      const { players, skipped, missingRequiredColumns } = await parseSpreadsheetFile(
        file,
        preferredSport,
        sportOptions,
      );

      if (missingRequiredColumns) {
        setImportStatus('error');
        setImportMessage(t('import.missingColumns'));
        return;
      }

      if (players.length === 0) {
        setImportStatus('error');
        setImportMessage(t('import.noValidRows'));
        return;
      }

      addImportedPlayers(players);

      const successText =
        t('import.success', { count: players.length, name: file.name }) +
        (skipped > 0 ? t('import.skipped', { count: skipped }) : '');

      setImportStatus('success');
      setImportMessage(successText);
      setSaveMessage(successText);
      scrollToPlayersTable();
    } catch {
      setImportStatus('error');
      setImportMessage(t('import.fileError'));
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
      setImportMessage(t('import.selectPhoto'));
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
        setImportMessage(t('import.partial'));
        return;
      }

      addImportedPlayers([extracted]);
      setImportMessage(
        t('import.fromPhoto', {
          name: `${extracted.lastName.toUpperCase()} ${extracted.firstName.toUpperCase()}`,
        }),
      );
      clearPhotoSelection();
      setSaveMessage(null);
    } catch {
      setImportMessage(t('import.photoError'));
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
    const rows = athletesForView.map((athlete) => [
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
    link.download = 'jugadores-sportia-list.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateAthlete = (athleteId: number, updates: Partial<Athlete>) => {
    setAthleteList((currentAthletes) =>
      currentAthletes.map((athlete) =>
        athlete.id === athleteId && athlete.organizationId === currentOrganizationId
          ? { ...athlete, ...updates, organizationId: currentOrganizationId }
          : athlete,
      ),
    );
  };

  const visibleSelectedDeleteIds = selectedDeleteIds.filter((id) =>
    athletesForView.some((athlete) => athlete.id === id),
  );
  const allVisibleSelected =
    athletesForView.length > 0 &&
    athletesForView.every((athlete) => selectedDeleteIds.includes(athlete.id));

  const removeAthletes = (ids: number[]) => {
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length === 0) {
      return;
    }

    const removedAthletes = tenantAthleteList.filter((athlete) => uniqueIds.includes(athlete.id));

    if (removedAthletes.length === 0) {
      return;
    }

    setAthleteUndoStack((currentStack) => [...currentStack.slice(-19), removedAthletes]);
    setAthleteList((currentAthletes) =>
      currentAthletes.filter(
        (athlete) =>
          athlete.organizationId !== currentOrganizationId || !uniqueIds.includes(athlete.id),
      ),
    );
    setSelectedDeleteIds((currentIds) => currentIds.filter((id) => !uniqueIds.includes(id)));

    if (selectedPlayerId && uniqueIds.includes(selectedPlayerId)) {
      setSelectedPlayerId(null);
    }

    setSaveMessage(t('table.deletedCount', { count: removedAthletes.length }));
  };

  const togglePlayerSelection = (athleteId: number, checked: boolean) => {
    setSelectedDeleteIds((currentIds) =>
      checked
        ? currentIds.includes(athleteId)
          ? currentIds
          : [...currentIds, athleteId]
        : currentIds.filter((id) => id !== athleteId),
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = athletesForView.map((athlete) => athlete.id);

    if (allVisibleSelected) {
      setSelectedDeleteIds((currentIds) =>
        currentIds.filter((id) => !visibleIds.includes(id)),
      );
      return;
    }

    setSelectedDeleteIds((currentIds) => Array.from(new Set([...currentIds, ...visibleIds])));
  };

  const handleDeleteSelectedPlayers = () => {
    if (visibleSelectedDeleteIds.length === 0) {
      return;
    }

    if (!window.confirm(t('table.confirmDelete', { count: visibleSelectedDeleteIds.length }))) {
      return;
    }

    removeAthletes(visibleSelectedDeleteIds);
  };

  const handleDeleteAllVisiblePlayers = () => {
    const visibleIds = athletesForView.map((athlete) => athlete.id);

    if (visibleIds.length === 0) {
      return;
    }

    if (!window.confirm(t('table.confirmDeleteAll', { count: visibleIds.length }))) {
      return;
    }

    removeAthletes(visibleIds);
  };

  const handleDeletePlayer = (athleteId: number) => {
    removeAthletes([athleteId]);
  };

  const undoLastPlayerDeletion = () => {
    if (athleteUndoStack.length === 0) {
      setSaveMessage(t('table.nothingToUndo'));
      return;
    }

    const lastBatch = athleteUndoStack[athleteUndoStack.length - 1];
    const existingIds = new Set(tenantAthleteList.map((athlete) => athlete.id));
    const athletesToRestore = lastBatch.filter((athlete) => !existingIds.has(athlete.id));

    if (athletesToRestore.length > 0) {
      setAthleteList((currentAthletes) => [...athletesToRestore, ...currentAthletes]);
    }

    setAthleteUndoStack((currentStack) => currentStack.slice(0, -1));
    setSaveMessage(t('table.restoredCount', { count: athletesToRestore.length }));
  };

  const markAllAttendancePresent = () => {
    setAthleteList((currentAthletes) =>
      currentAthletes.map((athlete) => {
        if (athlete.organizationId !== currentOrganizationId || athlete.sport !== preferredSport) {
          return athlete;
        }

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
    assertSameOrganization(athlete, currentOrganizationId);
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
    assertSameOrganization(athlete, currentOrganizationId);
    const toursTotal = Math.max(athlete.toursTotal, 1);

    updateAthlete(athlete.id, {
      toursTotal,
      toursAttended: isPresent ? toursTotal : 0,
    });
  };

  const markAllToursPresent = () => {
    setAthleteList((currentAthletes) =>
      currentAthletes.map((athlete) => {
        if (athlete.organizationId !== currentOrganizationId || athlete.sport !== preferredSport) {
          return athlete;
        }

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
    const athletesInSport = filterAthletesBySport(tenantAthleteList, reportSport);
    const nextTargetOptions = getReportGroupOptions(
      athletesInSport,
      scope,
      reportSport,
      reportLabels,
    );

    setReportScope(scope);
    setReportTarget(nextTargetOptions[0]);
  };

  const handleReportSportChange = (sport: string) => {
    const athletesInSport = filterAthletesBySport(tenantAthleteList, sport);
    const nextTargetOptions = getReportGroupOptions(
      athletesInSport,
      reportScope,
      sport,
      reportLabels,
    );

    setReportSport(sport);
    setReportTarget(nextTargetOptions[0]);
  };

  if (!user) {
    return (
      <LoginScreen
        error={authError}
        athletes={athletesForView}
        googleClientIdConfigured={googleClientIdConfigured}
        onGoogleError={() => setAuthError(t('auth.googleError'))}
        onLanguageChange={handleLanguageChange}
        onOrganizationChange={handleOrganizationChange}
        onOrganizationCreate={handleOrganizationCreate}
        t={t}
        onPreferredSportChange={handlePreferredSportChange}
        onPlayerAccess={handlePlayerAccess}
        onStaffAccess={handleStaffAccess}
        organizations={organizations}
        preferredSport={preferredSport}
        selectedOrganizationId={currentOrganizationId}
        selectedLanguage={selectedLanguage}
      />
    );
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label={t('nav.main')}>
        <a className="brand" href="#inicio" aria-label={t('common.brandHome')}>
          <span className="brand-mark">S</span>
          <span>{t('common.brandName')}</span>
        </a>
        <div className="nav-links">
          {isPrivilegedUser ? <a href="#control-asistencia">{t('nav.attendance')}</a> : null}
          {isPrivilegedUser ? <a href="#carga-datos">{t('nav.dataEntry')}</a> : null}
          {userRole === 'Jugador' ? <a href="#mi-ficha">{t('nav.myProfile')}</a> : null}
          <a href="#ranking">{t('nav.ranking')}</a>
          {isMasterUser ? <a href="#master-panel">{t('nav.master')}</a> : null}
          {isPrivilegedUser ? <a href="#reportes">{t('nav.reports')}</a> : null}
          {isPrivilegedUser ? <a href="#equipos">{t('nav.teams')}</a> : null}
        </div>
        <div className="user-menu">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
            t={t}
          />
          <OrganizationSelector
            organizations={organizations}
            selectedOrganizationId={currentOrganizationId}
            onOrganizationChange={handleOrganizationChange}
            onOrganizationCreate={handleOrganizationCreate}
          />
          <SportPreferenceSelector
            selectedSport={preferredSport}
            onSportChange={handlePreferredSportChange}
            t={t}
          />
          {user.picture ? (
            <img className="user-avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="user-avatar fallback">{user.name.charAt(0)}</span>
          )}
          <div>
            <strong>{user.name}</strong>
            <span>{translateRole(selectedLanguage, userRole)}</span>
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
            {t('common.signOut')}
          </button>
        </div>
      </nav>

      <section className="order-ready-banner" aria-live="polite">
        <strong>Última orden lista</strong>
        <span>Latest request ready</span>
      </section>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1>{t('hero.title')}</h1>
          <p className="hero-description">
            {t('hero.description')}
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#ranking">
              {t('hero.viewRanking')}
            </a>
            {isPrivilegedUser ? (
              <a className="secondary-button" href="#carga-datos">
                {t('hero.loadData')}
              </a>
            ) : null}
            {isPrivilegedUser ? (
              <a className="secondary-button" href="#reportes">
                {t('hero.viewReports')}
              </a>
            ) : null}
          </div>
        </div>

        {isPrivilegedUser ? (
          <aside className="attendance-card" id="asistencia" aria-label={t('hero.attendanceSummary')}>
            <div className="card-header">
              <span>{t('hero.trainingToday')}</span>
              <strong>{presentCount}/{athletesForView.length}</strong>
            </div>
            <h2>{t('hero.quickList')}</h2>
            <div className="athlete-list">
              {absentAthletesForQuickList.length > 0 ? (
                absentAthletesForQuickList.slice(0, 5).map((athlete) => (
                  <article className="athlete-row" key={athlete.id}>
                    <div>
                      <strong>{getAthleteFullName(athlete)}</strong>
                      <span>{athlete.sport} · DNI {athlete.dni}</span>
                    </div>
                    <span className={`status status-${athlete.status.toLowerCase()}`}>
                      {translateAttendanceStatus(selectedLanguage, athlete.status)}
                    </span>
                  </article>
                ))
              ) : (
                <p className="athlete-list-empty">
                  {selectedLanguage === 'es' ? 'Sin ausentes.' : 'No absentees.'}
                </p>
              )}
            </div>
          </aside>
        ) : (
          <aside className="attendance-card public-access-card">
            <p className="eyebrow">{t('hero.playerView')}</p>
            <h2>{t('hero.playerCardTitle')}</h2>
            <p>
              {t('hero.playerCardDesc')}
            </p>
            <a className="primary-button" href="#mi-ficha">
              {t('hero.viewMyProfile')}
            </a>
            <a className="primary-button" href="#ranking">
              {t('hero.goToRanking')}
            </a>
          </aside>
        )}
      </section>

      <section className="free-access-banner" aria-label={t('banner.aria')}>
        <div>
          <p className="eyebrow">{t('banner.eyebrow')}</p>
          <h2>{t('banner.title')}</h2>
          <p>{t('banner.desc')}</p>
        </div>
      </section>

      <AdSlot
        googlePlacement={adSlots[0].placement}
        title={t(adSlots[0].titleKey)}
        placementLabel={t(adSlots[0].placementKey)}
        size={adSlots[0].size}
        t={t}
      />

      {isPrivilegedUser ? (
        <section className="metrics-grid" aria-label={t('metrics.aria')}>
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
            <p className="eyebrow">{t('master.eyebrow')}</p>
            <h2 id="master-panel-title">{t('master.title')}</h2>
            <p>
              {t('master.desc')}
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
                <p className="eyebrow">{t('master.users')}</p>
                <h3>{t('master.usersByType')}</h3>
              </div>
              <div className="user-report-list">
                <div>
                  <span>{t('master.clubs')}</span>
                  <strong>1</strong>
                  <small>{t('common.free')}</small>
                </div>
                <div>
                  <span>{t('master.coaches')}</span>
                  <strong>2</strong>
                  <small>{t('common.free')}</small>
                </div>
                <div>
                  <span>{t('role.staff')}</span>
                  <strong>2</strong>
                  <small>{t('common.free')}</small>
                </div>
                <div>
                  <span>{t('role.coordination')}</span>
                  <strong>1</strong>
                  <small>{t('common.free')}</small>
                </div>
                <div>
                  <span>{t('master.players')}</span>
                  <strong>{athletesForView.length}</strong>
                  <small>{t('common.free')}</small>
                </div>
              </div>
            </article>

            <article className="master-card">
              <div className="section-heading compact">
                <p className="eyebrow">{t('master.ads')}</p>
                <h3>{t('master.adInventory')}</h3>
              </div>
              <div className="ad-management-list">
                <div className="google-ads-status">
                  <strong>{t('master.googleAds.title')}</strong>
                  <span>
                    {googleAdsConfigured
                      ? t('master.googleAds.clientOk')
                      : t('master.googleAds.clientMissing')}
                  </span>
                  {googleAdsConfig.testMode ? (
                    <small>{t('master.googleAds.testMode')}</small>
                  ) : null}
                </div>
                {adSlots.map((slot) => (
                  <div key={slot.id}>
                    <strong>{t(slot.titleKey)}</strong>
                    <span>{t(slot.placementKey)}</span>
                    <small>
                      {isGoogleAdPlacementConfigured(slot.placement)
                        ? t('ad.googleLive')
                        : googleAdsConfigured
                          ? t('ad.googlePending')
                          : t('ad.googleNotConfigured')}{' '}
                      · {slot.size}
                    </small>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="master-grid">
            <AdSlot
              googlePlacement={adSlots[1].placement}
              title={t(adSlots[1].titleKey)}
              placementLabel={t(adSlots[1].placementKey)}
              size={adSlots[1].size}
              t={t}
            />
            <article className="master-card">
              <div className="section-heading compact">
                <p className="eyebrow">{t('master.activity')}</p>
                <h3>{t('master.recentDemo')}</h3>
              </div>
              <div className="activity-list">
                <span>{t('master.activity.staff')}</span>
                <span>{t('master.activity.coord')}</span>
                <span>{t('master.activity.player')}</span>
                <span>{t('master.activity.master')}</span>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {userRole === 'Jugador' && selectedPlayer ? (
        <section className="player-profile-panel" id="mi-ficha" aria-labelledby="player-profile-title">
          <div className="section-heading">
            <p className="eyebrow">{t('profile.eyebrow')}</p>
            <h2 id="player-profile-title">{getAthleteFullName(selectedPlayer)}</h2>
            <p>{t('profile.desc')}</p>
          </div>

          <div className="player-profile-grid">
            <article>
              <span>{t('profile.memberNumber')}</span>
              <strong>{selectedPlayer.memberNumber || '-'}</strong>
            </article>
            <article>
              <span>{t('profile.dni')}</span>
              <strong>{selectedPlayer.dni}</strong>
            </article>
            <article>
              <span>{t('profile.sport')}</span>
              <strong>{selectedPlayer.sport}</strong>
            </article>
            <article>
              <span>{t('profile.team')}</span>
              <strong>{selectedPlayer.team || '-'}</strong>
            </article>
            <article>
              <span>{t('profile.cohort')}</span>
              <strong>{selectedPlayer.cohort || '-'}</strong>
            </article>
            <article>
              <span>{t('profile.age')}</span>
              <strong>{selectedPlayer.age || '-'}</strong>
            </article>
            <article>
              <span>{t('profile.attendance')}</span>
              <strong>{translateAttendanceStatus(selectedLanguage, selectedPlayer.status)}</strong>
            </article>
            <article>
              <span>{t('profile.ranking')}</span>
              <strong>
                {calculateRankingScore(selectedPlayer)} {t('common.pts')}
              </strong>
            </article>
          </div>

          <div className="player-profile-note">
            {selectedPlayer.perfectAttendance30Days ? (
              <span className="medal-badge">🏅 {t('profile.medal30')}</span>
            ) : (
              <span className="muted-badge">{t('profile.noMedal30')}</span>
            )}
          </div>
        </section>
      ) : null}

      <section className="ranking-panel" id="ranking" aria-labelledby="ranking-title">
        <div className="section-heading">
          <p className="eyebrow">{t('ranking.eyebrow')}</p>
          <h2 id="ranking-title">{t('ranking.title')}</h2>
          <p>
            {t('ranking.desc')}
          </p>
        </div>

        <div className="report-filters" aria-label={t('ranking.filters')}>
          <label>
            {t('form.sport')}
            <select value={rankingSport} onChange={(event) => setRankingSport(event.target.value)}>
              {[ALL_SPORTS_VALUE, ...sportOptions].map((sport) => (
                <option value={sport} key={sport}>
                  {sport === ALL_SPORTS_VALUE ? getAllSportsLabel(selectedLanguage) : sport}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('ranking.compareBy')}
            <select
              value={rankingScope}
              onChange={(event) =>
                setRankingScope(event.target.value as (typeof rankingScopes)[number])
              }
            >
              {rankingScopes.map((scope) => (
                <option value={scope} key={scope}>
                  {translateRankingScope(selectedLanguage, scope)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('ranking.group')}
            <select value={normalizedRankingGroup} onChange={(event) => setRankingGroup(event.target.value)}>
              <option value="Todos">{t('common.all')}</option>
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
                  {athlete.team || athlete.sport} · {athlete.cohort || `${athlete.age} ${t('common.years')}`}
                </span>
              </div>
              {athlete.perfectAttendance30Days ? (
                <span className="medal-badge">🏅 {t('ranking.medal30')}</span>
              ) : (
                <span className="muted-badge">{t('ranking.noMedal')}</span>
              )}
              <div className="ranking-breakdown">
                <span>{t('ranking.breakdown.train')} {athlete.trainingsAttended}/{athlete.trainingsTotal}</span>
                <span>{t('ranking.breakdown.match')} {athlete.matchesAttended}/{athlete.matchesTotal}</span>
                <span>{t('ranking.breakdown.tour')} {athlete.toursAttended}/{athlete.toursTotal}</span>
                <span>{athlete.stayedAsGuest ? t('ranking.staysGuest') : t('ranking.noStaysGuest')}</span>
                <span>{athlete.hostedGuest ? t('ranking.hosts') : t('ranking.noHosts')}</span>
              </div>
              <strong className="ranking-score">{score} {t('common.pts')}</strong>
            </article>
          ))}
        </div>
      </section>

      {isPrivilegedUser ? (
        <>
      <section className="operations-panel" id="control-asistencia" aria-labelledby="attendance-control-title">
        <div className="section-heading">
          <p className="eyebrow">{t('ops.attendance.eyebrow')}</p>
          <h2 id="attendance-control-title">{t('ops.attendance.title')}</h2>
          <p>
            {t('ops.attendance.desc')}
          </p>
        </div>

        <div className="operation-toolbar">
          <label>
            {t('ops.attendance.activityType')}
            <select
              value={attendanceActivity}
              onChange={(event) =>
                setAttendanceActivity(event.target.value as AttendanceActivity)
              }
            >
              <option value="Entrenamiento">{translateActivity(selectedLanguage, 'Entrenamiento')}</option>
              <option value="Partido">{translateActivity(selectedLanguage, 'Partido')}</option>
            </select>
          </label>
          <button className="export-button" type="button" onClick={markAllAttendancePresent}>
            {t('ops.attendance.allPresent')}
          </button>
        </div>

        <div className="attendance-control-list">
          {athletesForView.map((athlete) => (
            <article className="attendance-control-row" key={`attendance-${athlete.id}`}>
              <div>
                <strong>{getAthleteFullName(athlete)}</strong>
                <span>
                  {translateActivity(selectedLanguage, attendanceActivity)} · {athlete.team || athlete.sport}
                </span>
              </div>
              <div className="segmented-control" aria-label={t('ranking.attendanceOf', { name: getAthleteFullName(athlete) })}>
                <button
                  className={athlete.status === 'Presente' ? 'active' : ''}
                  type="button"
                  onClick={() => updateActivityAttendance(athlete, 'Presente')}
                >
                  {translateAttendanceStatus(selectedLanguage, 'Presente')}
                </button>
                <button
                  className={athlete.status === 'Ausente' ? 'danger active' : 'danger'}
                  type="button"
                  onClick={() => updateActivityAttendance(athlete, 'Ausente')}
                >
                  {translateAttendanceStatus(selectedLanguage, 'Ausente')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="operations-panel" id="control-giras" aria-labelledby="tour-control-title">
        <div className="section-heading">
          <p className="eyebrow">{t('ops.tours.eyebrow')}</p>
          <h2 id="tour-control-title">{t('ops.tours.title')}</h2>
          <p>
            {t('ops.tours.desc')}
          </p>
        </div>

        <div className="operation-toolbar">
          <button className="export-button" type="button" onClick={markAllToursPresent}>
            {t('ops.tours.allPresent')}
          </button>
        </div>

        <div className="tour-control-list">
          {athletesForView.map((athlete) => {
            const isTourPresent = athlete.toursTotal === 0 || athlete.toursAttended >= athlete.toursTotal;

            return (
              <article className="tour-control-row" key={`tour-${athlete.id}`}>
                <div>
                  <strong>{getAthleteFullName(athlete)}</strong>
                  <span>{athlete.cohort || athlete.team || athlete.sport}</span>
                </div>
                <div className="segmented-control" aria-label={t('ranking.tourOf', { name: getAthleteFullName(athlete) })}>
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
                  {t('ops.staysGuest')}
                </label>
                <label className="inline-checkbox">
                  <input
                    type="checkbox"
                    checked={athlete.hostedGuest}
                    onChange={(event) =>
                      updateAthlete(athlete.id, { hostedGuest: event.target.checked })
                    }
                  />
                  {t('ops.hostsGuest')}
                </label>
              </article>
            );
          })}
        </div>
      </section>

      <section className="data-entry-panel" id="carga-datos" aria-labelledby="data-entry-title">
        <div className="section-heading">
          <p className="eyebrow">{t('data.eyebrow')}</p>
          <h2 id="data-entry-title">{t('data.title')}</h2>
          <p>
            {t('data.desc')}
          </p>
        </div>

        {canImportPlayers ? (
          <div className="import-panel" aria-labelledby="import-panel-title">
            <div className="section-heading compact">
              <h3 id="import-panel-title">{t('import.title')}</h3>
              <p>
                {t('import.desc')}
              </p>
            </div>

            <div className="import-actions">
              <article className="import-card">
                <strong>{t('import.excelTitle')}</strong>
                <p>{t('import.excelDesc')}</p>
                <div className="import-buttons">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={downloadPlayerImportTemplate}
                  >
                    {t('import.downloadTemplate')}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={importLoading}
                    onClick={() => spreadsheetInputRef.current?.click()}
                  >
                    {importLoading ? t('common.processing') : t('import.uploadSheet')}
                  </button>
                </div>
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  hidden
                  onChange={handleSpreadsheetImport}
                />
                {spreadsheetFileName ? (
                  <p className="import-file-name">
                    {importLoading
                      ? t('import.fileProcessing', { name: spreadsheetFileName })
                      : t('import.fileReady', { name: spreadsheetFileName })}
                  </p>
                ) : null}
              </article>

              <article className="import-card">
                <strong>{t('import.photoTitle')}</strong>
                <p>
                  {t('import.photoDesc')}
                </p>
                <div className="import-buttons">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={importLoading}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {t('import.choosePhoto')}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={importLoading || !photoFile}
                    onClick={handlePhotoImport}
                  >
                    {importLoading && photoFile
                      ? t('import.readingPhoto', { progress: importProgress })
                      : t('import.extractPhoto')}
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
                    <img src={photoPreviewUrl} alt={t('import.previewAlt')} />
                    <figcaption>{t('import.previewCaption')}</figcaption>
                  </figure>
                ) : null}
              </article>
            </div>

            {importMessage ? (
              <p
                className={`import-message ${
                  importStatus === 'success'
                    ? 'import-message-success'
                    : importStatus === 'error'
                      ? 'import-message-error'
                      : ''
                }`}
                role="status"
                aria-live="polite"
              >
                {importMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="manual-entry-heading">
          <p className="eyebrow">Carga manual</p>
          <h3>Agregar jugador manualmente</h3>
          <p>Usá este formulario cuando quieras cargar o corregir una ficha individual sin planilla.</p>
        </div>

        <form className="data-form data-form-expanded" onSubmit={handleAthleteSubmit}>
          <label>
            {t('form.memberNumber')}
            <input
              type="text"
              value={newAthlete.memberNumber}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, memberNumber: event.target.value }))
              }
              placeholder={t('form.placeholder.memberNumber')}
            />
          </label>

          <label>
            {t('form.lastName')}
            <input
              type="text"
              value={newAthlete.lastName}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, lastName: event.target.value }))
              }
              placeholder={t('form.placeholder.lastName')}
            />
          </label>

          <label>
            {t('form.firstName')}
            <input
              type="text"
              value={newAthlete.firstName}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, firstName: event.target.value }))
              }
              placeholder={t('form.placeholder.firstName')}
            />
          </label>

          <label>
            {t('form.dni')}
            <input
              type="text"
              value={newAthlete.dni}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, dni: event.target.value }))
              }
              placeholder={t('form.placeholder.dni')}
            />
          </label>

          <label>
            {t('form.sport')}
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
            {t('form.team')}
            <input
              type="text"
              value={newAthlete.team}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, team: event.target.value }))
              }
              placeholder={t('form.placeholder.team')}
            />
          </label>

          <label>
            {t('form.cohort')}
            <input
              type="text"
              value={newAthlete.cohort}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, cohort: event.target.value }))
              }
              placeholder={t('form.placeholder.cohort')}
            />
          </label>

          <label>
            {t('form.memberStatus')}
            <select
              value={newAthlete.memberStatus}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  memberStatus: event.target.value as Athlete['memberStatus'],
                }))
              }
            >
              <option value="Activo">{translateMemberStatus(selectedLanguage, 'Activo')}</option>
              <option value="Inactivo">{translateMemberStatus(selectedLanguage, 'Inactivo')}</option>
            </select>
          </label>

          <label>
            {t('form.attendance')}
            <select
              value={newAthlete.status}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  status: event.target.value as AttendanceStatus,
                }))
              }
            >
              <option value="Presente">{translateAttendanceStatus(selectedLanguage, 'Presente')}</option>
              <option value="Ausente">{translateAttendanceStatus(selectedLanguage, 'Ausente')}</option>
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
            {t('form.perfectAttendance')}
          </label>

          <label>
            {t('form.address')}
            <input
              type="text"
              value={newAthlete.address}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, address: event.target.value }))
              }
              placeholder={t('form.placeholder.address')}
            />
          </label>

          <label>
            {t('form.birthDate')}
            <input
              type="text"
              value={newAthlete.birthDate}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, birthDate: event.target.value }))
              }
              placeholder={t('form.placeholder.birthDate')}
            />
          </label>

          <label>
            {t('form.age')}
            <input
              type="text"
              value={newAthlete.age}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, age: event.target.value }))
              }
              placeholder={t('form.placeholder.age')}
            />
          </label>

          <label>
            {t('form.playerPhone')}
            <input
              type="text"
              value={newAthlete.playerPhone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, playerPhone: event.target.value }))
              }
              placeholder={t('form.placeholder.playerPhone')}
            />
          </label>

          <label>
            {t('form.fatherPhone')}
            <input
              type="text"
              value={newAthlete.fatherPhone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, fatherPhone: event.target.value }))
              }
              placeholder={t('form.placeholder.fatherPhone')}
            />
          </label>

          <label>
            {t('form.motherPhone')}
            <input
              type="text"
              value={newAthlete.motherPhone}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, motherPhone: event.target.value }))
              }
              placeholder={t('form.placeholder.motherPhone')}
            />
          </label>

          <label>
            {t('form.email')}
            <input
              type="email"
              value={newAthlete.email}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, email: event.target.value }))
              }
              placeholder={t('form.placeholder.email')}
            />
          </label>

          <label>
            {t('form.healthInsurance')}
            <input
              type="text"
              value={newAthlete.healthInsurance}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, healthInsurance: event.target.value }))
              }
              placeholder={t('form.placeholder.healthInsurance')}
            />
          </label>

          <label>
            {t('form.healthInsuranceNumber')}
            <input
              type="text"
              value={newAthlete.healthInsuranceNumber}
              onChange={(event) =>
                setNewAthlete((current) => ({
                  ...current,
                  healthInsuranceNumber: event.target.value,
                }))
              }
              placeholder={t('form.placeholder.healthInsuranceNumber')}
            />
          </label>

          <label>
            {t('form.paymentMethod')}
            <input
              type="text"
              value={newAthlete.paymentMethod}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, paymentMethod: event.target.value }))
              }
              placeholder={t('form.placeholder.paymentMethod')}
            />
          </label>

          <label>
            {t('form.membershipType')}
            <input
              type="text"
              value={newAthlete.membershipType}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, membershipType: event.target.value }))
              }
              placeholder={t('form.placeholder.membershipType')}
            />
          </label>

          <label>
            {t('form.nextBilling')}
            <input
              type="text"
              value={newAthlete.nextBillingDate}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, nextBillingDate: event.target.value }))
              }
              placeholder={t('form.placeholder.nextBilling')}
            />
          </label>

          <label>
            {t('form.trainingsAttended')}
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
            {t('form.trainingsTotal')}
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
            {t('form.matchesAttended')}
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
            {t('form.matchesTotal')}
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
            {t('form.toursAttended')}
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
            {t('form.toursTotal')}
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
            {t('form.staysGuest')}
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={newAthlete.hostedGuest}
              onChange={(event) =>
                setNewAthlete((current) => ({ ...current, hostedGuest: event.target.checked }))
              }
            />
            {t('form.hostsOther')}
          </label>

          <button className="primary-button form-button" type="submit">
            {t('form.save')}
          </button>
          <button className="export-button" type="button" onClick={exportAthletesToExcel}>
            {t('form.export')}
          </button>
        </form>

        {saveMessage ? <p className="save-message">{saveMessage}</p> : null}

        <div className="data-table-toolbar" aria-label={t('table.managePlayers')}>
          <label className="inline-checkbox data-table-select-all">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              disabled={athletesForView.length === 0}
            />
            {t('table.selectAll')}
          </label>
          <span className="data-table-selection-count">
            {t('table.selectedCount', { count: visibleSelectedDeleteIds.length })}
          </span>
          <button
            className="export-button danger-button"
            type="button"
            disabled={visibleSelectedDeleteIds.length === 0}
            onClick={handleDeleteSelectedPlayers}
          >
            {t('table.deleteSelected')}
          </button>
          <button
            className="export-button danger-button"
            type="button"
            disabled={athletesForView.length === 0}
            onClick={handleDeleteAllVisiblePlayers}
          >
            {t('table.deleteAllVisible')}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={athleteUndoStack.length === 0}
            onClick={undoLastPlayerDeletion}
          >
            {t('table.undoDelete')}
          </button>
        </div>

        <div
          className="data-table"
          id="jugadores-registrados"
          ref={playersTableRef}
          aria-label={t('table.loadedRecords')}
        >
          <div className="data-table-header">
            <span>{t('table.select')}</span>
            <span>{t('profile.memberNumber')}</span>
            <span>{t('table.player')}</span>
            <span>{t('profile.dni')}</span>
            <span>{t('profile.sport')}</span>
            <span>{t('table.medal30')}</span>
            <span>{t('profile.attendance')}</span>
            <span>{t('table.actions')}</span>
          </div>
          {athletesForView.map((athlete) => (
            <article className="data-table-row" key={athlete.id}>
              <label className="inline-checkbox data-table-row-checkbox">
                <input
                  type="checkbox"
                  checked={selectedDeleteIds.includes(athlete.id)}
                  onChange={(event) => togglePlayerSelection(athlete.id, event.target.checked)}
                  aria-label={t('table.selectPlayer', { name: getAthleteFullName(athlete) })}
                />
              </label>
              <span>{athlete.memberNumber || '-'}</span>
              <strong>{getAthleteFullName(athlete)}</strong>
              <span>{athlete.dni}</span>
              <span>{athlete.sport}</span>
              <span className={athlete.perfectAttendance30Days ? 'medal-badge' : 'muted-badge'}>
                {athlete.perfectAttendance30Days
                  ? `🏅 ${t('table.perfectMedal')}`
                  : t('table.noMedal')}
              </span>
              <span className={`status status-${athlete.status.toLowerCase()}`}>
                {translateAttendanceStatus(selectedLanguage, athlete.status)}
              </span>
              <button
                className="delete-player-button"
                type="button"
                onClick={() => handleDeletePlayer(athlete.id)}
                aria-label={t('table.deleteOne', { name: getAthleteFullName(athlete) })}
              >
                {t('table.delete')}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="report-panel" id="reportes" aria-labelledby="report-title">
        <div className="section-heading">
          <p className="eyebrow">{t('report.eyebrow')}</p>
          <h2 id="report-title">{t('report.title')}</h2>
          <p>
            {t('report.desc')}
          </p>
        </div>

        <div className="report-filters" aria-label={t('report.filters')}>
          <label>
            {t('report.period')}
            <select
              value={reportPeriod}
              onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
            >
              {reportPeriods.map((period) => (
                <option value={period} key={period}>
                  {translateReportPeriod(selectedLanguage, period)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('form.sport')}
            <select value={reportSport} onChange={(event) => handleReportSportChange(event.target.value)}>
              {[ALL_SPORTS_VALUE, ...sportOptions].map((sport) => (
                <option value={sport} key={sport}>
                  {sport === ALL_SPORTS_VALUE ? getAllSportsLabel(selectedLanguage) : sport}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('report.scope')}
            <select
              value={reportScope}
              onChange={(event) => handleReportScopeChange(event.target.value as ReportScope)}
            >
              {reportScopes.map((scope) => (
                <option value={scope} key={scope}>
                  {translateReportScope(selectedLanguage, scope)}
                </option>
              ))}
            </select>
          </label>

          <label>
            {reportScope === 'Individual' ? t('report.player') : translateReportScope(selectedLanguage, reportScope)}
            <select
              value={normalizedReportTarget}
              onChange={(event) => setReportTarget(event.target.value)}
            >
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
            <span>{t('report.summary.label')}</span>
            <strong>
              {translateReportPeriod(selectedLanguage, reportPeriod)} · {reportSport === ALL_SPORTS_VALUE ? getAllSportsLabel(selectedLanguage) : reportSport} · {normalizedReportTarget}
            </strong>
          </article>
          <article>
            <span>{t('report.summary.average')}</span>
            <strong>{reportAverage}%</strong>
          </article>
          <article>
            <span>{t('report.summary.peak')}</span>
            <strong>
              {t('report.summary.peakValue', { value: reportPeak.attendance, label: reportPeak.label })}
            </strong>
          </article>
          <article>
            <span>{t('report.summary.medals')}</span>
            <strong>{scopedPerfectAttendanceCount}</strong>
          </article>
        </div>

        <div className="medal-report-card" aria-label={t('report.medal.aria')}>
          <div className="medal-graphic" aria-hidden="true">
            <span>★</span>
          </div>
          <div>
            <p className="eyebrow">{t('report.medal.eyebrow')}</p>
            <h3>{t('report.medal.title', { count: scopedPerfectAttendanceCount })}</h3>
            <p>
              {t('report.medal.desc')}
            </p>
          </div>
        </div>

        <div
          className="chart-card"
          aria-label={t('report.chart.aria', { period: translateReportPeriod(selectedLanguage, reportPeriod), sport: reportSport === ALL_SPORTS_VALUE ? getAllSportsLabel(selectedLanguage) : reportSport })}
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

        <p className="report-note">{t('report.note')}</p>
      </section>

      <section className="content-grid single-panel-grid">
        <div className="panel accent-panel" id="equipos">
          <p className="eyebrow">{t('panel.eyebrow')}</p>
          <h2>{t('panel.title')}</h2>
          <p>
            {t('panel.desc')}
          </p>
          <a className="secondary-button light" href="#carga-datos">
            {t('panel.start')}
          </a>
        </div>
      </section>
        </>
      ) : null}
      <AdSlot
        googlePlacement={adSlots[2].placement}
        title={t(adSlots[2].titleKey)}
        placementLabel={t(adSlots[2].placementKey)}
        size={adSlots[2].size}
        t={t}
      />
    </main>
  );
}

export default App;
