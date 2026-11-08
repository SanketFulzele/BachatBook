-- ============================================================================
-- Bachat Book · Migration 00014 · Signup provisioning and role management
-- ----------------------------------------------------------------------------
-- Adds a member-only profile provisioning path, audited administrative access
-- changes, and a one-time initial-admin claim bound to the existing Neon Auth
-- user ID supplied by the project owner. No earlier migration is modified.
-- ============================================================================
begin;

-- A signup may be awaiting email verification, so profile creation happens on
-- the first authenticated session. Refuse to create a second profile when an
-- existing application profile already uses the same email for another auth
-- identity; initial-admin setup or trusted identity reconciliation must handle
-- that case instead.
create or replace function public.ensure_own_profile(
  profile_full_name text,
  profile_phone text default null,
  profile_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_email text := nullif(lower(btrim(profile_email)), '');
begin
  if v_auth_user_id is null or length(btrim(v_auth_user_id)) = 0 then
    raise exception 'A Neon Auth session is required to create a profile'
      using errcode = '42501';
  end if;

  if profile_full_name is null or length(btrim(profile_full_name)) < 2 then
    raise exception 'Enter your full name'
      using errcode = '23514';
  end if;

  if v_email is null then
    raise exception 'An email address is required to create a profile'
      using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_email, 0));

  if exists (
    select 1
    from public.profiles p
    where lower(p.email) = v_email
      and p.auth_user_id <> v_auth_user_id
  ) then
    raise exception 'An application profile already exists for this email and needs trusted account linking'
      using errcode = '23505';
  end if;

  insert into public.profiles (auth_user_id, full_name, phone, email, role)
  values (
    v_auth_user_id,
    btrim(profile_full_name),
    nullif(btrim(profile_phone), ''),
    v_email,
    'member'
  )
  on conflict (auth_user_id) do nothing
  returning id into v_profile_id;

  if v_profile_id is null then
    select p.id
    into v_profile_id
    from public.profiles p
    where p.auth_user_id = v_auth_user_id;
  end if;

  return v_profile_id;
end;
$$;

comment on function public.ensure_own_profile(text, text, text) is
  'Creates or returns the current Neon Auth user profile with the member role; refuses conflicting email links.';

-- Only the definer RPCs below may change role or active status. Ordinary
-- profile updates remain available for the user's own name and phone only.
drop policy profiles_update_own_or_admin on public.profiles;

create policy profiles_update_own_contact
  on public.profiles
  for update
  to authenticated
  using (auth_user_id = auth.user_id())
  with check (auth_user_id = auth.user_id());

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create table public.initial_admin_setup (
  singleton boolean primary key default true check (singleton),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  auth_user_id text not null,
  claimed_at timestamptz not null default now()
);

insert into public.initial_admin_setup (singleton, profile_id, auth_user_id)
select true, p.id, p.auth_user_id
from public.profiles p
where p.role = 'admin'
order by p.created_at, p.id
limit 1;

alter table public.initial_admin_setup enable row level security;
revoke all on public.initial_admin_setup from public;
revoke all on public.initial_admin_setup from authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anonymous') then
    execute 'revoke all on public.initial_admin_setup from anonymous';
  end if;
end
$$;

create or replace function public.enforce_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.id is distinct from old.id or new.auth_user_id is distinct from old.auth_user_id)
     and pg_catalog.current_setting('bachatbook.profile_access_operation', true) is distinct from 'on' then
    raise exception 'Profile id and auth_user_id are immutable outside initial-admin setup'
      using errcode = '42501';
  end if;

  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and pg_catalog.current_setting('bachatbook.profile_access_operation', true) is distinct from 'on' then
    raise exception 'Role and account status changes must use the authorized access operation'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Role/access changes from an authenticated administrator. The advisory lock
-- serializes competing demotions/deactivations so the final active admin
-- cannot be removed by concurrent requests.
create or replace function public.update_user_access(
  target_profile_id uuid,
  requested_role public.user_role default null,
  requested_is_active boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_target public.profiles%rowtype;
  v_new_role public.user_role;
  v_new_is_active boolean;
  v_active_admin_count bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(1701190064);

  v_actor_id := public.current_profile_id();
  if v_actor_id is null or not public.is_admin() then
    raise exception 'An active administrator session is required'
      using errcode = '42501';
  end if;

  if target_profile_id is null
     or (requested_role is null and requested_is_active is null) then
    raise exception 'A target profile and at least one requested change are required'
      using errcode = '22023';
  end if;

  if target_profile_id = v_actor_id then
    raise exception 'Administrators cannot change their own role or account status'
      using errcode = '42501';
  end if;

  select p.*
  into v_target
  from public.profiles p
  where p.id = target_profile_id
  for update;

  if not found then
    raise exception 'The target profile does not exist'
      using errcode = 'P0002';
  end if;

  v_new_role := coalesce(requested_role, v_target.role);
  v_new_is_active := coalesce(requested_is_active, v_target.is_active);

  if v_target.role = 'admin'
     and v_target.is_active
     and (v_new_role <> 'admin' or not v_new_is_active) then
    select count(*)
    into v_active_admin_count
    from public.profiles p
    where p.role = 'admin'
      and p.is_active;

    if v_active_admin_count <= 1 then
      raise exception 'The last active administrator cannot be demoted or deactivated'
        using errcode = '23514';
    end if;
  end if;

  if v_new_role = v_target.role and v_new_is_active = v_target.is_active then
    return pg_catalog.jsonb_build_object(
      'profile_id', v_target.id,
      'role', v_target.role,
      'is_active', v_target.is_active
    );
  end if;

  perform pg_catalog.set_config('bachatbook.profile_access_operation', 'on', true);

  update public.profiles
  set role = v_new_role,
      is_active = v_new_is_active
  where id = v_target.id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, old_values, new_values
  )
  values (
    v_actor_id,
    'profile_access_updated',
    'profile',
    v_target.id,
    pg_catalog.jsonb_build_object(
      'role', v_target.role,
      'is_active', v_target.is_active
    ),
    pg_catalog.jsonb_build_object(
      'role', v_new_role,
      'is_active', v_new_is_active
    )
  );

  return pg_catalog.jsonb_build_object(
    'profile_id', v_target.id,
    'role', v_new_role,
    'is_active', v_new_is_active
  );
