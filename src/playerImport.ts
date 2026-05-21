import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';

export type PlayerImportData = {
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
  status: 'Presente' | 'Ausente';
};

export const PLAYER_IMPORT_HEADERS = [
  'Nro socio',
  'Apellido',
  'Nombre',
  'DNI',
  'Deporte',
  'Actividad',
  'Cat. Actividad',
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
] as const;

type ImportColumnField =
  | keyof PlayerImportData
  | 'activity'
  | 'activityCategory'
  | 'category'
  | 'fullNameLastFirst'
  | 'fullNameFirstLast';

const headerFieldMap: Record<string, ImportColumnField> = {
  'nro socio': 'memberNumber',
  'n socio': 'memberNumber',
  'num socio': 'memberNumber',
  'numero socio': 'memberNumber',
  socio: 'memberNumber',
  apellido: 'lastName',
  apellidos: 'lastName',
  nombre: 'firstName',
  nombres: 'firstName',
  'apellido nombre': 'fullNameLastFirst',
  'apellido y nombre': 'fullNameLastFirst',
  'apellidos y nombres': 'fullNameLastFirst',
  'nombre apellido': 'fullNameFirstLast',
  'nombre y apellido': 'fullNameFirstLast',
  'nombres y apellidos': 'fullNameFirstLast',
  jugador: 'fullNameLastFirst',
  deportista: 'fullNameLastFirst',
  dni: 'dni',
  documento: 'dni',
  'nro documento': 'dni',
  'numero documento': 'dni',
  deporte: 'sport',
  disciplina: 'sport',
  actividad: 'activity',
  'cat actividad': 'activityCategory',
  'cat. actividad': 'activityCategory',
  'categoria actividad': 'activityCategory',
  'categoria de actividad': 'activityCategory',
  'categoria/actividad': 'activityCategory',
  categoria: 'category',
  'categoria deportiva': 'category',
  cat: 'category',
  equipo: 'team',
  grupo: 'team',
  division: 'team',
  'división': 'team',
  camada: 'cohort',
  cohorte: 'cohort',
  asistencia: 'status',
  'medalla asistencia perfecta 30 dias': 'perfectAttendance30Days',
  'entrenamientos asistidos': 'trainingsAttended',
  'entrenamientos totales': 'trainingsTotal',
  'partidos asistidos': 'matchesAttended',
  'partidos totales': 'matchesTotal',
  'giras asistidas': 'toursAttended',
  'giras totales': 'toursTotal',
  'se aloja': 'stayedAsGuest',
  'hospeda/recibe': 'hostedGuest',
  activo: 'memberStatus',
  domicilio: 'address',
  direccion: 'address',
  'fecha nacimiento': 'birthDate',
  'fecha de nacimiento': 'birthDate',
  edad: 'age',
  'celular jugador': 'playerPhone',
  'telefono jugador': 'playerPhone',
  'celular padre': 'fatherPhone',
  'telefono padre': 'fatherPhone',
  'celular madre': 'motherPhone',
  'telefono madre': 'motherPhone',
  email: 'email',
  mail: 'email',
  'obra social': 'healthInsurance',
  'numero obra social': 'healthInsuranceNumber',
  'forma de pago': 'paymentMethod',
  'tipo socio': 'membershipType',
  'proximo cobro': 'nextBillingDate',
};

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function detectCsvDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? '';
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;

  return semicolons >= commas ? ';' : ',';
}

function readWorkbookFromFile(buffer: ArrayBuffer, fileName: string) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    const text = new TextDecoder('utf-8').decode(buffer);

    return XLSX.read(text, {
      type: 'string',
      FS: detectCsvDelimiter(text),
      raw: false,
    });
  }

  return XLSX.read(buffer, { type: 'array', cellDates: true });
}

function findHeaderRowIndex(rows: unknown[][]) {
  const limit = Math.min(rows.length, 15);

  for (let index = 0; index < limit; index += 1) {
    const headers = (rows[index] ?? []).map((cell) => cellToString(cell));

    if (hasRequiredImportColumns(headers)) {
      return index;
    }
  }

  return -1;
}

function cellToString(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('es-AR');
  }

  return String(value).trim();
}

function parseBoolean(value: string) {
  const normalized = value.toLowerCase().trim();

  return ['si', 'sí', 'yes', 'true', '1', 'x', 'verdadero'].includes(normalized);
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMemberStatus(value: string): PlayerImportData['memberStatus'] {
  return value.toLowerCase().includes('inactiv') ? 'Inactivo' : 'Activo';
}

function parseAttendanceStatus(value: string): PlayerImportData['status'] {
  return value.toLowerCase().includes('ausent') ? 'Ausente' : 'Presente';
}

function normalizedText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function findSportInText(value: string, sportOptions: string[]) {
  const normalizedValue = normalizedText(value);

  return sportOptions.find((sport) => normalizedValue.includes(normalizedText(sport)));
}

function normalizeSport(value: string, sportOptions: string[]) {
  const normalizedValue = normalizedText(value);

  return (
    sportOptions.find((sport) => normalizedText(sport) === normalizedValue) ??
    findSportInText(value, sportOptions) ??
    ''
  );
}

function splitFullName(value: string, order: 'lastFirst' | 'firstLast') {
  const normalizedValue = value.replace(/\s+/g, ' ').trim();

  if (!normalizedValue) {
    return { firstName: '', lastName: '' };
  }

  const commaParts = normalizedValue.split(',').map((part) => part.trim()).filter(Boolean);

  if (commaParts.length >= 2) {
    return { lastName: commaParts[0], firstName: commaParts.slice(1).join(' ') };
  }

  const parts = normalizedValue.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return order === 'lastFirst'
      ? { lastName: parts[0], firstName: '' }
      : { firstName: parts[0], lastName: '' };
  }

  if (order === 'firstLast') {
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts.at(-1) ?? '',
    };
  }

  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(' '),
  };
}

