-- ============================================================================
-- Bachify · Migration 00008 · Neon Auth profile provisioning
-- ----------------------------------------------------------------------------
-- A Neon Auth account and an application profile are separate records:
--
--   neon_auth.user   managed by Neon Auth (never modified here)
--   public.profiles  application-owned profile + role
--
-- The link is public.profiles.auth_user_id = auth.user_id(). This migration
-- adds a narrow, trusted self-provisioning path so a signed-in user can create
-- exactly one profile for themselves.
--
-- Security properties:
--   * The auth user id comes from the JWT (auth.user_id()), never a parameter.
--   * The role is hard-coded to 'member'. There is no role parameter.
--   * A second call returns the existing profile id; it never duplicates or
--     promotes a profile.
--   * EXECUTE is granted only to authenticated, not to anonymous or PUBLIC.
--   * Admins are still provisioned manually through a trusted database
--     connection (see docs/DATABASE_ARCHITECTURE.md).
-- ============================================================================

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
begin
  if v_auth_user_id is null or length(btrim(v_auth_user_id)) = 0 then
    raise exception 'A Neon Auth session is required to create a profile'
      using errcode = '42501';
  end if;

  if profile_full_name is null or length(btrim(profile_full_name)) = 0 then
    raise exception 'full_name is required'
      using errcode = '23514';
  end if;

  insert into public.profiles (auth_user_id, full_name, phone, email, role)
  values (
    v_auth_user_id,
    btrim(profile_full_name),
    nullif(btrim(profile_phone), ''),
    nullif(btrim(profile_email), ''),
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
  'Creates a member profile for the current Neon Auth user, or returns the existing profile id. Never grants admin.';

revoke execute on function public.ensure_own_profile(text, text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.ensure_own_profile(text, text, text) to authenticated;
  end if;
end
$$;
