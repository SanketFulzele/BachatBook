# Bachat Book — Database Architecture (Neon)

> Sprint 2 deliverable, migrated from Supabase to **Neon PostgreSQL + Managed Better Auth + Data API**.
> Describes the PostgreSQL schema, financial integrity rules, RLS access model, identity mapping,
> migration workflow and trusted administrator provisioning.
>
> **Status:** the hosted Neon project **BachatBook** is provisioned (production branch active) with Neon
> Auth and the Data API enabled. Migrations `00001`–`00016` have been applied to that branch
> (00011–00016 on 2026-11-08). The hosted schema has all 11 application tables plus
> `initial_admin_setup` under the RLS/privilege model, 30 policies, zero `DELETE` policies, and all
> workflow functions granted to `authenticated` only. Hosted schema structure and the deployed
> signup/role-management and add-registered-members behaviour were verified with 18 + 32 rollback-only
> checks (no test data committed). Authenticated behaviour through a real browser session is still
> pending. See [Verification](#15-verification) and [Known limitations](#16-known-limitations).

---

## 1. Principles

1. **Financial history is append-only.** Payments and payouts are voided with an actor, timestamp and
   reason. They are never hard-deleted, and no RLS policy or table privilege grants `DELETE`.
2. **Money is exact.** Every monetary column is `NUMERIC(12,2)`. Floats are never used.
3. **Snapshots beat back-filling.** A cycle stores its own contribution amount and collection day, so a
   later group edit cannot silently rewrite history.
4. **The database is the authority.** Role checks, obligation matching, recipient matching and the
   one-payout-per-installment rule are enforced in PostgreSQL, not in React.
5. **Identity is optional for members.** A member can exist without a login; `members.profile_id` is
   nullable.
6. **Destructive deletes are refused.** Historical relationships use `ON DELETE RESTRICT`. Groups are
   archived; members are deactivated; membership is marked `removed`.
7. **One source of truth for roles.** `public.profiles.role` is read through the authenticated identity;
   the client never supplies a role.
8. **Managed auth stays managed.** Neon owns the `neon_auth` schema. Application migrations never create,
   alter or write to it; they only read the JWT identity through `auth.user_id()`.

---

## 2. Runtime architecture

```text
React 19 + Vite
      │
      │  src/lib/neon/client.ts  (one shared @neon/neon-js client)
      ├──────────────► Neon Managed Better Auth
      │                    │  users/sessions in the managed neon_auth schema
      │                    │  JWT: sub = auth user id, role = authenticated
      │                    ▼
      └──────────────► Neon Data API (PostgREST)
                           │  PostgreSQL role: authenticated / anonymous
                           ▼
                     Row Level Security
                           │
                           ▼
                     public schema (11 application tables)
```

- The browser receives only the Auth URL and the Data API URL. It never receives `DATABASE_URL`.
- The Data API reads the database role from the JWT claim, not from an application header.
- One shared `createClient()` instance owns both Auth and Data API state, so the Data API automatically
  receives the JWT issued by the Auth client.
- Financial workflows that touch several rows (record payment + audit entry, generate installments and
  obligations) use PostgreSQL functions called with `.rpc()`. They run in one transaction; the
  browser never orchestrates partial financial writes.

---

## 3. Directory layout

```text
db/
├── migrations/
│   ├── 00001_create_enums.sql
│   ├── 00002_create_core_tables.sql
│   ├── 00003_create_financial_tables.sql
│   ├── 00004_create_indexes.sql
│   ├── 00005_create_helper_functions.sql
│   ├── 00006_enable_rls.sql
│   ├── 00007_create_rls_policies.sql
│   ├── 00008_add_neon_auth_profile_provisioning.sql
│   ├── 00009_add_cycle_activation.sql
│   ├── 00010_add_cycle_drafts.sql
│   ├── 00011_collection_day_due_dates.sql
│   ├── 00012_secure_payment_operations.sql
│   ├── 00013_secure_payout_operations.sql
│   ├── 00014_auth_signup_and_role_management.sql
│   ├── 00015_add_profiles_to_group.sql
│   ├── 00016_recipient_excluded_contribution_logic.sql
│   └── README.md
├── legacy/
│   └── sprint-2-supabase-baseline/   # archived original files; never apply
└── seed.sql                          # deterministic, development-only sample data

neon.ts                               # declarative Auth + Data API services (not applied)
scripts/generate-types.mjs            # official Neon type generator wrapper
```

---

## 4. Enumerated types

| Type                       | Values                                      | Used by                |
| -------------------------- | ------------------------------------------- | ---------------------- |
| `public.user_role`         | `admin`, `member`                           | `profiles.role`        |
| `public.group_status`      | `draft`, `active`, `completed`, `archived`  | `bhishi_groups.status` |
| `public.cycle_status`      | `draft`, `active`, `completed`, `cancelled` | `cycles.status`        |
| `public.membership_status` | `active`, `inactive`, `removed`             | `group_members.status` |
| `public.payment_method`    | `cash`, `upi`, `bank_transfer`, `other`     | `payments`, `payouts`  |

All values are lowercase snake_case so they map directly to TypeScript string unions.

---

## 5. Tables

### `profiles` — application identity for a Neon Auth user

| Column                     | Type          | Rules                                              |
| -------------------------- | ------------- | -------------------------------------------------- |
| `id`                       | `uuid`        | PK, default `gen_random_uuid()`, immutable         |
| `auth_user_id`             | `text`        | not null, not blank, **unique**, immutable         |
| `full_name`                | `text`        | not null, not blank                                |
| `phone`                    | `text`        | nullable                                           |
| `email`                    | `text`        | nullable                                           |
| `role`                     | `user_role`   | not null, default `member`; only admins may change |
| `is_active`                | `boolean`     | not null, default `true`; only admins may change   |
| `created_at`, `updated_at` | `timestamptz` | not null, default `now()`; `updated_at` by trigger |

**Identity mapping.** `auth_user_id` stores the Neon Auth JWT `sub` verbatim as text. It is not assumed
to be a UUID, and it is deliberately **not** a foreign key into the managed `neon_auth` schema. The
unique constraint gives a safe one-to-one mapping between a Neon Auth user and an application profile
while keeping profile ids independent. Relinking a profile to another auth user is a trusted operator
action, not a client update.

**Immutability.** The `profiles_enforce_privilege_change` trigger (migration 00014) rejects changes to
`id`, `auth_user_id`, `role` and `is_active` outside trusted database operations. Authenticated Data API
users can update only their own `full_name` and `phone` columns; admins use the role/access RPC.

### `bhishi_groups` — group settings

`id`, `name` (not blank), `description`, `contribution_amount` (`NUMERIC(12,2)` > 0),
`collection_day` (1–31, default 12), `start_date`, `status`, `created_by` (FK → profiles, `SET NULL`),
timestamps.

### `members` — a person, with or without a login

`id`, `full_name` (not blank), `phone`, `email`, `profile_id` (nullable FK → profiles, `SET NULL`),
`is_active`, timestamps. A partial unique index allows **at most one member row per profile**.

### `group_members` — membership join table

`id`, `group_id` (FK, `RESTRICT`), `member_id` (FK, `RESTRICT`), `joined_at`, `status`.
Unique `(group_id, member_id)`.

### `cycles` — one savings rotation

`id`, `group_id` (FK, `RESTRICT`), `name`, `start_date`, `contribution_amount_snapshot`
(`NUMERIC(12,2)` > 0), `collection_day_snapshot` (1–31), `total_members` (> 0),
`duration_months` (> 0), `status`, timestamps.

The snapshots are deliberately independent of `bhishi_groups`. Editing a group never changes an
existing cycle.

### `cycle_members` — chit order inside a cycle

`id`, `cycle_id` (FK, `RESTRICT`), `member_id` (FK, `RESTRICT`), `chit_number` (> 0), `created_at`.
Unique `(cycle_id, member_id)` and unique `(cycle_id, chit_number)`. A new cycle gets a fresh order;
old rows are untouched.

### `installments` — scheduled collection events

`id`, `cycle_id` (FK, `RESTRICT`), `installment_number` (> 0), `scheduled_date` (cycle month plus
the saved collection day, clamped to that month's final day),
`recipient_member_id` (nullable FK → members), `expected_amount` (`NUMERIC(12,2)` > 0), timestamps.
Unique `(cycle_id, installment_number)`.

An additional unique `(id, recipient_member_id)` exists solely so that `payouts` can enforce the
recipient through a composite foreign key.

### `contribution_obligations` — what every member owes for every installment

`id`, `installment_id` (FK, `RESTRICT`), `member_id` (FK, `RESTRICT`), `expected_amount`
(`NUMERIC(12,2)` > 0), timestamps. Unique `(installment_id, member_id)`.

Every member — including the recipient of that installment — has one obligation per installment.
This table is the basis for outstanding-balance calculations and payment-derived status.

### `payments` — money received

`id`, `installment_id`, `member_id`, `amount` (`NUMERIC(12,2)` > 0), `payment_date`,
`payment_method`, `reference_number`, `notes`, `recorded_by` (FK → profiles, `SET NULL`),
`is_voided`, `voided_at`, `voided_by`, `correction_reason`, timestamps.

Integrity:

- Composite FK `(installment_id, member_id)` → `contribution_obligations(installment_id, member_id)`
  `ON DELETE RESTRICT`. A payment cannot exist without a matching obligation, and the pair must
  belong together.
- `payments_void_consistency`: a voided row must have `voided_at`, `voided_by` and a non-blank
  `correction_reason`; a non-voided row must have all three null.
- Multiple payments per member/installment are allowed.
- There is **no stored payment status**. Paid/Pending and outstanding amounts are derived from valid
  (non-voided) payment totals against the expected contribution.

### `payouts` — money paid to the installment recipient

Same columns as `payments`, with `recipient_member_id` instead of `member_id`.

Integrity:

- Composite FK `(installment_id, recipient_member_id)` →
  `installments(id, recipient_member_id)` `ON DELETE RESTRICT`. A payout can only go to the
  installment's designated recipient.
- Partial unique index `payouts_one_valid_per_installment` on `(installment_id)`
  `WHERE is_voided = false`: at most one valid payout per installment. A correction voids the old
  row and inserts a replacement.
- Same void-consistency constraint as `payments`.

### `audit_logs` — append-only administrative history

`id`, `actor_id` (FK → profiles, `SET NULL`), `action`, `entity_type`, `entity_id`, `old_values`
(`jsonb`), `new_values` (`jsonb`), `created_at`. No `updated_at` column by design.

RLS allows administrators to `SELECT`. Client `INSERT`, `UPDATE` and `DELETE` are revoked; trusted
database functions append audit records atomically with the operation.

---

## 6. Relationships

```text
neon_auth.user 1 ─── 0..1 profiles        (text mapping: profiles.auth_user_id = JWT sub; no FK)
profiles       1 ─── 0..* members         (members.profile_id, nullable)
profiles       1 ─── 0..* bhishi_groups   (created_by, nullable)
profiles       1 ─── 0..* payments        (recorded_by / voided_by, nullable)
profiles       1 ─── 0..* payouts         (recorded_by / voided_by, nullable)
profiles       1 ─── 0..* audit_logs      (actor_id, nullable)

bhishi_groups 1 ─── 0..* group_members ─── 1 members
bhishi_groups 1 ─── 0..* cycles
cycles        1 ─── 0..* cycle_members ─── 1 members
cycles        1 ─── 0..* installments
installments  1 ─── 0..* contribution_obligations ─── 1 members
installments  1 ─── 0..* payments
installments  1 ─── 0..1 valid payout (+ any number of voided payouts)
installments  0..1 ─── 1 members          (recipient_member_id)
```

Delivery order of migrations: enums → core tables → financial tables → indexes → helpers →
enable RLS → policies → profile provisioning.

---

## 7. Financial data structure

1. **Group** defines the default contribution amount and collection day.
2. **Cycle** snapshots those values and fixes the member count and duration.
3. **`cycle_members`** records each member's chit number for that cycle only.
4. **`installments`** creates one dated collection per month; installment _N_ is assigned to the
   member holding chit _N_.
5. **`contribution_obligations`** creates one expected amount per member per installment.
6. **`payments`** records actual money received against those obligations. Shortfalls and overpayments
   are derived, never stored.
7. **`payouts`** records the disbursement to the recipient, separately from contributions.

A member's outstanding balance is always computed as:

```text
GREATEST(
  obligation.expected_amount - COALESCE(SUM(non-voided payment amounts for that obligation), 0),
  0
)
```

The `GREATEST(..., 0)` prevents a negative balance when a member has overpaid. Overpayment is kept as
payment history, not as a stored credit. No status columns or pre-computed balances exist, so reports
cannot drift away from the ledger.

---

## 8. Indexes

Created in `00004_create_indexes.sql` (14 targeted indexes). Redundant indexes are deliberately avoided
when a primary-key or unique constraint already provides the required access path.

| Index                                                   | Purpose                                               |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `profiles_role_idx`                                     | role checks / admin listings                          |
| `members_profile_id_key` (partial unique)               | profile ↔ member lookup, one member per profile       |
| `members_phone_idx`                                     | contact search                                        |
| `group_members_member_id_idx`                           | memberships by member (`group_id` covered by unique)  |
| `cycles_group_id_idx`                                   | cycles by group                                       |
| `cycle_members_member_id_idx`                           | chit history by member (`cycle_id` covered by unique) |
| `installments_scheduled_date_idx`                       | upcoming collections (`cycle_id` covered by unique)   |
| `contribution_obligations_member_id_idx`                | obligations by member (`installment_id` covered)      |
| `payments_installment_id_idx`, `payments_member_id_idx` | ledger lookups                                        |
| `payments_payment_date_idx`                             | date-range reporting                                  |
| `payouts_installment_id_idx`                            | full payout history (voided included)                 |
| `audit_logs_actor_id_idx`, `audit_logs_created_at_idx`  | actor and recency queries                             |

`profiles.auth_user_id` is covered by its unique constraint; no extra identity index is needed.

---

## 9. Row Level Security

RLS is enabled on all 11 application tables. Policies target the Data API `authenticated` role only;
`anonymous` has no table privileges and no policies. The default answer is **deny**.

`00007_create_rls_policies.sql` raises an exception when the `authenticated` role is missing, because
that role is created only when the Neon Data API is enabled on the branch. Enable the Data API **before**
applying the migrations.

### 9.1 Identity helpers

All helpers are `SECURITY DEFINER`, `STABLE`, with `set search_path = ''`. `EXECUTE` is revoked from
`PUBLIC` and granted only to `authenticated`.

| Function                                 | Returns true when                                               |
| ---------------------------------------- | --------------------------------------------------------------- |
| `current_profile_id()`                   | maps `auth.user_id()` to an active `profiles` row, else `NULL`  |
| `is_admin()`                             | the current profile has role `admin` and is active              |
| `is_group_member(group_id)`              | the current profile is linked to an active member in that group |
| `can_access_member(member_id)`           | admin, self, or member of a shared active group                 |
| `can_access_group(group_id)`             | admin or active member of the group                             |
| `can_access_cycle(cycle_id)`             | admin or member of the cycle's group                            |
| `can_access_installment(installment_id)` | admin or member of the installment's cycle group                |

`auth.user_id()` returns **text**, so no UUID cast is applied to a Neon Auth id. `current_profile_id()`
is the single place where the JWT `sub` is joined to `profiles.auth_user_id`.

`enforce_profile_privilege_change()` is a `BEFORE UPDATE` trigger on `profiles`. It rejects direct
changes to `role`, `is_active`, `id` or `auth_user_id`; only the security-definer access operations can
make these changes.

### 9.2 Access matrix

| Table                      | anonymous | member                             | admin                                      |
| -------------------------- | --------- | ---------------------------------- | ------------------------------------------ |
| `profiles`                 | —         | select own; update own name/phone  | select all; own name/phone plus access RPC |
| `bhishi_groups`            | —         | select own groups                  | select all; insert; update                 |
| `members`                  | —         | select self + shared-group members | select all; insert; update                 |
| `group_members`            | —         | select own groups                  | select all; insert; update                 |
| `cycles`                   | —         | select own groups' cycles          | select all; insert; update                 |
| `cycle_members`            | —         | select own groups' orders          | select all; insert; update                 |
| `installments`             | —         | select own groups' schedule        | select all; insert; update                 |
| `contribution_obligations` | —         | select own groups' obligations     | select all; insert; update                 |
| `payments`                 | —         | select own transactions            | select all; record / void through RPC      |
| `payouts`                  | —         | select own groups' payouts         | select all; record / void through RPC      |
| `audit_logs`               | —         | —                                  | select; trusted function inserts           |

**No table has a `DELETE` policy.** `authenticated` also has no `DELETE` table privilege anywhere.
`audit_logs` has no `UPDATE` privilege or policy either. The migration also revokes all privileges on
every application table from `anonymous` if that role exists.

### 9.3 Profile provisioning and signup

`00014_auth_signup_and_role_management.sql` replaces the original function from migration 00008:

```sql
public.ensure_own_profile(profile_full_name text, profile_phone text default null, profile_email text default null)
returns uuid
```

- Reads the identity from `auth.user_id()`, never from a parameter.
- Inserts a profile with `role = 'member'` hard-coded. There is no role parameter.
- Requires a name and email, returns the same profile id on a second call, and refuses conflicting
  email-to-identity links.
- Is `SECURITY DEFINER`, revoked from `PUBLIC`, and granted only to `authenticated`.

The website's public signup uses Managed Better Auth. When a session exists, the app calls this function
immediately; if email verification is configured, it runs when the verified session is first restored.
There remains no `INSERT` policy on `profiles`, and signup can create members only.

### 9.4 Admin access and initial setup

`public.update_user_access(profile_id, role, is_active)` is the only authenticated role/status writer.
It verifies the caller through `current_profile_id()` and `is_admin()`, rejects self-changes, locks
competing changes, protects the last active admin, and appends the previous/new values and acting
profile to `audit_logs`. Direct profile updates are limited to own `full_name` and `phone`; audit log
inserts are unavailable to Data API clients.

`public.claim_initial_admin()` accepts no parameters and is bound in SQL to the existing owner-supplied
Neon Auth subject and existing profile email. It links and activates the existing profile without
changing its UUID or contact information. A private RLS-enabled completion-marker table permanently
disables the operation once used. It also refuses the claim if any other application admin exists or the
matching profile is ambiguous.

The web page is only the user interface for these operations; RLS and function checks remain
authoritative. The initial-admin claim requires migration 00014 to be applied and the exact existing
profile to be present in the hosted database.

### 9.5 Cycle activation

`00009_add_cycle_activation.sql` adds one write workflow:

```sql
public.activate_cycle(
  target_group_id uuid,
  cycle_name text,
  cycle_start_date date,
  chit_order jsonb
) returns uuid
```

- Admin-only, checked with `public.is_admin()` inside the function; `EXECUTE` is revoked from `PUBLIC` and
  granted only to `authenticated`.
- Validates that the group is not archived, has no other active cycle, and that the JSON chit order covers
  exactly the active members with distinct numbers.
- Copies the group's contribution amount and collection day into the new cycle, creates `cycle_members`,
  one monthly `installments` row per chit number, and one `contribution_obligations` row per member per
  installment.
- Marks the group `active` and appends an `audit_logs` entry, all in the same transaction.
- Login-to-member uniqueness was already enforced by `members_profile_id_key` from `00004`; `00009` does
  not add a duplicate index.

### 9.6 Cycle drafts and manual chit order

`00010_add_cycle_drafts.sql` adds the Sprint 5 workflow. It changes no table; every rule lives in
functions and partial unique indexes.

```sql
create unique index cycles_one_active_per_group on public.cycles (group_id)
  where status = 'active';

create unique index cycles_one_draft_per_group on public.cycles (group_id)
  where status = 'draft';

public.create_cycle_draft(
  target_group_id uuid,
  cycle_name text,
  cycle_start_date date,
  contribution_amount numeric,
  collection_day integer
) returns uuid

public.set_cycle_chit_order(target_cycle_id uuid, chit_order jsonb) returns void

public.activate_cycle_draft(target_cycle_id uuid) returns uuid
```

- `create_cycle_draft` is admin-only, locks the group, rejects archived groups, duplicate active/draft
  cycles, invalid input and fewer than two active members. It stores the contribution and collection-day
  snapshots, sets `total_members`/`duration_months` to the active-member count and inserts every active
  member with a deterministic provisional chit order (alphabetical).
- `set_cycle_chit_order` is admin-only and works only while the cycle is a `draft`. The JSON array must
  cover exactly the participating members, with unique member ids and chit numbers running 1..N. The
  function first offsets existing chit numbers by 1,000,000 and then writes the new order, so the unique
  `(cycle_id, chit_number)` constraint is never violated mid-save. It appends a
  `cycle.chit_order_updated` audit row.
- `activate_cycle_draft` is admin-only. It locks the group then the cycle, re-validates draft status, no
  other active cycle, all participating members still active and a complete 1..N order, then inserts one
  installment per month from the cycle snapshots (including the saved collection day) and one obligation
  per member per installment. It marks
  the cycle and group active and appends a `cycle.activated` audit row, all in one transaction.
- `create_cycle_draft` appends a `cycle.draft_created` audit row. There is no delete or discard path.
- The older `activate_cycle(...)` remains for backward compatibility; migration `00011` updates its due
  date calculation as well. The app uses `activate_cycle_draft(...)`.

Draft cycles are ordinary `cycles` rows, so RLS lets group members read them. The client hides drafts from
member "current cycle" views; the admin group screen exposes `draftCycle` and the ordering editor.

### 9.7 Why members cannot write financially

Member policies exist only for `SELECT`. There is no INSERT/UPDATE/DELETE policy for members on groups,
memberships, cycles, installments, obligations, payments or payouts. The database — not the React route
guard — rejects the write. This was exercised with simulated member, outsider and admin identities; see
[Verification](#15-verification).

### 9.8 Payment recording and correction

`00012_secure_payment_operations.sql` adds the trusted payment write path:

```sql
public.record_payment(
  target_obligation_id uuid,
  payment_amount numeric,
  target_payment_date date,
  target_payment_method public.payment_method,
  payment_reference text default null,
  payment_notes text default null
) returns uuid

public.void_payment(target_payment_id uuid, void_reason text) returns uuid
```

- Both functions are `SECURITY DEFINER`, check `public.is_admin()` and are executable only by
  `authenticated` users. The browser does not pass an actor/profile id.
- `record_payment` locks the obligation before summing valid payments. Concurrent partial payments
  serialize on that row; non-positive, over-precision and excessive amounts are rejected, as are totals
  exceeding the outstanding balance. Supported new entries are Cash, UPI and Bank Transfer.
- `void_payment` locks the payment and obligation, requires a non-blank reason, and records
  `voided_at`/`voided_by` without deleting or changing the original transaction amount.
- Both operations add an audit row in the same transaction. An error rolls back both the ledger change
  and its audit entry.
- Direct `INSERT` and `UPDATE` privileges on `payments` are revoked from `authenticated`; RPCs are the
  only Data API write path. Existing RLS policies remain an additional boundary.
- `payments_select_own_or_admin` lets members read only transactions whose `member_id` is linked to their
  own profile. Administrators retain full payment history.
- Payment status remains derived from non-voided amounts; a partial total is Pending and outstanding is
  `GREATEST(expected_amount - SUM(valid_payments), 0)`.

### 9.9 Payout recording and correction

`00013_secure_payout_operations.sql` adds the trusted payout write path:

```sql
public.record_payout(
  target_installment_id uuid,
  payout_amount numeric,
  target_payout_date date,
  target_payment_method public.payment_method,
  payout_notes text default null
) returns uuid

public.void_payout(target_payout_id uuid, void_reason text) returns uuid
```

- Both functions are `SECURITY DEFINER`, check `public.is_admin()` and are executable only by
  `authenticated` users. The browser does not pass a recipient or actor/profile id.
- `record_payout` locks the installment, derives the recipient from its saved schedule, validates the
  positive two-decimal amount/date/method, and appends the payout and audit entry in one transaction.
  The existing partial unique index prevents more than one active payout for an installment.
- `void_payout` preserves the payout, requires a reason, records the actor and timestamp, and writes an
  audit entry in the same transaction. A replacement is a new payout row after the old one is voided.
- Direct `INSERT` and `UPDATE` privileges on `payouts` are revoked from `authenticated`; RLS continues to
  govern member reads and the RPCs are the only Data API write path.
- The recorded amount is independent of expected collection. Voided payouts are excluded from schedule
  status and totals; no fees or automatic calculations are applied.

### 9.10 Adding registered members to a group

`00015_add_profiles_to_group.sql` adds the trusted Add-Member workflow:

```sql
public.add_profiles_to_group(
  target_group_id uuid,
  target_profile_ids uuid[]
) returns integer
```

- Requires an active administrator via `public.current_profile_id()` and `public.is_admin()`; `EXECUTE`
  is revoked from `PUBLIC` and granted only to `authenticated`.
- Rejects a missing or archived group, and any profile that is missing or has `is_active = false`.
  The profile row is locked early in the transaction.
- For each target profile, reuses the existing `public.members` row linked via `profile_id`; when none
  exists, inserts one from the profile's `full_name`, `email` and `phone`. No new Auth account or
  duplicate profile is created.
- Inserts into `public.group_members` idempotently with `on conflict (group_id, member_id) do nothing`.
  The count of newly added memberships is returned and one `group_members_added` audit row is written
  only when at least one membership is applied.
- The Add Member dialog replaces the old manual name/phone/email entry form: the admin searches
  registered users by name or email and multi-selects eligible profiles; already-in-group and inactive
  users are excluded client-side. The frontend calls the RPC and invalidates the Bhishi snapshot.

### 9.11 Recipient-excluded contribution model

`00016_recipient_excluded_contribution_logic.sql` replaces both cycle-activation functions and the
`record_payout()` function:

- When a cycle is activated, each installment's recipient (taken from the saved chit order) is excluded
  from that installment's `contribution_obligations`. Contributions are owed by the other participating
  members only, each for the configured contribution amount. Installments carry
  `contribution_amount × (total_members − 1)` as their `expected_amount`.
- `record_payout()` now refuses to record a payout while any obligation for that installment remains
  outstanding. It computes the expected total and the collected total from obligations and non-voided
  payments under row-level locks, and writes the expected/collected totals into the payout audit row.
  This is permanently enforced at the database; admins still enter the actual payout date and amount.
- Historical obligations and payments are untouched. Groups with no cycles are unaffected; if a live
  pending cycle existed, it would need a reviewed, separate recalculation decision before activation —
  not an automatic rewrite.

---

## 10. Neon client and environment

The browser layer lives in `src/lib/neon/`:

- `config.ts` — reads and validates `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`; exports
  `isNeonConfigured` and `getNeonConfigIssues()`. Issues never include URL values.
- `client.ts` — lazily creates one typed `createClient<Database>()` instance. Importing the module has
  no side effects; `getNeonClient()` throws a clear configuration error on first real use. `neon` is an
  ergonomic proxy over the same singleton.
- `auth.ts` — `getNeonAuth()`, the Managed Better Auth entry point (`signIn.email`, `signUp.email`,
  `getSession`, `signOut`, password reset).
- `data-api.ts` — `getNeonDataApi()`, the Data API entry point for `.from(...)` and `.rpc(...)`.
- `index.ts` — public exports; no duplicate client initialization.

Environment variables:

| Variable                 | Required     | Notes                                             |
| ------------------------ | ------------ | ------------------------------------------------- |
| `VITE_NEON_AUTH_URL`     | yes          | Managed Better Auth URL, ending in `/auth`        |
| `VITE_NEON_DATA_API_URL` | yes          | Data API URL, ending in `/rest/v1`                |
| `DATABASE_URL`           | tooling only | direct PostgreSQL URL; **never** a `VITE_` prefix |

`DATABASE_URL` is read only by migration and type-generation tooling. Vite exposes every `VITE_*`
variable to the browser bundle, so a `VITE_DATABASE_URL` is rejected by the type generator script and
must never be created.

Sprint 3 consumes both entry points through `AuthProvider`. See
[`AUTHENTICATION.md`](AUTHENTICATION.md) for the session lifecycle and guards.

---

## 11. Administrator provisioning

Public signups create member profiles only. The first admin uses the website's
`/initial-admin-setup` page after migration `00014` is applied. Its
`public.claim_initial_admin()` function accepts no user ID/email arguments and is bound in SQL to the
existing owner-supplied Auth subject. It requires one matching existing profile, links that profile
without changing its UUID or contact information, writes an audit row, and records a private completion
marker. Migration `00014` seeds the marker if an application Admin already exists; otherwise, the
claim refuses to run if any other application admin exists and permanently disables initial setup
after a successful claim.

The actual profile UUID must be confirmed from the database after migration and the website claim have
succeeded. If the matching profile is missing or ambiguous, do not create another Neon Auth account or
edit profile identity fields directly; inspect the hosted database and stop for trusted reconciliation.

Later promotions, demotions and account activation changes happen through the admin-only
`public.update_user_access()` function, which prevents self-change and removal of the final active
administrator. The profile table's direct Data API update grant is restricted to the current user's
name and phone. No operation deletes an Auth account or financial history.

---

## 12. Migration workflow

Migrations are append-only and numbered. **Never edit a migration that has been applied to a persistent
database.** Create the next number instead.

### History

The Sprint 2 Supabase baseline (`profiles.id → auth.users`, `auth.uid()`, Supabase roles) was verified
only on a throwaway cluster and was **never applied to a hosted project**. It is preserved verbatim in
`db/legacy/sprint-2-supabase-baseline/` for auditability and must not be applied to Neon.

The Neon baseline is the rewritten `00001`–`00007` set, followed by
`00008_add_neon_auth_profile_provisioning.sql`, `00009_add_cycle_activation.sql`,
`00010_add_cycle_drafts.sql`, `00011_collection_day_due_dates.sql` and
`00012_secure_payment_operations.sql`, and `00013_secure_payout_operations.sql`. From this point the
Neon files are append-only.

**Sprint 2.6 renamed the product to Bachat Book and changed no SQL.** The migration and seed headers still
say "Bachify" in comments; no identifier, policy or grant references the brand, so the verified chain is
untouched by design. Editing applied migrations for a cosmetic comment would break their checksums and
history, which this project explicitly forbids.

**Sprint 2.7 applied this chain to the hosted project.** All eight migrations ran successfully against the
**production** branch of the hosted **BachatBook** project, after Neon Auth and the Data API were enabled.
The hosted schema reports 11 tables, RLS on all 11, 31 policies (zero `DELETE` policies) and a working
`auth.user_id()`.

**Sprint 4 added `00009_add_cycle_activation.sql`** and applied it to the same hosted branch. It adds the
`activate_cycle(...)` function described in §9.5 and changes no table, policy or grant.

**Sprint 5 added `00010_add_cycle_drafts.sql`** and applied it to the same hosted branch. It adds two
partial unique indexes and the three draft-workflow functions described in §9.6. It changes no table,
column, policy or grant, and leaves `activate_cycle(...)` untouched for backward compatibility.

**Sprint 6 adds `00011_collection_day_due_dates.sql`.** It replaces both activation functions so scheduled
dates use the saved collection day (clamped to month-end), and adds a private date-calculation helper.
The migration does not change tables, constraints or RLS policies. Applied to the hosted branch on
2026-11-08.

**Sprint 7 adds `00012_secure_payment_operations.sql`.** It installs the admin-only payment RPCs, revokes
direct payment writes and limits member payment reads to their own rows. Applied to the hosted branch
after `00011` on 2026-11-08.

**Sprint 8 adds `00013_secure_payout_operations.sql`.** It installs admin-only transactional payout
recording and voiding, derives the recipient from the installment, writes audit entries, and revokes
direct payout writes without weakening existing RLS. Applied to the hosted branch after `00012` on
2026-11-08.

**Authentication implementation adds `00014_auth_signup_and_role_management.sql`.** It replaces the
member-profile provisioning function, restricts profile column updates, adds audited admin access
changes, revokes direct audit inserts, and adds the one-time identity-bound initial-admin claim.
Applied to the hosted branch on 2026-11-08. Because an application Admin already existed, the
migration seeded `initial_admin_setup` with the owner profile `518d403a-a5eb-4f7d-afbb-a600f8923afa`
(Neon Auth id `25c8d456-…99c`), making the claim flow permanently disabled — the intended end state.

**Add-member implementation adds `00015_add_profiles_to_group.sql`.** It adds the trusted admin-only
RPC that links existing registered profiles to a Bhishi group atomically and idempotently: the caller
identity is derived from the JWT, the target profiles must exist and be active, a missing/archived
group is rejected, each profile's `members` row is reused or created from its profile details,
`group_members` rows are inserted with `on conflict (group_id, member_id) do nothing`, and one
`group_members_added` audit row is written only when at least one membership is actually applied.
Applied to the hosted branch on 2026-11-08 and verified there with 32 rollback-only checks; the
transaction was rolled back and left no test data. The frontend uses this RPC from the Add Member
dialog (search-and-select instead of free-form manual entry).

**Recipient-excluded contribution model in `00016_recipient_excluded_contribution_logic.sql`.** It
replaces both cycle-activation functions so the scheduled installment recipient is excluded from that
installment's `contribution_obligations`; obligations are created for the other participating members
only, each for the configured contribution amount. The installment `expected_amount` is set to
contribution × (participating members − 1). `record_payout()` now refuses to record while any
obligation for the installment remains outstanding, writing expected/collected totals into the payout
audit row. Applied to the hosted branch on 2026-11-08 and verified there with 38 rollback-only checks
covering three-member and five-member groups, payout gating, idempotent audit and rollback
cleanliness.

### Prerequisites

1. A Neon project and branch exist. The hosted **BachatBook** project and its **production** branch were
   provisioned in Sprint 2.7.
2. The Neon Data API is enabled on the branch. This creates `authenticated`, `anonymous` and
   `auth.user_id()`.
3. `DATABASE_URL` is the **direct** (non-pooled) connection string and is available only to the shell or
   CI, never to browser code.

### Apply

```bash
for file in db/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file" || exit 1
done
```

```powershell
Get-ChildItem db/migrations/*.sql | Sort-Object Name | ForEach-Object {
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
```

`neon.ts` declares `auth: true` and `dataApi: true` for the project. Declaring services does not
provision them. Do **not** run `neon deploy`, `neon config apply` or `neon db push` until the repository
is linked to a Neon project and the change has been explicitly approved.

### Verify

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
select count(*) from pg_policies where schemaname = 'public';
select current_profile_id(), is_admin();
```

### Bare PostgreSQL (used for local verification)

A bare cluster has no Data API roles or `auth` schema. Create local stand-ins **before** applying the
migrations:

```sql
create role authenticated nologin;
create role anonymous nologin;
create schema auth;
create function auth.user_id() returns text
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '') $$;
grant usage on schema auth to authenticated, anonymous;
grant execute on function auth.user_id() to authenticated, anonymous;
```

Then apply the migrations and `db/seed.sql`. This stub is test-only and is not part of the
repository or the Neon deployment.

---

## 13. Type generation

`src/types/database.types.ts` was regenerated **from the migrated hosted schema after migration `00016`** with
the official Neon generator:

```bash
npm run generate-types
```

The script reads `DATABASE_URL`, validates that it is a PostgreSQL URL, and runs:

```bash
npx @neondatabase/neon-js gen-types \
  --db-url "$DATABASE_URL" \
  --output src/types/database.types.ts \
  --schema public
```

`@neon/neon-js` does not bundle the CLI; Neon's documentation recommends the package's previous name
for the generator. The generated file works with the current SDK and is not hand-edited.

**Generation source:** the committed file was last generated against the hosted production branch
after migration `00016` was applied (2026-11-08). All function signatures, including
`update_user_access()`, `claim_initial_admin()`, `add_profiles_to_group()`, `record_payment()`,
`void_payment()`, `record_payout()`, `void_payout()` and `cycle_installment_due_date()`, plus the
`initial_admin_setup` table, come from the migrated hosted schema.

---

## 14. Seed data

`db/seed.sql` is development-only and deterministic:

- one demo group (₹5,000, collection day 12);
- eight fictional members with `@example.com` addresses and placeholder phone numbers;
- one active cycle with eight cycle members;
- eight installments (January–August 2026);
- 64 contribution obligations;
- six sample payments and one payout for the first installment.

It does **not** create Neon Auth users or profiles, so every auth-dependent column is `NULL`
(`created_by`, `profile_id`, `recorded_by`, `actor_id`). It is idempotent: fixed UUIDs plus
`ON CONFLICT DO NOTHING`, verified by running it twice.

---

## 15. Verification

Two layers were verified: the **hosted** project (Sprint 2.7) and the **local pre-flight** schema
(Sprint 2.5).

### Hosted verification (Sprint 2.7)

Verified on the hosted **BachatBook** project with the **production** branch active. Neon Auth and the Data
API are enabled on that branch.

| Check                       | Result                               |
| --------------------------- | ------------------------------------ |
| Project                     | ✅ Hosted `BachatBook` exists        |
| Production branch           | ✅ Active                            |
| Neon Auth                   | ✅ Enabled                           |
| Neon Data API               | ✅ Enabled                           |
| Migrations applied remotely | ✅ All 8 (`00001`–`00008`) succeeded |
| Application tables          | ✅ 11                                |
| RLS enabled                 | ✅ 11 / 11                           |
| RLS policies                | ✅ 31; 0 `DELETE` policies           |
| `auth.user_id()`            | ✅ Executes successfully             |

### Local pre-flight verification (Sprint 2.5)

Performed on **2026-11-03** against a fresh, isolated PostgreSQL **18.4** cluster (port 55432) with local
test stand-ins for the Neon Data API: `authenticated` / `anonymous` roles, an `auth` schema and
`auth.user_id()` reading `request.jwt.claim.sub`.

| Check                                                 | Result                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| All 8 migrations apply in order                       | ✅ Passed, `ON_ERROR_STOP=1`                                                         |
| Seed applies and re-runs without duplicates           | ✅ 1 group, 8 members, 1 cycle, 8 installments, 64 obligations, 6 payments, 1 payout |
| RLS enabled on all application tables                 | ✅ 11 / 11                                                                           |
| Policies created                                      | ✅ 31 policies; 0 `DELETE` policies; 0 audit `UPDATE`/`DELETE` policies              |
| Functions created                                     | ✅ 10 (`set_updated_at`, helpers, guard trigger, `ensure_own_profile`)               |
| Financial columns                                     | ✅ all six are `NUMERIC(12,2)`                                                       |
| Foreign keys                                          | ✅ 18; 0 cascade, 7 `SET NULL` (audit/actor fields), 11 `RESTRICT`                   |
| `ensure_own_profile()` forces member role             | ✅ role = `member`                                                                   |
| `ensure_own_profile()` is idempotent                  | ✅ second call returned the same profile id                                          |
| `ensure_own_profile()` blocked for `anonymous`        | ✅ no `EXECUTE` privilege                                                            |
| Composite obligation FK rejects unmatched payment     | ✅ SQLSTATE 23503                                                                    |
| Composite recipient FK rejects wrong payout recipient | ✅ SQLSTATE 23503                                                                    |
| One valid payout per installment                      | ✅ unique violation 23505                                                            |
| Void without actor/time/reason rejected               | ✅ check violation 23514                                                             |
| Member sees only own groups/ledger                    | ✅ 1 group, 8 shared members, 1 profile, 6 payments, 1 payout                        |
| Outsider sees no group data                           | ✅ 0 groups/members/payments/profiles                                                |
| Member cannot insert payment                          | ✅ RLS denied (42501)                                                                |
| Member cannot self-promote or change `auth_user_id`   | ✅ trigger denied (42501)                                                            |
| Member can update own contact fields                  | ✅ 1 row                                                                             |
| Admin sees all and can insert payment/audit           | ✅ all rows; insert allowed                                                          |
| Admin cannot update or delete audit history           | ✅ no `UPDATE` / `DELETE` privilege                                                  |
| `anonymous` cannot read any table                     | ✅ permission denied                                                                 |
| No `DELETE` grant for either Data API role            | ✅ 0 matching grants                                                                 |
| Helper functions granted only to `authenticated`      | ✅ admin/provisioning helpers denied to `anonymous`; trigger function not callable   |
| Type generation                                       | ✅ official Neon generator wrote `src/types/database.types.ts`                       |

### Re-verification after the final edits

The static checks were re-run once all Sprint 2.5 files and Sprint 2.6 rebrand edits were final, to prove
nothing drifted:

| Check                      | Result                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `npm run typecheck`        | ✅ 0 errors                                                               |
| `npm run lint`             | ✅ 0 errors, 0 warnings                                                   |
| `npm run build`            | ✅ passed, no chunk-size warning                                          |
| Direct `supabase` package  | ✅ `npm ls @supabase/supabase-js` returns empty                           |
| Residual Supabase strings  | ✅ only historical docs, `db/legacy/`, and a generator-emitted type alias |
| Scratch PostgreSQL cluster | ✅ stopped cleanly after verification                                     |

**Sprint 2.6 (rebrand) changed no SQL.** Migrations `00001`–`00008` and `db/seed.sql` are byte-identical to
the verified baseline; only their header comments still contain the old product word "Bachify". No schema
object, enum, policy, function, grant or index uses the brand, so this has zero runtime effect and the
migration chain remains valid.

### Sprint 4 and Sprint 5 hosted verification

`00009_add_cycle_activation.sql` (Sprint 4) and `00010_add_cycle_drafts.sql` (Sprint 5) were applied to the
hosted production branch and inspected there:

| Check                                                      | Result                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| `00009` applied                                            | ✅ Completed without error                                    |
| `activate_cycle(uuid)` exists                              | ✅ Present; grants restricted to `authenticated`              |
| `00010` applied                                            | ✅ Completed without error                                    |
| `create_cycle_draft(...)` exists                           | ✅ `create_cycle_draft(uuid,text,date,numeric,integer)`       |
| `set_cycle_chit_order(uuid,jsonb)` exists                  | ✅ Present                                                    |
| `activate_cycle_draft(uuid)` exists                        | ✅ Present                                                    |
| `cycles_one_active_per_group` index exists                 | ✅ Partial unique index on `group_id` where `status='active'` |
| `cycles_one_draft_per_group` index exists                  | ✅ Partial unique index on `group_id` where `status='draft'`  |
| Types regenerated after `00010`                            | ✅ All RPCs present in `src/types/database.types.ts`          |
| Draft workflow SQL verified in a rollback-only transaction | ✅ 39 assertions passed                                       |
| Hosted database left unchanged after verification          | ✅ Transaction rolled back; helper functions restored         |

Because a direct `pg` connection has no Data API JWT, the Sprint 5 assertions replaced
`current_profile_id()` and `is_admin()` **inside the rolled-back transaction only** with GUC-backed mocks.
The checks covered draft creation and snapshots, duplicate/rejected inputs, reorder persistence, inactive
members, atomic activation, snapshot immutability, member read-only access and admin-only function calls.
Real JWT-authenticated invocation through the Data API is still pending.

### Not verified

Sprint 3 implemented the client-side session provider, guards, onboarding and password-reset calls. Sprint
4 added the Bhishi workflow and cycle-activation function. Sprint 5 added the draft/chit-order workflow.
The following still require a provisioned hosted account (the database/RPC logic for signup
provisioning, role management, audit behaviour and profile RLS is now verified on the hosted branch —
see the 2026-11-08 record below — but not through the running app with real sessions):

- Successful Neon Auth sign-in/sign-out and session persistence.
- Administrator user and profile provisioning.
- Hosted JWT forwarding through the Data API and authenticated RLS visibility per role.
- Password reset email delivery and a complete password change.
- Member onboarding through `ensure_own_profile()` with a real session.
- Creating a group, adding members, activating a cycle, recording payments/payouts and reading the result
  back as a linked member.
- The `activate_cycle()` function against real data under an authenticated admin JWT (it was applied and
  inspected on the hosted branch, but not invoked end to end).
- `create_cycle_draft()`, `set_cycle_chit_order()` and `activate_cycle_draft()` through the Data API under a
  real admin JWT, and draft visibility under a real member JWT. Their SQL logic was verified inside a
  rollback-only hosted transaction with mocked identity helpers.

### Migrations 00011–00014 hosted verification (2026-11-08)

All four migrations were applied to the hosted production branch in numeric order via a direct SQL
connection, then verified there:

| Check                                                     | Result                                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `00011`–`00014` applied                                   | ✅ Each completed without error; branch is at `00014`                                         |
| `cycle_installment_due_date(date,integer,integer)` exists | ✅ Present, immutable helper                                                                  |
| `record_payment`/`void_payment` RPCs exist                | ✅ Executable by `authenticated` only                                                         |
| `record_payout`/`void_payout` RPCs exist                  | ✅ Executable by `authenticated` only                                                         |
| Direct `payments`/`payouts` INSERT/UPDATE privileges      | ✅ Revoked from all client roles                                                              |
| `ensure_own_profile(text,text,text)` exists               | ✅ Signed to `authenticated` only, forces `member`                                            |
| `update_user_access(uuid,user_role,boolean)` exists       | ✅ Signed to `authenticated` only, audit-logged, advisory-locked                              |
| `claim_initial_admin()` exists                            | ✅ Bound to the owner Auth id/email; setup marker seeded, flow disabled                       |
| `initial_admin_setup` table                               | ✅ Present, exactly one row, no client privileges                                             |
| `profiles` UPDATE grant                                   | ✅ Column-level `full_name, phone` only                                                       |
| DELETE policies                                           | ✅ Zero across the public schema                                                              |
| RLS policy count                                          | ✅ 30 (no stale `profiles_update_own_or_admin`)                                               |
| Structural post-apply checks                              | ✅ 18 passed                                                                                  |
| Behavioural rollback-only checks                          | ✅ 90 passed (provisioning, access RPC, audit trail, profiles RLS, trigger guard, claim flow) |
| Types regenerated from the migrated hosted schema         | ✅ `npm run generate-types`; all new functions/tables present                                 |
| Hosted database left unchanged after verification         | ✅ Rolled back; still one profile, zero groups/members/audit rows                             |

### Migration 00015 hosted verification (2026-11-08)

The Add-Member migration was applied to the hosted production branch via a direct SQL connection,
then verified in a single rollback-only transaction that was rolled back:

| Check                                             | Result                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `00015_add_profiles_to_group.sql` applied         | ✅ Completed without error; branch is at `00015`                                             |
| `add_profiles_to_group(uuid, uuid[])` exists      | ✅ Executable by `authenticated` only                                                        |
| Adding two registered members in one call         | ✅ Two linked members, two `active` memberships                                              |
| Idempotency of repeat add                         | ✅ 0 added; no duplicate `group_members` or `members` rows                                   |
| Inactive profile refused                          | ✅ `P0002` “missing or is inactive”                                                          |
| Member-role caller refused                        | ✅ `42501` “An active administrator session is required”                                     |
| Existing linked member row reused                 | ✅ Exactly one `members` row per profile                                                     |
| Missing group refused                             | ✅ `P0002` “The target group was not found or is archived”                                   |
| Archived group refused                            | ✅ Same error; restored to draft after                                                       |
| Empty selection refused                           | ✅ `22023` “Select at least one registered member to add”                                    |
| Audit behaviour                                   | ✅ `group_members_added` row only when ≥1 membership applied; actor from the JWT             |
| Source-level checks                               | ✅ Advisory lock, `is_admin()`, audit action, `on conflict (group_id, member_id) do nothing` |
| Hosted database left unchanged after verification | ✅ Rolled back; still one profile, zero groups/members/audit rows                            |
| Types regenerated from the migrated hosted schema | ✅ `npm run generate-types`; includes `add_profiles_to_group`                                |
| Static checks (typecheck, lint, build, format)    | ✅ Passed                                                                                    |

### Migration 00016 hosted verification (2026-11-08)

The recipient-excluded contribution migration was applied to the hosted production branch and
verified in a single rollback-only transaction that was rolled back:

| Check                                                     | Result                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `00016_recipient_excluded_contribution_logic.sql` applied | ✅ Completed without error; branch is at `00016`                                                |
| Legacy `activate_cycle()` path regenerates installments   | ✅ Three installments; each totals `contribution × contributing members` (20000)                |
| Legacy `activate_cycle_draft()` path                      | ✅ Draft activation generates the same recipient-excluded model                                 |
| Recipient excluded from obligations                       | ✅ Each installment has exactly N−1 obligations, none for the recipient                         |
| Contribution amount per obligation                        | ✅ 10000 for the fixture; total collected per installment = 20000                               |
| Payout with outstanding obligations refused               | ✅ `23514` “All required contributions must be received before recording the payout”            |
| Remaining after one payer                                 | ✅ Exactly 10000 remains                                                                        |
| No partial-amount bypass                                  | ✅ Payout blocked after first payer; allowed only after all contributors pay                    |
| Payout after full collection                              | ✅ Recipient derived from installment, `recorded_by` = acting admin from the JWT, one audit row |
| Audit row for payout                                      | ✅ Exactly one `payout.recorded` row; includes expected/collected totals                        |
| Five-member group (N−1 = 4)                               | ✅ Five installments total 40000 each; four contributors per installment                        |
| Types regenerated from the migrated hosted schema         | ✅ `npm run generate-types`; includes the updated functions                                     |
| Hosted database left unchanged after verification         | ✅ Rolled back; still one profile, zero groups/members/audit rows                               |
| Static checks (typecheck, lint, build, format)            | ✅ Passed                                                                                       |

---

## 16. Known limitations

1. **Hosted URLs are required but not committed.** `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`
   must be supplied in `.env`; the app shows a configuration screen without them. `.env` is git-ignored.
2. **Authenticated behaviour is unverified.** The hosted schema, RLS enablement, policy count and
   `auth.user_id()` are confirmed, but JWT forwarding, per-role visibility and a successful Auth flow have
   not been exercised under a real session.
3. **Audit writing is limited.** `activate_cycle()`, `create_cycle_draft()`, `set_cycle_chit_order()` and
   `activate_cycle_draft()` append audit rows, but group, member, payment and payout mutations from the
   browser do not yet emit audit entries.
4. **Installment generation happens in `activate_cycle()` / `activate_cycle_draft()`.** The rows exist for an
   activated cycle, but there is no UI to close a cycle and start the next one yet, and no UI to discard a
   draft.
5. **Drafts are hidden in the client, not by RLS.** Group members can read every cycle for their group so
   history stays visible; member screens filter drafts out. A member with direct Data API access could read
   a draft row, though not change it.
6. **Seed has no login accounts.** It cannot demonstrate authenticated RLS without first provisioning a
   real Neon Auth user and linking a member (`members.profile_id`).
7. **Generated types must be refreshed after schema changes.** The committed baseline was regenerated
   from the hosted schema after migration `00016` was applied (2026-11-08). Regenerate with
   `npm run generate-types` whenever the schema changes and review the diff.
8. **Browser-level authenticated validation is pending.** Migrations `00011`–`00016` are applied and
   their database behaviour verified on the hosted branch, but real hosted sign-in, browser-driven
   signup/role-management flows, RLS under real Data API JWTs, session persistence and
   mobile-browser checks remain to be run against real accounts.
