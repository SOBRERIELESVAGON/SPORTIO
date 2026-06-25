do $$
begin
  create type public.legal_document_type as enum (
    'terms_of_service',
    'privacy_policy',
    'liability_waiver',
    'medical_disclaimer',
    'guardian_authorization',
    'marketing_consent'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.legal_acceptance_actor as enum ('self', 'guardian', 'club_admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.coach_note_category as enum (
    'performance',
    'medical_incident',
    'physical_status',
    'tactical',
    'disciplinary',
    'general'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.coach_note_visibility as enum (
    'staff_only',
    'club_admin_only',
    'guardian_visible'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.account_status as enum (
    'current',
    'overdue',
    'suspended',
    'scholarship',
    'trial',
    'transferred',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.accounting_export_status as enum (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.organization_legal_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  legal_name text not null,
  country_code char(2) not null,
  registration_id text,
  address jsonb not null default '{}'::jsonb,
  data_controller_email citext not null,
  data_protection_officer_email citext,
  privacy_contact_email citext,
  legal_basis jsonb not null default '{}'::jsonb,
  retention_policy jsonb not null default '{}'::jsonb,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  document_type public.legal_document_type not null,
  country_code char(2),
  language_code text not null default 'es',
  version text not null,
  title text not null,
  content_url text,
  content_hash text not null,
  body_excerpt text,
  requires_guardian_for_minors boolean not null default true,
  effective_at timestamptz not null default now(),
  retired_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, document_type, country_code, language_code, version)
);

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.legal_documents(id) on delete restrict,
  user_id uuid references public.user_profiles(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  accepted_by_user_id uuid not null references public.user_profiles(id) on delete restrict,
  actor public.legal_acceptance_actor not null,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  evidence_hash text,
  metadata jsonb not null default '{}'::jsonb,
  revoked_at timestamptz,
  constraint legal_acceptances_user_or_athlete_check
    check (user_id is not null or athlete_id is not null)
);

create table if not exists public.athlete_medical_disclosures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  submitted_by uuid not null references public.user_profiles(id) on delete restrict,
  consent_id uuid references public.legal_acceptances(id) on delete set null,
  encrypted_payload jsonb not null,
  encryption_key_id text not null,
  document_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  session_id uuid references public.attendance_sessions(id) on delete set null,
  author_user_id uuid not null references public.user_profiles(id) on delete restrict,
  category public.coach_note_category not null default 'general',
  visibility public.coach_note_visibility not null default 'staff_only',
  title text,
  body text,
  encrypted_payload jsonb,
  encryption_key_id text,
  severity smallint,
  event_at timestamptz not null default now(),
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint coach_notes_severity_check
    check (severity is null or severity between 1 and 5),
  constraint coach_notes_body_or_encrypted_check
    check (body is not null or encrypted_payload is not null)
);

create table if not exists public.athlete_readiness_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  session_id uuid references public.attendance_sessions(id) on delete set null,
  recorded_by uuid not null references public.user_profiles(id) on delete restrict,
  readiness_status text not null,
  pain_level smallint,
  summary text,
  recorded_at timestamptz not null default now(),
  constraint athlete_readiness_pain_level_check
    check (pain_level is null or pain_level between 0 and 10)
);

create table if not exists public.accounting_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  display_name text not null,
  external_tenant_id text,
  webhook_url text,
  secret_ref text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, display_name)
);

create table if not exists public.athlete_account_statuses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  integration_id uuid references public.accounting_integrations(id) on delete set null,
  external_account_id text,
  status public.account_status not null default 'unknown',
  balance_cents integer,
  currency char(3) not null default 'ARS',
  period_start date,
  period_end date,
  source text not null default 'manual',
  imported_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.attendance_account_reconciliations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  athlete_account_status_id uuid references public.athlete_account_statuses(id) on delete set null,
  attendance_status public.attendance_status not null,
  account_status public.account_status not null default 'unknown',
  balance_cents integer,
  currency char(3),
  flags jsonb not null default '[]'::jsonb,
  reconciled_at timestamptz not null default now(),
  reconciled_by uuid references public.user_profiles(id) on delete set null,
  unique (attendance_record_id, athlete_account_status_id)
);

create table if not exists public.accounting_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid references public.accounting_integrations(id) on delete set null,
  created_by uuid references public.user_profiles(id) on delete set null,
  status public.accounting_export_status not null default 'pending',
  export_format text not null default 'csv',
  destination text not null default 'download',
  period_start date,
  period_end date,
  file_url text,
  checksum text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.accounting_export_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  export_id uuid not null references public.accounting_exports(id) on delete cascade,
  attendance_record_id uuid references public.attendance_records(id) on delete set null,
  reconciliation_id uuid references public.attendance_account_reconciliations(id) on delete set null,
  athlete_id uuid references public.athletes(id) on delete set null,
  exported_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.accounting_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid references public.accounting_integrations(id) on delete set null,
  direction text not null,
  event_type text not null,
  status text not null default 'received',
  payload jsonb not null,
  error_message text,
  retry_count integer not null default 0,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint accounting_webhook_direction_check
    check (direction in ('inbound', 'outbound'))
);

