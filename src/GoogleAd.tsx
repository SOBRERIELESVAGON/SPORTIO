import { useEffect, useRef } from 'react';
import {
  googleAdsConfig,
  isGoogleAdPlacementConfigured,
  loadGoogleAdsScript,
  pushGoogleAd,
  type GoogleAdPlacement,
} from './googleAds';

type GoogleAdProps = {
  placement: GoogleAdPlacement;
};

export function GoogleAd({ placement }: GoogleAdProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isGoogleAdPlacementConfigured(placement) || initializedRef.current) {
      return;
    }

    let cancelled = false;

    loadGoogleAdsScript()
      .then(() => {
        if (!cancelled) {
          pushGoogleAd();
          initializedRef.current = true;
        }
      })
      .catch(() => {
        initializedRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!isGoogleAdPlacementConfigured(placement)) {
    return null;
  }

  const slotId = googleAdsConfig.slotIds[placement];
  const isHorizontal = placement === 'hero' || placement === 'footer';

  return (
    <div className={`google-ad-container google-ad-${placement}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={googleAdsConfig.clientId}
        data-ad-slot={slotId}
        data-ad-format={isHorizontal ? 'auto' : 'rectangle'}
        data-full-width-responsive="true"
        {...(googleAdsConfig.testMode ? { 'data-adtest': 'on' as const } : {})}
      />
    </div>
  );
}
