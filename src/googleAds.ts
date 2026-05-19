export type GoogleAdPlacement = 'hero' | 'sidebar' | 'footer';

const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT?.trim() || '';
const testMode = import.meta.env.VITE_GOOGLE_ADSENSE_TEST === 'true';

const slotIds: Record<GoogleAdPlacement, string> = {
  hero: import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_HERO?.trim() || '',
  sidebar: import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_SIDEBAR?.trim() || '',
  footer: import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_FOOTER?.trim() || '',
};

export const googleAdsConfig = {
  clientId,
  testMode,
  slotIds,
};

export function isGoogleAdsClientConfigured() {
  return clientId.length > 0;
}

export function isGoogleAdPlacementConfigured(placement: GoogleAdPlacement) {
  return clientId.length > 0 && slotIds[placement].length > 0;
}

let scriptLoadPromise: Promise<void> | null = null;

export function loadGoogleAdsScript() {
  if (!isGoogleAdsClientConfigured()) {
    return Promise.resolve();
  }

  if (document.querySelector('script[data-sportia-adsense]')) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');

      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-sportia-adsense', 'true');
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoadPromise = null;
        reject(new Error('No se pudo cargar el script de Google AdSense.'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

export function pushGoogleAd() {
  try {
    const adsbygoogle = window.adsbygoogle ?? [];

    window.adsbygoogle = adsbygoogle;
    adsbygoogle.push({});
  } catch {
    // Bloqueadores de anuncios u otras restricciones del navegador.
  }
}
