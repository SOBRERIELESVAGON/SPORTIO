create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$
begin
  create type public.app_role as enum (
    'super_admin',
    'club_admin',
    'sport_coordinator',
    'coach',
    'player_guardian'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_activity as enum ('training', 'match', 'tour');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_status as enum ('present', 'absent', 'excused');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code char(2) not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  full_name text not null,
  platform_role public.app_role not null default 'player_guardian',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_platform_role_check
    check (platform_role in ('super_admin', 'player_guardian'))
);

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  name text not null,
  age_from integer,
  age_to integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sport_id, name)
);

create table if not exists public.training_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete set null,
  name text not null,
  cohort text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sport_id, name, cohort)
);

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sport_id uuid not null references public.sports(id),
  division_id uuid references public.divisions(id),
  training_group_id uuid references public.training_groups(id),
  member_number text,
  first_name text not null,
  last_name text not null,
  dni text,
  email citext,
  birth_date date,
  member_status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, member_number)
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role public.app_role not null,
  sport_id uuid references public.sports(id) on delete set null,
  division_id uuid references public.divisions(id) on delete set null,
  athlete_id uuid references public.athletes(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role, sport_id, division_id, athlete_id),
  constraint organization_memberships_non_global_role
    check (role <> 'super_admin')
);

create table if not exists public.athlete_guardians (
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  relationship text not null default 'guardian',
  created_at timestamptz not null default now(),
  primary key (athlete_id, user_id)
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sport_id uuid not null references public.sports(id),
  division_id uuid references public.divisions(id),
  training_group_id uuid references public.training_groups(id),
  activity public.attendance_activity not null,
  session_date date not null,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status public.attendance_status not null,
  notes text,
  recorded_by uuid references public.user_profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  unique (session_id, athlete_id)
);

create index if not exists sports_organization_id_idx on public.sports (organization_id);
create index if not exists divisions_organization_id_idx on public.divisions (organization_id);
create index if not exists training_groups_organization_id_idx on public.training_groups (organization_id);
create index if not exists athletes_organization_id_idx on public.athletes (organization_id);
create index if not exists athletes_scope_idx
  on public.athletes (organization_id, sport_id, division_id, training_group_id);
create index if not exists organization_memberships_lookup_idx
  on public.organization_memberships (user_id, organization_id, role, status);
create index if not exists attendance_sessions_scope_idx
  on public.attendance_sessions (organization_id, sport_id, division_id, training_group_id);
create index if not exists attendance_records_scope_idx
  on public.attendance_records (organization_id, session_id, athlete_id);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and platform_role = 'super_admin'
  );
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships
      where organization_id = target_organization_id
        and user_id = auth.uid()
        and status = 'active'
    );
$$;

create or replace function public.has_org_role(
  target_organization_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships
      where organization_id = target_organization_id
        and user_id = auth.uid()
        and status = 'active'
        and role = any(allowed_roles)
    );
$$;

create or replace function public.can_manage_scope(
  target_organization_id uuid,
  target_sport_id uuid,
  target_division_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships
      where organization_id = target_organization_id
        and user_id = auth.uid()
        and status = 'active'
        and role = any(allowed_roles)
        and (sport_id is null or sport_id = target_sport_id)
        and (division_id is null or target_division_id is null or division_id = target_division_id)
    );
$$;

create or replace function public.is_guardian_of_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.athlete_guardians
    where athlete_id = target_athlete_id
      and user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.sports enable row level security;
alter table public.divisions enable row level security;
alter table public.training_groups enable row level security;
alter table public.athletes enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.athlete_guardians enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists "organizations_select_members" on public.organizations;
create policy "organizations_select_members"
  on public.organizations for select
  using (public.is_org_member(id));

drop policy if exists "organizations_manage_super_admin" on public.organizations;
create policy "organizations_manage_super_admin"
  on public.organizations for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "user_profiles_select_self_or_admin" on public.user_profiles;
