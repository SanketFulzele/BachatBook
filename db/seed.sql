-- ============================================================================
-- Bachify · Development seed data
-- ----------------------------------------------------------------------------
-- Development only. Every person, phone number and transaction below is fake.
--
-- Reproducible: fixed UUIDs and fixed dates; re-running is a no-op thanks to
-- ON CONFLICT DO NOTHING. Safe to run multiple times against a local database.
--
-- Auth dependency: public.profiles is the application profile for a Neon Auth
-- user (profiles.auth_user_id). This seed deliberately does NOT create Neon
-- Auth users or profiles, so no fake login exists. Consequently every
-- auth-dependent column is left NULL:
--   bhishi_groups.created_by, members.profile_id, payments.recorded_by,
--   payouts.recorded_by and all audit_logs.actor_id values.
--
-- Link a member to a real profile later with:
--   update public.members set profile_id = '<profile uuid>' where id = '<member uuid>';
--
-- Usage:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Group
-- ---------------------------------------------------------------------------
insert into public.bhishi_groups (
  id, name, description, contribution_amount, collection_day, start_date, status
) values (
  '11111111-1111-4111-8111-111111111111',
  'Bachify Demo Group',
  'Sample group used for local development only. All members and amounts are fictional.',
  5000.00,
  12,
  '2026-01-12',
  'active'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Members (no login accounts)
-- ---------------------------------------------------------------------------
insert into public.members (id, full_name, phone, email) values
  ('22222222-2222-4222-8222-000000000001', 'Aarav Demo',  '9000000001', 'aarav.demo@example.com'),
  ('22222222-2222-4222-8222-000000000002', 'Bhavna Demo', '9000000002', 'bhavna.demo@example.com'),
  ('22222222-2222-4222-8222-000000000003', 'Chirag Demo', '9000000003', 'chirag.demo@example.com'),
  ('22222222-2222-4222-8222-000000000004', 'Diya Demo',   '9000000004', 'diya.demo@example.com'),
  ('22222222-2222-4222-8222-000000000005', 'Eshan Demo',  '9000000005', 'eshan.demo@example.com'),
  ('22222222-2222-4222-8222-000000000006', 'Farah Demo',  '9000000006', 'farah.demo@example.com'),
  ('22222222-2222-4222-8222-000000000007', 'Gaurav Demo', '9000000007', 'gaurav.demo@example.com'),
  ('22222222-2222-4222-8222-000000000008', 'Heena Demo',  '9000000008', 'heena.demo@example.com')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Group membership
-- ---------------------------------------------------------------------------
insert into public.group_members (id, group_id, member_id, status, joined_at)
select
  ('33333333-3333-4333-8333-00000000000' || n)::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  ('22222222-2222-4222-8222-00000000000' || n)::uuid,
  'active',
  '2026-01-01T09:00:00+05:30'::timestamptz
from generate_series(1, 8) as n
on conflict (group_id, member_id) do nothing;

-- ---------------------------------------------------------------------------
-- Cycle: 8 members, ₹5,000 each, collection on the 12th
-- ---------------------------------------------------------------------------
insert into public.cycles (
  id, group_id, name, start_date,
  contribution_amount_snapshot, collection_day_snapshot,
  total_members, duration_months, status
) values (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  'Demo Cycle 2026',
  '2026-01-12',
  5000.00,
  12,
  8,
  8,
  'active'
)
on conflict (id) do nothing;

-- Chit order: member 1 holds chit 1, member 2 holds chit 2, etc.
insert into public.cycle_members (id, cycle_id, member_id, chit_number)
select
  ('55555555-5555-4555-8555-00000000000' || n)::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  ('22222222-2222-4222-8222-00000000000' || n)::uuid,
  n
from generate_series(1, 8) as n
on conflict (cycle_id, member_id) do nothing;

-- ---------------------------------------------------------------------------
-- Installments: 12th of each month, recipient = member holding that chit
-- ---------------------------------------------------------------------------
insert into public.installments (
  id, cycle_id, installment_number, scheduled_date,
  recipient_member_id, expected_amount
)
select
  ('66666666-6666-4666-8666-00000000000' || n)::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  n,
  make_date(2026, n, 12),
  ('22222222-2222-4222-8222-00000000000' || n)::uuid,
  5000.00
from generate_series(1, 8) as n
on conflict (cycle_id, installment_number) do nothing;

-- ---------------------------------------------------------------------------
-- Contribution obligations: one per member per installment (64 rows).
-- Deterministic ids derived from installment + chit so re-runs are stable.
-- ---------------------------------------------------------------------------
insert into public.contribution_obligations (
  id, installment_id, member_id, expected_amount
)
select
  md5('obligation-' || i.installment_number || '-' || cm.chit_number)::uuid,
  i.id,
  cm.member_id,
  5000.00
from public.installments i
join public.cycle_members cm on cm.cycle_id = i.cycle_id
where i.cycle_id = '44444444-4444-4444-8444-444444444444'
on conflict (installment_id, member_id) do nothing;

-- ---------------------------------------------------------------------------
-- Sample payments for installment 1 (five full, one partial). Multiple
-- transactions for one member are allowed by design.
-- ---------------------------------------------------------------------------
insert into public.payments (
  id, installment_id, member_id, amount, payment_date, payment_method, reference_number
) values
  ('88888888-8888-4888-8888-000000000001',
   '66666666-6666-4666-8666-000000000001',
   '22222222-2222-4222-8222-000000000001',
   5000.00, '2026-01-10', 'upi', 'DEMO-UPI-0001'),
  ('88888888-8888-4888-8888-000000000002',
   '66666666-6666-4666-8666-000000000001',
   '22222222-2222-4222-8222-000000000002',
   5000.00, '2026-01-10', 'cash', null),
  ('88888888-8888-4888-8888-000000000003',
   '66666666-6666-4666-8666-000000000001',
   '22222222-2222-4222-8222-000000000003',
   5000.00, '2026-01-11', 'bank_transfer', 'DEMO-NEFT-0003'),
  ('88888888-8888-4888-8888-000000000004',
   '66666666-6666-4666-8666-000000000001',
   '22222222-2222-4222-8222-000000000004',
   5000.00, '2026-01-11', 'upi', 'DEMO-UPI-0004'),
  ('88888888-8888-4888-8888-000000000005',
   '66666666-6666-4666-8666-000000000001',
   '22222222-2222-4222-8222-000000000005',
   5000.00, '2026-01-12', 'upi', 'DEMO-UPI-0005'),
  ('88888888-8888-4888-8888-000000000006',
   '66666666-6666-4666-8666-000000000001',
   '22222222-2222-4222-8222-000000000006',
   2500.00, '2026-01-12', 'cash', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Sample payout for installment 1 to the chit-1 recipient.
-- ---------------------------------------------------------------------------
insert into public.payouts (
  id, installment_id, recipient_member_id, amount, payout_date, payment_method, reference_number
) values (
  '99999999-9999-4999-8999-999999999999',
  '66666666-6666-4666-8666-000000000001',
  '22222222-2222-4222-8222-000000000001',
  40000.00,
  '2026-01-13',
  'bank_transfer',
  'DEMO-PAYOUT-0001'
)
on conflict (id) do nothing;

commit;
