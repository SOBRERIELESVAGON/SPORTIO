# Sportia

App de asistencia a entrenamientos deportivos multi-deporte.

## Primer alcance

- Login con Google configurable por entorno.
- Landing inicial para presentar Sportia.
- Resumen de asistencia de un entrenamiento.
- Modulo de carga de deportistas con desplegable de deporte y estado de asistencia.
- Indicadores principales de deportistas, equipos y asistencia.
- Agenda de proximas sesiones por equipo/deporte.

## Configurar login con Google

1. Crea un OAuth Client ID en Google Cloud Console para una aplicacion web.
2. Copia `.env.example` a `.env`.
3. Completa:

```bash
VITE_GOOGLE_CLIENT_ID=tu-client-id-de-google.apps.googleusercontent.com
```

Para desarrollo local agrega `http://localhost:5173` como origen autorizado en Google.
Sin esa variable, Sportia muestra el acceso en modo demo.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificacion

```bash
npm run lint
npm run build
```
