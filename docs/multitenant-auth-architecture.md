# Multi-tenant auth and data model

## Recommended stack

Use Supabase for the first production backend because the current app is React + TypeScript on Vite and has no server layer yet. Supabase gives the project:

- PostgreSQL for relational club, sport, division, athlete and attendance data.
- Supabase Auth for required email/password sign-up and login.
- Row Level Security (RLS) so club isolation is enforced by the database, not only by React filters.
- A browser TypeScript client later, without adding a custom API server at this stage.

If the product grows into custom workflows, keep the same PostgreSQL schema and add a Node/NestJS or Fastify API in front of it. The RLS rules should remain the final protection layer.

## Role model

The schema defines these roles in `public.app_role`:

- `super_admin`: global platform operator.
- `club_admin`: manages one club and its users, sports, divisions and groups.
- `sport_coordinator`: manages assigned sports and divisions inside one club.
- `coach`: takes attendance, sees assigned groups, and manages assigned athletes.
- `player_guardian`: sees only linked athlete profiles, ranking and role-specific messages.

`user_profiles` stores the authenticated user identity. `organization_memberships` stores the user's role and optional sport/division/athlete scope inside a club.

## Tenant isolation rule

Every operational table has `organization_id`:

- `sports`
- `divisions`
- `training_groups`
- `athletes`
- `organization_memberships`
- `athlete_guardians`
- `attendance_sessions`
- `attendance_records`

The database migration enables RLS and uses helper functions such as `is_org_member`, `has_org_role` and `can_manage_scope`. A user cannot select, insert, update or delete rows in another club unless they are `super_admin`.

## Frontend transition path

The current frontend still uses mock data. As a first step, athletes now carry `organizationId` and all lists, reports, rankings, deletion, undo and attendance mutations are scoped through `filterByOrganizationId`.

Next integration steps:

1. Add `@supabase/supabase-js` and replace the demo password login with Supabase email/password auth.
2. Load the active membership after login and store its `organization_id` in the app session.
3. Replace local mock arrays with queries filtered by `organization_id`; keep RLS enabled so the same filter is enforced in PostgreSQL.
4. Move current denormalized attendance counters into `attendance_sessions` and `attendance_records`, then derive rankings from records.

