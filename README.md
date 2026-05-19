# Sportia list

App de asistencia a entrenamientos deportivos multi-deporte.

## Primer alcance

- Login con Google configurable por entorno.
- Landing inicial para presentar Sportia list.
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
- Entrenador/Manager y coordinacion ingresan con clave; jugadores ingresan sin clave y solo ven su ficha individual y el ranking.
- Rol Master con clave para ver todo, estadísticas globales y reportes de usuarios.
- Modelo gratuito para clubes, entrenadores, staff, jugadores y coordinacion, monetizado con espacios publicitarios administrables.
- Selector de idioma con Español primero y mas de 10 opciones; al cambiar idioma se traducen titulos, menus, formularios y mensajes de toda la interfaz.
- Ojo para ver/ocultar clave, opción de recordar clave en el navegador y deporte fijo persistente.
- Lista de 30 deportes practicados en Argentina, primero deportes de equipo y luego individuales.
- Importacion masiva de jugadores desde planilla Excel/CSV y extraccion de datos desde foto de ficha (staff y coordinacion).
- Indicadores principales de deportistas, equipos y asistencia.

## Configurar login con Google

1. Crea un OAuth Client ID en Google Cloud Console para una aplicacion web.
2. Copia `.env.example` a `.env`.
3. Completa:

```bash
VITE_GOOGLE_CLIENT_ID=tu-client-id-de-google.apps.googleusercontent.com
```

Para desarrollo local agrega `http://localhost:5173` como origen autorizado en Google.
Sin esa variable, Sportia list muestra el acceso en modo demo.

## Configurar publicidad de Google (AdSense)

1. Crea una cuenta en [Google AdSense](https://www.google.com/adsense/) y agrega tu sitio.
2. Crea **unidades publicitarias** para cada espacio (principal, lateral, inferior).
3. Copia `.env.example` a `.env` y completa:

```bash
VITE_GOOGLE_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
VITE_GOOGLE_ADSENSE_SLOT_HERO=1234567890
VITE_GOOGLE_ADSENSE_SLOT_SIDEBAR=1234567891
VITE_GOOGLE_ADSENSE_SLOT_FOOTER=1234567892
```

4. Opcional: `VITE_GOOGLE_ADSENSE_TEST=true` muestra anuncios de prueba mientras desarrollás.

Los tres espacios de Sportia list (home/ranking, paneles internos y pie de página) cargan el script de AdSense cuando el publisher ID y el slot correspondiente están configurados. Sin esas variables se muestra el marcador de espacio publicitario en modo demo. El rol **Master** ve en su panel el estado de cada unidad (activa, pendiente o sin configurar).

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