create index if not exists legal_documents_scope_idx
  on public.legal_documents (organization_id, document_type, country_code, language_code, effective_at);
create index if not exists legal_acceptances_subject_idx
  on public.legal_acceptances (organization_id, user_id, athlete_id, document_id, accepted_at);
create index if not exists athlete_medical_disclosures_lookup_idx
  on public.athlete_medical_disclosures (organization_id, athlete_id, created_at);
create index if not exists coach_notes_lookup_idx
  on public.coach_notes (organization_id, athlete_id, category, event_at)
  where deleted_at is null;
create index if not exists athlete_readiness_logs_lookup_idx
  on public.athlete_readiness_logs (organization_id, athlete_id, recorded_at);
create index if not exists athlete_account_statuses_latest_idx
  on public.athlete_account_statuses (organization_id, athlete_id, imported_at desc);
create index if not exists attendance_reconciliations_record_idx
  on public.attendance_account_reconciliations (organization_id, attendance_record_id);
create index if not exists accounting_exports_status_idx
  on public.accounting_exports (organization_id, status, created_at);
create index if not exists accounting_webhook_events_status_idx
  on public.accounting_webhook_events (organization_id, status, received_at);

create or replace function public.can_manage_athlete(
  target_athlete_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.athletes athlete
    where athlete.id = target_athlete_id
      and public.can_manage_scope(
        athlete.organization_id,
        athlete.sport_id,
        athlete.division_id,
        allowed_roles
      )
  );
$$;

create or replace view public.attendance_daily_analytics
with (security_invoker = true) as
select
  session.organization_id,
  session.session_date,
  session.sport_id,
  session.division_id,
  session.training_group_id,
  count(record.id)::integer as total_records,
  count(*) filter (where record.status = 'present')::integer as present_count,
  count(*) filter (where record.status = 'absent')::integer as absent_count,
  count(*) filter (where record.status = 'excused')::integer as excused_count,
  round(
    (count(*) filter (where record.status = 'present')::numeric / nullif(count(record.id), 0)) * 100,
    2
  ) as attendance_percentage
from public.attendance_sessions session
left join public.attendance_records record on record.session_id = session.id
group by
  session.organization_id,
  session.session_date,
  session.sport_id,
  session.division_id,
  session.training_group_id;

create or replace view public.athlete_attendance_rollups
with (security_invoker = true) as
select
  athlete.organization_id,
  athlete.id as athlete_id,
  athlete.sport_id,
  athlete.division_id,
  athlete.training_group_id,
  count(record.id)::integer as total_records,
  count(*) filter (where record.status = 'present')::integer as present_count,
  count(*) filter (where record.status = 'absent')::integer as absent_count,
  count(*) filter (where record.status = 'excused')::integer as excused_count,
  max(session.session_date) as last_session_date,
  round(
    (count(*) filter (where record.status = 'present')::numeric / nullif(count(record.id), 0)) * 100,
    2
  ) as attendance_percentage
from public.athletes athlete
left join public.attendance_records record on record.athlete_id = athlete.id
left join public.attendance_sessions session on session.id = record.session_id
group by
  athlete.organization_id,
  athlete.id,
  athlete.sport_id,
  athlete.division_id,
  athlete.training_group_id;

create or replace view public.attendance_accounting_export_view
with (security_invoker = true) as
select
  record.organization_id,
  session.session_date,
  session.activity,
  session.sport_id,
  session.division_id,
  session.training_group_id,
  athlete.id as athlete_id,
  athlete.member_number,
  athlete.first_name,
  athlete.last_name,
  record.status as attendance_status,
  latest_account.status as account_status,
  latest_account.balance_cents,
  latest_account.currency,
  latest_account.external_account_id,
  record.recorded_at
from public.attendance_records record
join public.attendance_sessions session on session.id = record.session_id
join public.athletes athlete on athlete.id = record.athlete_id
left join lateral (
  select account.*
  from public.athlete_account_statuses account
  where account.organization_id = record.organization_id
    and account.athlete_id = record.athlete_id
  order by account.imported_at desc
  limit 1
) latest_account on true;

alter table public.organization_legal_profiles enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.athlete_medical_disclosures enable row level security;
alter table public.coach_notes enable row level security;
alter table public.athlete_readiness_logs enable row level security;
alter table public.accounting_integrations enable row level security;
alter table public.athlete_account_statuses enable row level security;
alter table public.attendance_account_reconciliations enable row level security;
alter table public.accounting_exports enable row level security;
alter table public.accounting_export_items enable row level security;
alter table public.accounting_webhook_events enable row level security;