create policy "user_profiles_select_self_or_admin"
  on public.user_profiles for select
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "user_profiles_update_self_or_admin" on public.user_profiles;
create policy "user_profiles_update_self_or_admin"
  on public.user_profiles for update
  using (id = auth.uid() or public.is_platform_admin())
  with check (id = auth.uid() or public.is_platform_admin());

drop policy if exists "sports_select_org_members" on public.sports;
create policy "sports_select_org_members"
  on public.sports for select
  using (public.is_org_member(organization_id));

drop policy if exists "sports_manage_org_admins" on public.sports;
create policy "sports_manage_org_admins"
  on public.sports for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "divisions_select_org_members" on public.divisions;
create policy "divisions_select_org_members"
  on public.divisions for select
  using (public.is_org_member(organization_id));

drop policy if exists "divisions_manage_scoped_staff" on public.divisions;
create policy "divisions_manage_scoped_staff"
  on public.divisions for all
  using (
    public.can_manage_scope(
      organization_id,
      sport_id,
      id,
      array['club_admin', 'sport_coordinator']::public.app_role[]
    )
  )
  with check (
    public.can_manage_scope(
      organization_id,
      sport_id,
      id,
      array['club_admin', 'sport_coordinator']::public.app_role[]
    )
  );

drop policy if exists "training_groups_select_org_members" on public.training_groups;
create policy "training_groups_select_org_members"
  on public.training_groups for select
  using (public.is_org_member(organization_id));

drop policy if exists "training_groups_manage_scoped_staff" on public.training_groups;
create policy "training_groups_manage_scoped_staff"
  on public.training_groups for all
  using (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  )
  with check (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "athletes_select_scoped_users" on public.athletes;
create policy "athletes_select_scoped_users"
  on public.athletes for select
  using (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
    or public.is_guardian_of_athlete(id)
  );

drop policy if exists "athletes_manage_scoped_staff" on public.athletes;
create policy "athletes_manage_scoped_staff"
  on public.athletes for all
  using (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  )
  with check (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "memberships_select_org_admin_or_self" on public.organization_memberships;
create policy "memberships_select_org_admin_or_self"
  on public.organization_memberships for select
  using (
    user_id = auth.uid()
    or public.has_org_role(organization_id, array['club_admin']::public.app_role[])
  );

drop policy if exists "memberships_manage_org_admins" on public.organization_memberships;
create policy "memberships_manage_org_admins"
  on public.organization_memberships for all
  using (public.has_org_role(organization_id, array['club_admin']::public.app_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::public.app_role[]));

drop policy if exists "athlete_guardians_select_staff_or_self" on public.athlete_guardians;
create policy "athlete_guardians_select_staff_or_self"
  on public.athlete_guardians for select
  using (
    user_id = auth.uid()
    or public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "athlete_guardians_manage_org_admins" on public.athlete_guardians;
create policy "athlete_guardians_manage_org_admins"
  on public.athlete_guardians for all
  using (
    public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator']::public.app_role[]
    )
  )
  with check (
    public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator']::public.app_role[]
    )
  );

drop policy if exists "attendance_sessions_select_org_members" on public.attendance_sessions;
create policy "attendance_sessions_select_org_members"
  on public.attendance_sessions for select
  using (public.is_org_member(organization_id));

drop policy if exists "attendance_sessions_manage_scoped_staff" on public.attendance_sessions;
create policy "attendance_sessions_manage_scoped_staff"
  on public.attendance_sessions for all
  using (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  )
  with check (
    public.can_manage_scope(
      organization_id,
      sport_id,
      division_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

drop policy if exists "attendance_records_select_scoped_users" on public.attendance_records;
create policy "attendance_records_select_scoped_users"
  on public.attendance_records for select
  using (
    public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
    or public.is_guardian_of_athlete(athlete_id)
  );

drop policy if exists "attendance_records_manage_scoped_staff" on public.attendance_records;
create policy "attendance_records_manage_scoped_staff"
  on public.attendance_records for all
  using (
    public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  )
  with check (
    public.has_org_role(
      organization_id,
      array['club_admin', 'sport_coordinator', 'coach']::public.app_role[]
    )
  );

