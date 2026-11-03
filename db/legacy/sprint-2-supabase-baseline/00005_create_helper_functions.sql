-- ============================================================================
-- Bachify · Migration 00005 · Helper functions and privilege guards
-- ----------------------------------------------------------------------------
-- Security model:
--   * The role comes from public.profiles, keyed by auth.uid(). A role supplied
--     by the client is never trusted.
--   * Helper functions are SECURITY DEFINER with an empty search_path so they
--     can read RLS-protected tables without triggering recursive policy checks.
--   * EXECUTE is revoked from PUBLIC and granted only to authenticated.
--   * auth.uid() is the only source of identity.
-- ============================================================================

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
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

comment on function public.is_admin() is
  'True when the current auth user has an active admin profile. Safe under RLS.';

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
      and m.profile_id = auth.uid()
  );
$$;

comment on function public.is_group_member(uuid) is
  'True when the current auth user is an active member of the given group.';

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
        and self_member.profile_id = auth.uid()
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
        and self_member.profile_id = auth.uid()
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
  'True when the current auth user may read the given group.';

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
  'True when the current auth user may read the given cycle.';

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
  'True when the current auth user may read the given installment.';

-- ----------------------------------------------------------------------------
-- Privilege guard: a member may edit their own contact details, but only an
-- admin may change role or is_active. RLS cannot compare columns, so a trigger
-- enforces it. Runs as definer so is_admin() is readable during the update.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not public.is_admin() then
    raise exception 'Only administrators may change a profile role or active status'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

comment on function public.enforce_profile_privilege_change() is
  'Blocks self-promotion or self-reactivation by non-admin users.';

create trigger profiles_enforce_privilege_change
  before update on public.profiles
  for each row execute function public.enforce_profile_privilege_change();

-- ----------------------------------------------------------------------------
-- Lock down function execution. Postgres grants EXECUTE to PUBLIC by default.
-- ----------------------------------------------------------------------------
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_group_member(uuid) from public;
revoke execute on function public.can_access_member(uuid) from public;
revoke execute on function public.can_access_group(uuid) from public;
revoke execute on function public.can_access_cycle(uuid) from public;
revoke execute on function public.can_access_installment(uuid) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.can_access_member(uuid) to authenticated;
grant execute on function public.can_access_group(uuid) to authenticated;
grant execute on function public.can_access_cycle(uuid) to authenticated;
grant execute on function public.can_access_installment(uuid) to authenticated;