function emptyPlayerImportData(): PlayerImportData {
  return {
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
    sport: '',
    team: '',
    cohort: '',
    perfectAttendance30Days: false,
    trainingsAttended: 0,
    trainingsTotal: 0,
    matchesAttended: 0,
    matchesTotal: 0,
    toursAttended: 0,
    toursTotal: 0,
    stayedAsGuest: false,
    hostedGuest: false,
    status: 'Presente',
  };
}

function applyFieldValue(player: PlayerImportData, field: keyof PlayerImportData, rawValue: string) {
  if (!rawValue) {
    return;
  }

  switch (field) {
    case 'perfectAttendance30Days':
    case 'stayedAsGuest':
    case 'hostedGuest':
      player[field] = parseBoolean(rawValue);
      break;
    case 'trainingsAttended':
    case 'trainingsTotal':
    case 'matchesAttended':
    case 'matchesTotal':
    case 'toursAttended':
    case 'toursTotal':
      player[field] = parseNumber(rawValue);
      break;
    case 'memberStatus':
      player.memberStatus = parseMemberStatus(rawValue);
      break;
    case 'status':
      player.status = parseAttendanceStatus(rawValue);
      break;
    default:
      player[field] = rawValue;
  }
}

function applySpecialFieldValue(
  player: PlayerImportData,
  field: Exclude<ImportColumnField, keyof PlayerImportData>,
  rawValue: string,
  sportOptions: string[],
) {
  if (!rawValue) {
    return;
  }

  if (field === 'fullNameLastFirst' || field === 'fullNameFirstLast') {
    const name = splitFullName(rawValue, field === 'fullNameLastFirst' ? 'lastFirst' : 'firstLast');

    player.lastName ||= name.lastName;
    player.firstName ||= name.firstName;
    return;
  }

  if (field === 'activity') {
    const sport = normalizeSport(rawValue, sportOptions);
    player.sport ||= sport || rawValue;
    return;
  }

  if (field === 'category') {
    player.cohort ||= rawValue;
    player.team ||= player.sport ? `${player.sport} ${rawValue}` : rawValue;
    return;
  }

  const sport = findSportInText(rawValue, sportOptions);

  if (sport) {
    player.sport ||= sport;
  }

  player.team ||= rawValue;

  const cohortMatch =
    rawValue.match(/camada\s*\d{4}/i) ??
    rawValue.match(/\b(?:sub|u)\s*-?\s*\d{1,2}\b/i) ??
    rawValue.match(/\bm\s*\d{1,2}\b/i);

  if (cohortMatch) {
    player.cohort ||= cohortMatch[0].replace(/\s+/g, ' ');
  }
}

function rowToPlayerImportData(
  headers: string[],
  row: unknown[],
  defaultSport: string,
  sportOptions: string[],
): PlayerImportData | null {
  const player = emptyPlayerImportData();
  let hasMappedField = false;

  headers.forEach((header, index) => {
    const field = headerFieldMap[normalizeHeader(header)];

    if (!field) {
      return;
    }

    const rawValue = cellToString(row[index]);

    if (!rawValue) {
      return;
    }

    hasMappedField = true;

    if (field in player) {
      applyFieldValue(player, field as keyof PlayerImportData, rawValue);
      return;
    }

    applySpecialFieldValue(
      player,
      field as Exclude<ImportColumnField, keyof PlayerImportData>,
      rawValue,
      sportOptions,
    );
  });

  if (!hasMappedField) {
    return null;
  }

  const normalizedSport = normalizeSport(player.sport, sportOptions);

  if (normalizedSport) {
    player.sport = normalizedSport;
  }

  if (!player.sport || !sportOptions.includes(player.sport)) {
    player.sport = defaultSport;
  }

  if (!player.team && player.cohort) {
    player.team = `${player.sport} ${player.cohort}`.trim();
  }

  return player;
}

function isValidPlayerRow(player: PlayerImportData) {
  return Boolean(player.lastName.trim() && player.firstName.trim());
}