drop policy if exists "legal_profiles_select_org_admins" on public.organization_legal_profiles;
create policy "legal_profiles_select_org_admins"
  on public.organization_legal_profiles for select
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "legal_profiles_manage_org_admins" on public.organization_legal_profiles;
create policy "legal_profiles_manage_org_admins"
  on public.organization_legal_profiles for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "legal_documents_select_members" on public.legal_documents;
create policy "legal_documents_select_members"
  on public.legal_documents for select
  using (organization_id is null or public.is_org_member(organization_id));

drop policy if exists "legal_documents_manage_admins" on public.legal_documents;
create policy "legal_documents_manage_admins"
  on public.legal_documents for all
  using (organization_id is null and public.is_platform_admin()
    or public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (organization_id is null and public.is_platform_admin()
    or public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "legal_acceptances_select_subject_or_admin" on public.legal_acceptances;
create policy "legal_acceptances_select_subject_or_admin"
  on public.legal_acceptances for select
  using (
    accepted_by_user_id = auth.uid()
    or user_id = auth.uid()
    or public.has_org_role(organization_id, array['club_admin']::public.app_role[])
  );

drop policy if exists "legal_acceptances_insert_members" on public.legal_acceptances;
create policy "legal_acceptances_insert_members"
  on public.legal_acceptances for insert
  with check (
    accepted_by_user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

drop policy if exists "medical_disclosures_select_staff_or_guardian" on public.athlete_medical_disclosures;
create policy "medical_disclosures_select_staff_or_guardian"
  on public.athlete_medical_disclosures for select
  using (
    public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
    or public.is_guardian_of_athlete(athlete_id)
  );

drop policy if exists "medical_disclosures_insert_staff_or_guardian" on public.athlete_medical_disclosures;
create policy "medical_disclosures_insert_staff_or_guardian"
  on public.athlete_medical_disclosures for insert
  with check (
    submitted_by = auth.uid()
    and (
      public.can_manage_athlete(
        athlete_id,
        array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
      )
      or public.is_guardian_of_athlete(athlete_id)
    )
  );

drop policy if exists "coach_notes_select_staff_or_shared_guardian" on public.coach_notes;
create policy "coach_notes_select_staff_or_shared_guardian"
  on public.coach_notes for select
  using (
    deleted_at is null
    and (
      public.can_manage_athlete(
        athlete_id,
        array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
      )
      or (
        visibility = 'guardian_visible'
        and public.is_guardian_of_athlete(athlete_id)
      )
    )
  );

drop policy if exists "coach_notes_manage_staff" on public.coach_notes;
create policy "coach_notes_manage_staff"
  on public.coach_notes for all
  using (
    public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  )
  with check (
    author_user_id = auth.uid()
    and public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "readiness_select_staff_or_guardian" on public.athlete_readiness_logs;
create policy "readiness_select_staff_or_guardian"
  on public.athlete_readiness_logs for select
  using (
    public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
    or public.is_guardian_of_athlete(athlete_id)
  );

drop policy if exists "readiness_manage_staff" on public.athlete_readiness_logs;
create policy "readiness_manage_staff"
  on public.athlete_readiness_logs for all
  using (
    public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  )
  with check (
    recorded_by = auth.uid()
    and public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "accounting_integrations_select_admins" on public.accounting_integrations;
create policy "accounting_integrations_select_admins"
  on public.accounting_integrations for select
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_integrations_manage_admins" on public.accounting_integrations;
create policy "accounting_integrations_manage_admins"
  on public.accounting_integrations for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "account_statuses_select_staff" on public.athlete_account_statuses;
create policy "account_statuses_select_staff"
  on public.athlete_account_statuses for select
  using (
    public.can_manage_athlete(
      athlete_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "account_statuses_manage_admins" on public.athlete_account_statuses;
create policy "account_statuses_manage_admins"
  on public.athlete_account_statuses for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "reconciliations_select_staff" on public.attendance_account_reconciliations;
create policy "reconciliations_select_staff"
  on public.attendance_account_reconciliations for select
  using (
    public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "reconciliations_manage_admins" on public.attendance_account_reconciliations;
create policy "reconciliations_manage_admins"
  on public.attendance_account_reconciliations for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_exports_select_admins" on public.accounting_exports;
create policy "accounting_exports_select_admins"
  on public.accounting_exports for select
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_exports_manage_admins" on public.accounting_exports;
create policy "accounting_exports_manage_admins"
  on public.accounting_exports for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_export_items_select_admins" on public.accounting_export_items;
create policy "accounting_export_items_select_admins"
  on public.accounting_export_items for select
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_export_items_manage_admins" on public.accounting_export_items;
create policy "accounting_export_items_manage_admins"
  on public.accounting_export_items for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_webhooks_select_admins" on public.accounting_webhook_events;
create policy "accounting_webhooks_select_admins"
  on public.accounting_webhook_events for select
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "accounting_webhooks_manage_admins" on public.accounting_webhook_events;
create policy "accounting_webhooks_manage_admins"
  on public.accounting_webhook_events for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

