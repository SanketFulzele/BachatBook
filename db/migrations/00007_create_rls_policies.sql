-- ============================================================================
-- Bachify · Migration 00007 · Row Level Security policies
-- ----------------------------------------------------------------------------
-- Access model (Neon Data API + Neon Auth + PostgreSQL RLS)
--
--   admin      full read of group, membership, cycle and financial records;
--              all writes; audit-log reads. Still cannot DELETE anything.
--   member     read own profile, own groups, shared member directory,
--              schedules, obligations, payments and payouts for those groups.
--              No writes to any operational table.
--   anonymous  no table grants and no policies: everything is denied.
--
-- Identity: the Data API reads the JWT `role` claim and runs the request as
-- the `authenticated` PostgreSQL role. Row identity comes from auth.user_id()
-- (text `sub`), mapped through public.profiles.auth_user_id. Every policy
-- targets `authenticated` explicitly and is backed by the SECURITY DEFINER
-- helpers in 00005, so role checks are never frontend-only.
--
-- There are deliberately no DELETE policies: financial history is immutable.
--
-- Prerequisite: the `authenticated` role is created when the Neon Data API is
-- enabled on the branch. Enable the Data API before applying this migration.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception using
      message = 'Role "authenticated" does not exist.',
      detail = 'Enable the Neon Data API on this branch first; it creates the authenticated and anonymous roles.',
      hint = 'Neon Console → Postgres database → Data API → Enable Data API.';
  end if;
end
$$;

-- profiles ------------------------------------------------------------------
-- A user can read and update only their own profile. Role / active-status
-- changes are additionally blocked by the trigger in 00005.
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (auth_user_id = auth.user_id() or public.is_admin());

create policy profiles_update_own_or_admin
  on public.profiles
  for update
  to authenticated
  using (auth_user_id = auth.user_id() or public.is_admin())
  with check (auth_user_id = auth.user_id() or public.is_admin());

-- No INSERT policy: profiles are created by ensure_own_profile() (00008) or by
-- a trusted operator using the direct database connection. No DELETE policy.

-- bhishi_groups -------------------------------------------------------------
create policy bhishi_groups_select_accessible
  on public.bhishi_groups
  for select
  to authenticated
  using (public.can_access_group(id));

create policy bhishi_groups_insert_admin
  on public.bhishi_groups
  for insert
  to authenticated
  with check (public.is_admin());

create policy bhishi_groups_update_admin
  on public.bhishi_groups
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- members -------------------------------------------------------------------
create policy members_select_accessible
  on public.members
  for select
  to authenticated
  using (public.can_access_member(id));

create policy members_insert_admin
  on public.members
  for insert
  to authenticated
  with check (public.is_admin());

create policy members_update_admin
  on public.members
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- group_members -------------------------------------------------------------
create policy group_members_select_accessible
  on public.group_members
  for select
  to authenticated
  using (public.can_access_group(group_id));

create policy group_members_insert_admin
  on public.group_members
  for insert
  to authenticated
  with check (public.is_admin());

create policy group_members_update_admin
  on public.group_members
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- cycles --------------------------------------------------------------------
create policy cycles_select_accessible
  on public.cycles
  for select
  to authenticated
  using (public.can_access_cycle(id));

create policy cycles_insert_admin
  on public.cycles
  for insert
  to authenticated
  with check (public.is_admin());

create policy cycles_update_admin
  on public.cycles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- cycle_members -------------------------------------------------------------
create policy cycle_members_select_accessible
  on public.cycle_members
  for select
  to authenticated
  using (public.can_access_cycle(cycle_id));

create policy cycle_members_insert_admin
  on public.cycle_members
  for insert
  to authenticated
  with check (public.is_admin());

create policy cycle_members_update_admin
  on public.cycle_members
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- installments --------------------------------------------------------------
create policy installments_select_accessible
  on public.installments
  for select
  to authenticated
  using (public.can_access_cycle(cycle_id));

create policy installments_insert_admin
  on public.installments
  for insert
  to authenticated
  with check (public.is_admin());

create policy installments_update_admin
  on public.installments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- contribution_obligations --------------------------------------------------
create policy contribution_obligations_select_accessible
  on public.contribution_obligations
  for select
  to authenticated
  using (public.can_access_installment(installment_id));

create policy contribution_obligations_insert_admin
  on public.contribution_obligations
  for insert
  to authenticated
  with check (public.is_admin());

create policy contribution_obligations_update_admin
  on public.contribution_obligations
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- payments ------------------------------------------------------------------
create policy payments_select_accessible
  on public.payments
  for select
  to authenticated
  using (public.can_access_installment(installment_id));

create policy payments_insert_admin
  on public.payments
  for insert
  to authenticated
  with check (public.is_admin());

create policy payments_update_admin
  on public.payments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE policy: payments are voided, never removed.

-- payouts -------------------------------------------------------------------
create policy payouts_select_accessible
  on public.payouts
  for select
  to authenticated
  using (public.can_access_installment(installment_id));

create policy payouts_insert_admin
  on public.payouts
  for insert
  to authenticated
  with check (public.is_admin());

create policy payouts_update_admin
  on public.payouts
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE policy: payouts are voided, never removed.

-- audit_logs ----------------------------------------------------------------
create policy audit_logs_select_admin
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

create policy audit_logs_insert_admin
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_admin());

-- No UPDATE or DELETE policy: the audit trail is append-only.

-- ----------------------------------------------------------------------------
-- Explicit table privileges (defence in depth; also makes behaviour identical
-- whether or not the Neon Console "Grant public schema access" option was
-- used). RLS still decides row visibility on top of these grants.
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update on
  public.profiles,
  public.bhishi_groups,
  public.members,
  public.group_members,
  public.cycles,
  public.cycle_members,
  public.installments,
  public.contribution_obligations,
  public.payments,
  public.payouts
to authenticated;

grant select, insert on public.audit_logs to authenticated;

-- No DELETE on any application table, even if the Console granted it.
revoke delete on
  public.profiles,
  public.bhishi_groups,
  public.members,
  public.group_members,
  public.cycles,
  public.cycle_members,
  public.installments,
  public.contribution_obligations,
  public.payments,
  public.payouts,
  public.audit_logs
from authenticated;

-- Audit history is append-only at the privilege level too.
revoke update, delete on public.audit_logs from authenticated;

-- The anonymous role exists once the Data API is enabled. It gets no access.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anonymous') then
    execute 'revoke all on public.profiles, public.bhishi_groups, public.members,
      public.group_members, public.cycles, public.cycle_members, public.installments,
      public.contribution_obligations, public.payments, public.payouts,
      public.audit_logs from anonymous';
  end if;
end
$$;
