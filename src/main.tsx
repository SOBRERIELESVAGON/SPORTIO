import { StrictMode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { createRoot } from 'react-dom/client';
import App from './App';
import { isGoogleAdsClientConfigured } from './googleAds';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontro el contenedor principal de Sportia.');
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleAdsConfigured = isGoogleAdsClientConfigured();

const app = (
  <App
    googleClientIdConfigured={Boolean(googleClientId)}
    googleAdsConfigured={googleAdsConfigured}
  />
);

createRoot(rootElement).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
