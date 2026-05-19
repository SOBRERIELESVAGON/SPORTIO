# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Sportia is a single-page React + TypeScript app (Vite) for sports training attendance management. It is a frontend-only application with no backend, database, or external services. All data is currently hardcoded/mock.

### Running the app

Standard commands are in `package.json`:

- `npm run dev` — starts Vite dev server (default port 5173)
- `npm run build` — TypeScript type-check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

Use `--host 0.0.0.0` with the dev server if you need network access from outside localhost (e.g. `npm run dev -- --host 0.0.0.0`).

### Notes

- The `main` branch contains only a README. Application source code lives on feature branches (e.g. `cursor/start-sportia-app-cf6c`). When setting up, ensure you are on a branch with `package.json` before running `npm install`.
- Node.js v22+ and npm 10+ are sufficient. No `.nvmrc` or other version pinning exists.
- No environment variables are required; `.env` files are gitignored but not referenced in code.
- No tests framework is configured yet — `npm run lint` and `npm run build` are the primary validation commands.
