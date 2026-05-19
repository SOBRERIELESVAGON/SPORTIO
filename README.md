# Sportia

App de asistencia a entrenamientos deportivos multi-deporte.

## Primer alcance

- Login con Google configurable por entorno.
- Landing inicial para presentar Sportia.
- Resumen de asistencia de un entrenamiento.
- Modulo de carga de jugadores con apellido, nombre, DNI, obra social, celulares de jugador/padre/madre y datos de socio separados.
- Exportacion a Excel/CSV con una columna por cada item de la ficha.
- Medalla por asistencia perfecta de 30 dias en ficha y reportes.
- Control operativo de asistencia para entrenamiento o partido con todos presentes por defecto.
- Control separado de giras para marcar ausentes, jugadores que se alojan y jugadores que hospedan/reciben.
- Ranking publico por camada, edad o equipo con 10 pts por entrenamiento, 10 pts por partido, 10 pts por viaje, 20 pts si se aloja y 20 pts si hospeda/recibe.
- Reportes de asistencia con ejemplo diario, semanal, mensual, bimestral, trimestral, semestral y anual.
- Vista de reportes por deporte, individual y general por division, equipo o camada.
- Control de vista por rol: usuarios ven ranking; staff y coordinacion ven carga/reportes internos.
- Staff y coordinacion ingresan con clave; jugadores ingresan sin clave y solo ven su ficha individual y el ranking.
- Selector de idioma con Español primero y mas de 10 opciones disponibles.
- Indicadores principales de deportistas, equipos y asistencia.

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
