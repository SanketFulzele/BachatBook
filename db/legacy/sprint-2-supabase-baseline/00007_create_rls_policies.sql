-- ============================================================================
-- Bachify · Migration 00007 · Row Level Security policies
-- ----------------------------------------------------------------------------
-- Access model
--
--   admin    full read of group, membership, cycle and financial records;
--            all writes; audit-log reads. Still cannot DELETE financial rows.
--   member   read own profile, own groups, shared member directory, schedules,
--            obligations, payments and payouts for those groups. No writes to
--            any operational table.
--   anon     no table grants and no policies: everything is denied.
--
-- Every policy targets `authenticated` explicitly and is backed by the
-- SECURITY DEFINER helpers in 00005, so role checks are never frontend-only.
-- There are deliberately no DELETE policies: financial history is immutable.
-- ============================================================================

-- profiles ------------------------------------------------------------------
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- No INSERT policy: profiles are provisioned by a trusted server-side process
-- (service role / SQL) after the auth user exists. No DELETE policy either.

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
-- Explicit table privileges (defence in depth, and required for a plain
-- PostgreSQL verification cluster where Supabase default grants are absent).
-- RLS still decides row visibility on top of these grants.
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

-- anon gets no table privileges at all.
revoke all on
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
from anon;

-- Financial history and audit logs are immutable at the privilege level too.
revoke update, delete on public.audit_logs from authenticated;
revoke delete on public.payments, public.payouts from authenticated;