end;
$$;

comment on function public.update_user_access(uuid, public.user_role, boolean) is
  'Atomically changes another profile role or active status for an active admin and appends an audit log.';

-- The public function has no caller-supplied identity/email. It only accepts
-- the exact existing Neon Auth identity approved by the project owner, locates
-- exactly one matching application profile. Existing admins are marked during
-- migration; otherwise the first successful claim permanently disables setup.
create or replace function public.claim_initial_admin()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_auth_user_id constant text := '25c8d456-7a44-4cdf-b986-cb8c0798c99c';
  v_expected_email constant text := 'sanketfulzelek6@gmail.com';
  v_auth_user_id text := auth.user_id();
  v_profile_id uuid;
  v_matches bigint;
  v_old_role public.user_role;
  v_old_is_active boolean;
  v_old_auth_user_id text;
begin
  if v_auth_user_id is distinct from v_expected_auth_user_id then
    raise exception 'This Neon Auth account is not eligible for initial administrator setup'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(1701190064);

  if exists (select 1 from public.initial_admin_setup) then
    raise exception 'Initial administrator setup has already been completed'
      using errcode = '42501';
  end if;

  select count(*)
  into v_matches
  from public.profiles p
  where lower(p.email) = v_expected_email;

  if v_matches <> 1 then
    raise exception 'Expected exactly one existing application profile for the initial administrator'
      using errcode = 'P0002';
  end if;

  select p.id, p.role, p.is_active, p.auth_user_id
  into v_profile_id, v_old_role, v_old_is_active, v_old_auth_user_id
  from public.profiles p
  where lower(p.email) = v_expected_email
  for update;

  if exists (
    select 1
    from public.profiles p
    where p.auth_user_id = v_auth_user_id
      and p.id <> v_profile_id
  ) then
    raise exception 'This Neon Auth identity is already linked to another application profile'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.role = 'admin'
      and p.id <> v_profile_id
  ) then
    raise exception 'Initial administrator setup is disabled because an application administrator already exists'
      using errcode = '42501';
  end if;

  if v_old_auth_user_id = v_auth_user_id
     and v_old_role = 'admin'
     and v_old_is_active then
    insert into public.initial_admin_setup (singleton, profile_id, auth_user_id)
    values (true, v_profile_id, v_auth_user_id);
    return v_profile_id;
  end if;

  perform pg_catalog.set_config('bachatbook.profile_access_operation', 'on', true);

  update public.profiles
  set auth_user_id = v_auth_user_id,
      role = 'admin',
      is_active = true
  where id = v_profile_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, old_values, new_values
  )
  values (
    v_profile_id,
    'initial_admin_claimed',
    'profile',
    v_profile_id,
    pg_catalog.jsonb_build_object(
      'auth_user_id', v_old_auth_user_id,
      'role', v_old_role,
      'is_active', v_old_is_active
    ),
    pg_catalog.jsonb_build_object(
      'auth_user_id', v_auth_user_id,
      'role', 'admin',
      'is_active', true
    )
  );

  insert into public.initial_admin_setup (singleton, profile_id, auth_user_id)
  values (true, v_profile_id, v_auth_user_id);

  return v_profile_id;
end;
$$;

comment on function public.claim_initial_admin() is
  'One-time initial-admin setup bound to the configured existing Neon Auth user ID; accepts no identity or email parameters.';

revoke execute on function public.ensure_own_profile(text, text, text) from public;
revoke execute on function public.update_user_access(uuid, public.user_role, boolean) from public;
revoke execute on function public.claim_initial_admin() from public;

drop policy audit_logs_insert_admin on public.audit_logs;
revoke insert on public.audit_logs from authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.ensure_own_profile(text, text, text) to authenticated;
    grant execute on function public.update_user_access(uuid, public.user_role, boolean) to authenticated;
    grant execute on function public.claim_initial_admin() to authenticated;
  end if;
end
$$;

commit;
