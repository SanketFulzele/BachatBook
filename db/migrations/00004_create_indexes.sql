-- ============================================================================
-- Bachify · Migration 00004 · Indexes
-- ----------------------------------------------------------------------------
-- Only indexes that are not already provided by a primary-key or unique
-- constraint are created here. For example group_members(group_id) is covered
-- by unique (group_id, member_id), and installments(cycle_id) by unique
-- (cycle_id, installment_number), so neither is duplicated.
-- ============================================================================

-- profiles ---------------------------------------------------------------
-- profiles(id) is the primary key and auth_user_id already has a unique
-- constraint (which creates its own index), so no additional identity index is
-- needed. Role lookups still benefit from a dedicated index.
create index profiles_role_idx on public.profiles (role);

-- members ----------------------------------------------------------------
-- A profile can be linked to at most one member record. The partial unique
-- index both enforces that rule and serves profile_id lookups.
create unique index members_profile_id_key
  on public.members (profile_id)
  where profile_id is not null;
create index members_phone_idx on public.members (phone);

-- group_members ----------------------------------------------------------
-- (group_id, member_id) unique already indexes group_id as the leading column.
create index group_members_member_id_idx on public.group_members (member_id);

-- cycles -----------------------------------------------------------------
create index cycles_group_id_idx on public.cycles (group_id);

-- cycle_members ----------------------------------------------------------
-- (cycle_id, member_id) unique already indexes cycle_id as the leading column.
create index cycle_members_member_id_idx on public.cycle_members (member_id);

-- installments -----------------------------------------------------------
-- (cycle_id, installment_number) unique already indexes cycle_id as leading.
create index installments_scheduled_date_idx on public.installments (scheduled_date);

-- contribution_obligations ----------------------------------------------
-- (installment_id, member_id) unique already indexes installment_id as leading.
create index contribution_obligations_member_id_idx
  on public.contribution_obligations (member_id);

-- payments ---------------------------------------------------------------
create index payments_installment_id_idx on public.payments (installment_id);
create index payments_member_id_idx on public.payments (member_id);
create index payments_payment_date_idx on public.payments (payment_date);

-- payouts ----------------------------------------------------------------
-- The partial unique index only covers non-voided payouts, so a plain index is
-- still needed to read the full correction history of an installment.
create index payouts_installment_id_idx on public.payouts (installment_id);

-- audit_logs -------------------------------------------------------------
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
