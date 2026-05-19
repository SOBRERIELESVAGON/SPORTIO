# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Sportia is a single-page React (TypeScript) frontend application for managing multi-sport training attendance. There is no backend or database — the app currently uses hardcoded demo data.

### Tech Stack

- **Frontend:** React 19, TypeScript 6, Vite 8
- **Linting:** ESLint 10 with TypeScript-ESLint
- **Package Manager:** npm (lockfile: `package-lock.json`)

### Common Commands

All commands run from the repo root (`/workspace`):

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves at `http://localhost:5173`) |
| Lint | `npm run lint` |
| Build | `npm run build` (runs `tsc -b && vite build`) |
| Preview build | `npm run preview` |

### Notes

- The dev server (Vite) supports hot module replacement; file saves reflect instantly in the browser.
- Use `npm run dev -- --host 0.0.0.0` if you need the dev server accessible from outside localhost.
- There are no automated tests configured yet (no test runner or test files).
- The application code lives on the `cursor/start-sportia-app-cf6c` branch; the `main` branch only contains a README.
