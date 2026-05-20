import { useI18n } from './i18n/I18nContext';
import { localeNames, type Locale } from './i18n/translations';

const locales = Object.entries(localeNames) as [Locale, string][];

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      className="language-select"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
    >
      {locales.map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}
