-- ============================================================================
-- Bachify · Migration 00003 · Financial tables
-- ----------------------------------------------------------------------------
-- installments            scheduled collection events for a cycle
-- contribution_obligations what each member owes for each installment
-- payments                money received from members
-- payouts                 money paid to the recipient of an installment
-- audit_logs              append-only administrative history
--
-- Integrity rules that matter most:
--   * payments must match an existing contribution obligation (composite FK),
--     so a payment can never reference a member/installment pair that does not
--     exist.
--   * payouts must match the installment's designated recipient (composite FK).
--   * at most one non-voided payout per installment (partial unique index).
--   * voiding requires an actor, timestamp and correction reason.
--   * no table is hard-deleted by application flows; RLS grants no DELETE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- installments
-- One collection event per month of the cycle. recipient_member_id is derived
-- from the chit number equal to the installment number (Sprint 6 generates it).
-- ----------------------------------------------------------------------------
create table public.installments (
  id                    uuid primary key default gen_random_uuid(),
  cycle_id              uuid not null references public.cycles (id) on delete restrict,
  installment_number    integer not null,
  scheduled_date        date not null,
  recipient_member_id   uuid references public.members (id) on delete restrict,
  expected_amount       numeric(12,2) not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint installments_unique_number unique (cycle_id, installment_number),
  -- Required by the composite foreign key on payouts (recipient match).
  constraint installments_unique_recipient unique (id, recipient_member_id),
  constraint installments_number_positive check (installment_number > 0),
  constraint installments_expected_amount_positive check (expected_amount > 0)
);

comment on table public.installments is
  'One scheduled collection event per month of a cycle, with its designated recipient.';

create trigger installments_set_updated_at
  before update on public.installments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- contribution_obligations
-- Every member has exactly one obligation for every installment, including the
-- member receiving that installment. Payment totals are compared to these rows
-- in Sprint 7; this is the source of truth for what is owed.
-- ----------------------------------------------------------------------------
create table public.contribution_obligations (
  id              uuid primary key default gen_random_uuid(),
  installment_id  uuid not null references public.installments (id) on delete restrict,
  member_id       uuid not null references public.members (id) on delete restrict,
  expected_amount numeric(12,2) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint contribution_obligations_unique_member unique (installment_id, member_id),
  constraint contribution_obligations_amount_positive check (expected_amount > 0)
);

comment on table public.contribution_obligations is
  'Amount each member is expected to contribute for each installment. Unique per (installment, member).';

create trigger contribution_obligations_set_updated_at
  before update on public.contribution_obligations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- payments
-- Individual contribution transactions. Multiple rows per member/installment
-- are allowed. Voiding is the only correction path: the row and its history are
-- preserved forever.
-- ----------------------------------------------------------------------------
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  installment_id    uuid not null,
  member_id         uuid not null,
  amount            numeric(12,2) not null,
  payment_date      date not null,
  payment_method    public.payment_method not null,
  reference_number  text,
  notes             text,
  recorded_by       uuid references public.profiles (id) on delete set null,
  is_voided         boolean not null default false,
  voided_at         timestamptz,
  voided_by         uuid references public.profiles (id) on delete set null,
  correction_reason text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Database-enforced link to the obligation. Also guarantees the installment
  -- and member both exist and belong together.
  constraint payments_obligation_fkey
    foreign key (installment_id, member_id)
    references public.contribution_obligations (installment_id, member_id)
    on delete restrict,
  constraint payments_amount_positive check (amount > 0),
  constraint payments_void_consistency check (
    (is_voided = false and voided_at is null and voided_by is null)
    or (
      is_voided = true
      and voided_at is not null
      and voided_by is not null
      and length(btrim(coalesce(correction_reason, ''))) > 0
    )
  )
);

comment on table public.payments is
  'Individual contribution transactions. Corrections are recorded by voiding, never by deleting.';

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- payouts
-- Money handed to the installment recipient, tracked separately from member
-- contributions. A voided payout keeps its history and allows a replacement.
-- ----------------------------------------------------------------------------
create table public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  installment_id      uuid not null,
  recipient_member_id uuid not null,
  amount              numeric(12,2) not null,
  payout_date         date not null,
  payment_method      public.payment_method not null,
  reference_number    text,
  notes               text,
  recorded_by         uuid references public.profiles (id) on delete set null,
  is_voided           boolean not null default false,
  voided_at           timestamptz,
  voided_by           uuid references public.profiles (id) on delete set null,
  correction_reason   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- Recipient is verified against the installment's designated recipient.
  constraint payouts_installment_recipient_fkey
    foreign key (installment_id, recipient_member_id)
    references public.installments (id, recipient_member_id)
    on delete restrict,
  constraint payouts_amount_positive check (amount > 0),
  constraint payouts_void_consistency check (
    (is_voided = false and voided_at is null and voided_by is null)
    or (
      is_voided = true
      and voided_at is not null
      and voided_by is not null
      and length(btrim(coalesce(correction_reason, ''))) > 0
    )
  )
);

comment on table public.payouts is
  'Recipient disbursements. At most one non-voided payout per installment; corrections are void + replace.';

create unique index payouts_one_valid_per_installment
  on public.payouts (installment_id)
  where is_voided = false;

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- audit_logs
-- Append-only. No updated_at by design. RLS exposes SELECT to administrators
-- only and never grants UPDATE or DELETE; those privileges are revoked too.
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  created_at  timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (length(btrim(action)) > 0),
  constraint audit_logs_entity_type_not_blank check (length(btrim(entity_type)) > 0)
);

comment on table public.audit_logs is
  'Append-only administrative activity history. Immutable through the application API.';
