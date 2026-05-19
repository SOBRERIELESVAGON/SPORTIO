import ca from './locales/ca.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import eu from './locales/eu.json';
import fr from './locales/fr.json';
import gl from './locales/gl.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';

export type LanguageCode =
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

export type TranslationKey = keyof typeof es;

export type TranslationParams = Record<string, string | number>;

export const languageOptions: { code: LanguageCode; label: string }[] = [
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

export const languageKey = 'sportia.language';

const catalogs: Record<LanguageCode, Record<TranslationKey, string>> = {
  es,
  en,
  pt,
  fr,
  it,
  de,
  nl,
  ca,
  gl,
  eu,
  zh,
};

export type Translator = (key: TranslationKey, params?: TranslationParams) => string;

function applyParams(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function translate(
  language: LanguageCode,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template = catalogs[language][key] ?? catalogs.es[key] ?? key;

  return applyParams(template, params);
}

export function createTranslator(language: LanguageCode): Translator {
  return (key, params) => translate(language, key, params);
}

export function isLanguageCode(value: string | null): value is LanguageCode {
  return languageOptions.some((option) => option.code === value);
}

export function translateRole(language: LanguageCode, role: string) {
  switch (role) {
    case 'Staff':
      return translate(language, 'role.staff');
    case 'Coordinación':
      return translate(language, 'role.coordination');
    case 'Master':
      return translate(language, 'role.master');
    case 'Jugador':
      return translate(language, 'role.player');
    default:
      return role;
  }
}

export function translateReportPeriod(language: LanguageCode, period: string) {
  const map: Record<string, TranslationKey> = {
    Diario: 'period.daily',
    Semanal: 'period.weekly',
    Mensual: 'period.monthly',
    Bimestral: 'period.bimonthly',
    Trimestral: 'period.quarterly',
    Semestral: 'period.semiannual',
    Anual: 'period.annual',
  };

  const key = map[period];

  return key ? translate(language, key) : period;
}

export function translateReportScope(language: LanguageCode, scope: string) {
  const map: Record<string, TranslationKey> = {
    General: 'reportScope.general',
    División: 'reportScope.division',
    Equipo: 'reportScope.team',
    Camada: 'reportScope.cohort',
    Individual: 'reportScope.individual',
  };

  const key = map[scope];

  return key ? translate(language, key) : scope;
}

export function translateRankingScope(language: LanguageCode, scope: string) {
  const map: Record<string, TranslationKey> = {
    Camada: 'scope.cohort',
    Edad: 'scope.age',
    Equipo: 'scope.team',
  };

  const key = map[scope];

  return key ? translate(language, key) : scope;
}

export function translateAttendanceStatus(language: LanguageCode, status: string) {
  return status === 'Ausente'
    ? translate(language, 'status.absent')
    : translate(language, 'status.present');
}

export function translateActivity(language: LanguageCode, activity: string) {
  return activity === 'Partido'
    ? translate(language, 'activity.match')
    : translate(language, 'activity.training');
}

export function translateMemberStatus(language: LanguageCode, status: string) {
  return status === 'Inactivo'
    ? translate(language, 'memberStatus.inactive')
    : translate(language, 'memberStatus.active');
}

export function getAllSportsLabel(language: LanguageCode) {
  return translate(language, 'report.allSports');
}
