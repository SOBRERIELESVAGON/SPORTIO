/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_ADSENSE_CLIENT?: string;
  readonly VITE_GOOGLE_ADSENSE_SLOT_HERO?: string;
  readonly VITE_GOOGLE_ADSENSE_SLOT_SIDEBAR?: string;
  readonly VITE_GOOGLE_ADSENSE_SLOT_FOOTER?: string;
  readonly VITE_GOOGLE_ADSENSE_TEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  adsbygoogle?: Record<string, unknown>[];
}
