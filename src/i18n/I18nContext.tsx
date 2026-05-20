import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import translations, { type Locale, type TranslationKeys } from './translations';

type I18nContextValue = {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('sportia-locale');
    if (saved && saved in translations) return saved as Locale;
  } catch {
    /* SSR or private browsing */
  }
  return 'es';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem('sportia-locale', next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
