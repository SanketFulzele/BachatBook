-- ============================================================================
-- Bachify · Migration 00005 · Helper functions and privilege guards
-- ----------------------------------------------------------------------------
-- Security model:
--   * Identity comes only from the Neon Auth JWT. The Data API exposes the JWT
--     `sub` claim through auth.user_id() as text.
--   * public.profiles.auth_user_id is the unique mapping from that identity to
--     an application profile. The application role is read from profiles; a
--     role supplied by the client is never trusted.
--   * Helper functions are SECURITY DEFINER with an empty search_path so they
--     can read RLS-protected tables without triggering recursive policy checks.
--   * EXECUTE is revoked from PUBLIC and granted only to authenticated.
--
-- auth.user_id() is the supported Neon Data API identity function. It returns
-- text, so no UUID assumption is made about Neon Auth user ids.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- current_profile_id(): map the current Neon Auth user to the application
-- profile. Returns NULL for an unknown or deactivated user.
-- ----------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.user_id()
    and p.is_active = true;
$$;

comment on function public.current_profile_id() is
  'Application profile id for the current Neon Auth user (auth.user_id()), or NULL.';

-- ----------------------------------------------------------------------------
-- is_admin(): is the current authenticated user an active administrator?
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = public.current_profile_id()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

comment on function public.is_admin() is
  'True when the current Neon Auth user has an active admin profile. Safe under RLS.';

-- ----------------------------------------------------------------------------
-- is_group_member(group_id): does the current user belong to this group?
-- Membership is verified through the member.profile_id link, never through a
-- client-supplied member id.
-- ----------------------------------------------------------------------------
create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    join public.members m on m.id = gm.member_id
    where gm.group_id = target_group_id
      and gm.status = 'active'
      and m.is_active = true
      and m.profile_id = public.current_profile_id()
  );
$$;

comment on function public.is_group_member(uuid) is
  'True when the current Neon Auth user is an active member of the given group.';

-- ----------------------------------------------------------------------------
-- can_access_member(member_id): self, shared-group member, or admin.
-- Used for member directory reads; never for financial writes.
-- ----------------------------------------------------------------------------
create or replace function public.can_access_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.members self_member
      where self_member.id = target_member_id
        and self_member.profile_id = public.current_profile_id()
    )
    or exists (
      select 1
      from public.group_members target_membership
      join public.group_members self_membership
        on self_membership.group_id = target_membership.group_id
      join public.members self_member
        on self_member.id = self_membership.member_id
      where target_membership.member_id = target_member_id
        and target_membership.status = 'active'
        and self_membership.status = 'active'
        and self_member.profile_id = public.current_profile_id()
    );
$$;

comment on function public.can_access_member(uuid) is
  'True for the member itself, a member of a shared active group, or an admin.';

-- ----------------------------------------------------------------------------
-- can_access_group(group_id): admins see every group, members only their own.
-- ----------------------------------------------------------------------------
create or replace function public.can_access_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or public.is_group_member(target_group_id);
$$;

comment on function public.can_access_group(uuid) is
  'True when the current Neon Auth user may read the given group.';

-- ----------------------------------------------------------------------------
-- can_access_cycle(cycle_id): access follows the owning group.
-- ----------------------------------------------------------------------------
create or replace function public.can_access_cycle(target_cycle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.cycles c
      where c.id = target_cycle_id
        and public.is_group_member(c.group_id)
    );
$$;

comment on function public.can_access_cycle(uuid) is
  'True when the current Neon Auth user may read the given cycle.';

-- ----------------------------------------------------------------------------
-- can_access_installment(installment_id): access follows installment → cycle
-- → group. Financial read policies reuse this function.
-- ----------------------------------------------------------------------------
create or replace function public.can_access_installment(target_installment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.installments i
      join public.cycles c on c.id = i.cycle_id
      where i.id = target_installment_id
        and public.is_group_member(c.group_id)
    );
$$;

comment on function public.can_access_installment(uuid) is
  'True when the current Neon Auth user may read the given installment.';

-- ----------------------------------------------------------------------------
-- Privilege guard:
--   * id and auth_user_id are immutable. Relinking a profile to another Neon
--     Auth user is a trusted database operation, not a client update.
--   * A member may edit their own contact details, but only an admin may
--     change role or is_active. RLS cannot compare columns, so a trigger
--     enforces it. Runs as definer so is_admin() is readable during the update.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'Profile id and auth_user_id are immutable'
      using errcode = '42501';
  end if;

  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not public.is_admin() then
    raise exception 'Only administrators may change a profile role or active status'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

comment on function public.enforce_profile_privilege_change() is
  'Blocks identity changes and self-promotion or self-reactivation by non-admin users.';

create trigger profiles_enforce_privilege_change
  before update on public.profiles
  for each row execute function public.enforce_profile_privilege_change();

-- ----------------------------------------------------------------------------
-- Lock down function execution. Postgres grants EXECUTE to PUBLIC by default.
-- The authenticated role is created by the Neon Data API; guard the grants so
-- the migration can also be syntax-checked on a bare PostgreSQL instance.
-- ----------------------------------------------------------------------------
revoke execute on function public.current_profile_id() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_group_member(uuid) from public;
revoke execute on function public.can_access_member(uuid) from public;
revoke execute on function public.can_access_group(uuid) from public;
revoke execute on function public.can_access_cycle(uuid) from public;
revoke execute on function public.can_access_installment(uuid) from public;
revoke execute on function public.enforce_profile_privilege_change() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.current_profile_id() to authenticated;
    grant execute on function public.is_admin() to authenticated;
    grant execute on function public.is_group_member(uuid) to authenticated;
    grant execute on function public.can_access_member(uuid) to authenticated;
    grant execute on function public.can_access_group(uuid) to authenticated;
    grant execute on function public.can_access_cycle(uuid) to authenticated;
    grant execute on function public.can_access_installment(uuid) to authenticated;
  end if;
end
$$;
