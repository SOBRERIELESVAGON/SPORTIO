# Global sports platform architecture

## Current structure review

The app is still a frontend-only Vite + React application. The main risk is not the UI itself; it is that `src/App.tsx` holds domain types, mock data, auth flow, tenant filtering, attendance mutations, reports, ranking and all page sections in one file.

Recommended split:

```text
src/
  app/
    AppShell.tsx
    routes.ts
  components/
    auth/
    attendance/
    athletes/
    coach-notes/
    legal/
    reports/
  domain/
    attendance.ts
    athletes.ts
    finance.ts
    legal.ts
    ranking.ts
    tenant.ts
  hooks/
    useTenantSession.ts
    useAttendanceSessions.ts
    useAthleteRoster.ts
  services/
    supabaseClient.ts
    authService.ts
    attendanceService.ts
    legalConsentService.ts
    accountingExportService.ts
  i18n/
    locales/
  styles/
    tokens.css
    layout.css
```

First extraction targets:

1. Move pure calculations (`calculateRankingScore`, report grouping, attendance ratios) into `src/domain`.
2. Move data mutations into service functions that accept a tenant-scoped session.
3. Convert large UI sections into components: `LoginScreen`, `AttendanceDashboard`, `AthleteDataEntry`, `ReportsPanel`, `CoachNotebook`, `LegalOnboarding`.
4. Keep `App.tsx` as composition only: auth session, current organization, page layout and route/section rendering.

## Multi-tenant and localization model

Every operational record must include `organization_id`. Frontend filtering is only a UX optimization; the database must enforce isolation with RLS.

Session shape:

```ts
type TenantSession = {
  userId: string;
  email: string;
  role: 'super_admin' | 'club_admin' | 'sport_coordinator' | 'coach' | 'player_guardian';
  organizationId: string;
  sportIds?: string[];
  divisionIds?: string[];
  athleteId?: string;
};
```

Localization standards:

- Persist preferred language, country and organization separately.
- Store user-facing copy in locale catalogs, never inline strings.
- Store timestamps in UTC; render by `organization.timezone`.
- Store money as integer minor units (`balance_cents`) plus ISO currency (`ARS`, `USD`, `EUR`).
- Store country-specific legal documents by `country_code`, `language_code` and version.
- Use `Intl.DateTimeFormat`, `Intl.NumberFormat` and `Intl.RelativeTimeFormat` at rendering boundaries.

## Legal onboarding and privacy

Before the app allows access to protected screens, users must accept required documents:

1. Terms of service.
2. Privacy policy.
3. Civil/medical liability waiver.
4. Guardian authorization when the athlete is a minor.
5. Optional marketing consent.

The new migration adds:

- `organization_legal_profiles`: data controller, DPO/privacy email, retention policy.
- `legal_documents`: versioned documents by organization, country and language.
- `legal_acceptances`: explicit acceptance evidence, IP, user agent and actor.
- `athlete_medical_disclosures`: encrypted medical payloads linked to consent evidence.

Compliance rules:

- Keep consent immutable; create a new document version instead of editing accepted text.
- Store content hash for every accepted document.
- Keep sensitive medical data encrypted at application edge before insert.
- Do not store raw payment cards or accounting secrets; store tokenized references (`secret_ref`).
- Add export/delete workflows for GDPR/CCPA data subject requests before production.

## Attendance and accounting reconciliation

The current UI stores attendance counters on athletes. Production should write immutable records:

- `attendance_sessions`: one training/match/tour event by sport, division, group and date.
- `attendance_records`: one row per athlete per session.

The new finance layer adds:

- `accounting_integrations`: external provider config without raw secrets.
- `athlete_account_statuses`: latest imported account state from accounting.
- `attendance_account_reconciliations`: snapshot that joins attendance with account status.
- `accounting_exports` and `accounting_export_items`: auditable CSV/API/webhook exports.
- `accounting_webhook_events`: inbound/outbound event audit.
- `attendance_accounting_export_view`: export-ready projection for CSV/API.

Recommended API surface when a backend is added:

```text
GET  /api/orgs/:orgId/attendance/export?from=&to=&sportId=&divisionId=
POST /api/orgs/:orgId/accounting/import-statuses
POST /api/orgs/:orgId/accounting/reconcile-attendance
POST /api/orgs/:orgId/accounting/exports
POST /api/webhooks/accounting/:provider
```

With Supabase/PostgREST, the same flows can start from RLS-protected tables and views before building a custom API.

## Coach and manager utilities

The new coach module adds:

- `coach_notes`: performance, medical incident, physical state, tactical, disciplinary and general notes.
- `athlete_readiness_logs`: fast field check-in for availability/pain/physical state.
- Privacy-aware visibility: staff-only, club-admin-only or guardian-visible.

UX flow:

1. Coach opens assigned group.
2. Taps athlete card.
3. Adds quick status: available, limited, absent, injured.
4. Adds note category and severity.
5. Chooses visibility.
6. Follow-up tasks surface in the next training session.

Medical notes should use `encrypted_payload`; plain `body` is acceptable only for non-sensitive tactical/performance notes.

## Analytics dashboard

The migration adds initial views:

- `attendance_daily_analytics`: present/absent/excused counts by date and scope.
- `athlete_attendance_rollups`: athlete-level attendance percentages.
- `attendance_accounting_export_view`: attendance plus latest account status.

Next metrics:

- Attendance trend by week/month.
- Absence heatmap by weekday and training group.
- Early dropout risk: low attendance trend + overdue account + no recent coach note.
- Athlete evolution: attendance, readiness, performance notes, medical incidents.
- Coach workload: sessions taken, notes pending, unresolved follow-ups.

## Mobile-first UI proposal

Field usage should optimize for one hand, poor connectivity and quick decisions.

### Navigation

- Mobile bottom tabs: `Asistencia`, `Jugadores`, `Notas`, `Reportes`, `Más`.
- Keep desktop top navigation, but collapse filters into a sticky sheet on mobile.
- Organization, sport, division and group selectors should be a single stacked context switcher.

### Attendance screen

- Sticky header: organization, sport, division, group, session time.
- Search + segmented filters: `Todos`, `Ausentes`, `Sin registrar`, `Morosos`.
- Athlete cards with large buttons: `Presente`, `Ausente`, `Justificado`.
- Offline-friendly pending state for attendance records.
- Quick list on home should show only exceptions: absentees, medical incidents, account blocks.

### Legal onboarding

- Stepper UI before first use:
  1. Identity.
  2. Club/institution.
  3. Required policies.
  4. Guardian confirmation if minor.
  5. Final acceptance summary.
- Each checkbox must be explicit and versioned.
- Download/share accepted documents after completion.

### Coach notes

- Bottom sheet from athlete card.
- Category chips: rendimiento, médico, físico, táctico, disciplina.
- Voice-to-text ready text area.
- Visibility toggle.
- Follow-up date picker.

### Analytics

- Mobile cards first, charts second.
- Use color sparingly: red for absence risk, amber for overdue/follow-up, green for healthy.
- Heatmaps should be tappable and filter the underlying athlete list.

## Implementation sequence

1. Extract domain types and pure functions from `App.tsx`.
2. Add Supabase client and auth session loading.
3. Gate app with legal onboarding.
4. Replace mock attendance counters with session/record writes.
5. Add coach notes/readiness UI.
6. Add accounting import/export workflows.
7. Replace mock reports with SQL views.
8. Add automated tests around tenant isolation, consent gating and attendance/account reconciliation.