export function hasRequiredImportColumns(headers: string[]) {
  let hasLastName = false;
  let hasFirstName = false;
  let hasFullName = false;

  headers.forEach((header) => {
    const field = headerFieldMap[normalizeHeader(header)];

    if (field === 'lastName') {
      hasLastName = true;
    }

    if (field === 'firstName') {
      hasFirstName = true;
    }

    if (field === 'fullNameLastFirst' || field === 'fullNameFirstLast') {
      hasFullName = true;
    }
  });

  return (hasLastName && hasFirstName) || hasFullName;
}

export function downloadPlayerImportTemplate() {
  const exampleRow = [
    '4613',
    'Mendivil',
    'Benicio',
    '60910046',
    'Rugby',
    'Rugby',
    'Rugby M8',
    'Rugby M8',
    'Camada 2018',
    'Presente',
    'No',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    'No',
    'No',
    'Activo',
    'Av. Siempre Viva 742',
    '2018-05-12',
    '7',
    '3515551234',
    '3515555678',
    '3515559012',
    'benicio@ejemplo.com',
    'OSDE',
    '123456789',
    'Debito automatico',
    'Familiar',
    '2026-06-01',
  ];
  const csv = [PLAYER_IMPORT_HEADERS.join(';'), exampleRow.join(';')].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'plantilla-jugadores-sportia-list.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export type SpreadsheetImportResult = {
  players: PlayerImportData[];
  skipped: number;
  missingRequiredColumns: boolean;
};

export async function parseSpreadsheetFile(
  file: File,
  defaultSport: string,
  sportOptions: string[],
): Promise<SpreadsheetImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = readWorkbookFromFile(buffer, file.name);
  if (workbook.SheetNames.length === 0) {
    return { players: [], skipped: 0, missingRequiredColumns: false };
  }

  const players: PlayerImportData[] = [];
  let skipped = 0;
  let validSheetCount = 0;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (rows.length < 2) {
      return;
    }

    const headerRowIndex = findHeaderRowIndex(rows);

    if (headerRowIndex < 0) {
      return;
    }

    validSheetCount += 1;
    const headers = (rows[headerRowIndex] ?? []).map((cell) => cellToString(cell));

    rows.slice(headerRowIndex + 1).forEach((row) => {
      if (!Array.isArray(row) || row.every((cell) => !cellToString(cell))) {
        return;
      }

      const player = rowToPlayerImportData(headers, row, defaultSport, sportOptions);

      if (!player || !isValidPlayerRow(player)) {
        skipped += 1;
        return;
      }

      players.push(player);
    });
  });

  return { players, skipped, missingRequiredColumns: validSheetCount === 0 };
}

function extractLabeledValue(text: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n\\r,;]{2,80})`, 'iu');
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

export function extractPlayerFromOcrText(text: string, defaultSport: string): PlayerImportData {
  const player = emptyPlayerImportData();
  const compactText = text.replace(/\s+/g, ' ').trim();

  player.lastName = extractLabeledValue(compactText, ['apellido', 'apellidos']).toUpperCase();
  player.firstName = extractLabeledValue(compactText, ['nombre', 'nombres']).toUpperCase();
  player.dni =
    extractLabeledValue(compactText, ['dni', 'documento']) ||
    (compactText.match(/\b\d{1,2}[.\s]?\d{3}[.\s]?\d{3}\b/)?.[0] ?? '');
  player.memberNumber = extractLabeledValue(compactText, ['nro socio', 'numero socio', 'socio']);
  player.address = extractLabeledValue(compactText, ['domicilio', 'direccion']);
  player.birthDate = extractLabeledValue(compactText, ['fecha nacimiento', 'fecha de nacimiento']);
  player.age = extractLabeledValue(compactText, ['edad']);
  player.playerPhone =
    extractLabeledValue(compactText, ['celular jugador', 'telefono jugador', 'celular']) ||
    (compactText.match(/(?:\+?54)?\s?(?:9\s?)?(?:11|[2368]\d)\s?\d{3,4}[-\s]?\d{4}/)?.[0] ?? '');
  player.fatherPhone = extractLabeledValue(compactText, ['celular padre', 'telefono padre']);
  player.motherPhone = extractLabeledValue(compactText, ['celular madre', 'telefono madre']);
  player.email =
    extractLabeledValue(compactText, ['email', 'mail']) ||
    (compactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? '');
  player.healthInsurance = extractLabeledValue(compactText, ['obra social']);
  player.healthInsuranceNumber = extractLabeledValue(compactText, [
    'numero obra social',
    'nro obra social',
  ]);
  player.paymentMethod = extractLabeledValue(compactText, ['forma de pago']);
  player.membershipType = extractLabeledValue(compactText, ['tipo socio']);
  player.team = extractLabeledValue(compactText, ['equipo']);
  player.cohort = extractLabeledValue(compactText, ['camada']);
  player.sport = extractLabeledValue(compactText, ['deporte']) || defaultSport;

  return player;
}

export async function recognizePlayerFromImage(
  file: File,
  defaultSport: string,
  onProgress?: (progress: number) => void,
): Promise<PlayerImportData> {
  const worker = await createWorker('spa', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);

    return extractPlayerFromOcrText(data.text, defaultSport);
  } finally {
    await worker.terminate();
  }
}
