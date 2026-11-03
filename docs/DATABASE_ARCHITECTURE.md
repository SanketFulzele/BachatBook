# Bachify — Database Architecture (Neon)

> Sprint 2 deliverable, migrated from Supabase to **Neon PostgreSQL + Managed Better Auth + Data API**.
> Describes the PostgreSQL schema, financial integrity rules, RLS access model, identity mapping,
> migration workflow and trusted administrator provisioning.
>
> **Status:** all eight migrations were applied to a real local PostgreSQL 18.4 instance with local
> stand-ins for the Data API roles and `auth.user_id()`. They have **not** been applied to a hosted Neon
> project, because no project or credentials exist yet. See [Verification](#14-verification) and
> [Known limitations](#15-known-limitations).

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
  obligations) will be PostgreSQL functions called with `.rpc()`. They run in one transaction; the
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

**Immutability.** The `profiles_enforce_privilege_change` trigger (migration 00005) rejects any change
to `id` or `auth_user_id`, and rejects `role` / `is_active` changes made by a non-admin. This closes the
column-level gap that RLS `USING` / `WITH CHECK` expressions cannot express.

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

`id`, `cycle_id` (FK, `RESTRICT`), `installment_number` (> 0), `scheduled_date`,
`recipient_member_id` (nullable FK → members), `expected_amount` (`NUMERIC(12,2)` > 0), timestamps.
Unique `(cycle_id, installment_number)`.

An additional unique `(id, recipient_member_id)` exists solely so that `payouts` can enforce the
recipient through a composite foreign key.

### `contribution_obligations` — what every member owes for every installment

`id`, `installment_id` (FK, `RESTRICT`), `member_id` (FK, `RESTRICT`), `expected_amount`
(`NUMERIC(12,2)` > 0), timestamps. Unique `(installment_id, member_id)`.

Every member — including the recipient of that installment — has one obligation per installment.
This table is the basis for outstanding-balance calculations in Sprint 7.

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
- There is **no stored payment status**. Status is derived from non-voided payment totals in Sprint 7.

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

RLS allows administrators to `SELECT` and `INSERT` only. `UPDATE` and `DELETE` privileges are
revoked at the table level as well.

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

`enforce_profile_privilege_change()` is a `BEFORE UPDATE` trigger on `profiles`. It raises `42501` if a
non-admin changes `role` or `is_active`, and if anyone changes `id` or `auth_user_id`.

### 9.2 Access matrix

| Table                      | anonymous | member                                | admin                                            |
| -------------------------- | --------- | ------------------------------------- | ------------------------------------------------ |
| `profiles`                 | —         | select own; update own contact fields | select all; update all (role guarded by trigger) |
| `bhishi_groups`            | —         | select own groups                     | select all; insert; update                       |
| `members`                  | —         | select self + shared-group members    | select all; insert; update                       |
| `group_members`            | —         | select own groups                     | select all; insert; update                       |
| `cycles`                   | —         | select own groups' cycles             | select all; insert; update                       |
| `cycle_members`            | —         | select own groups' orders             | select all; insert; update                       |
| `installments`             | —         | select own groups' schedule           | select all; insert; update                       |
| `contribution_obligations` | —         | select own groups' obligations        | select all; insert; update                       |
| `payments`                 | —         | select own groups' ledger             | select all; insert; update (void)                |
| `payouts`                  | —         | select own groups' payouts            | select all; insert; update (void)                |
| `audit_logs`               | —         | —                                     | select; insert                                   |

**No table has a `DELETE` policy.** `authenticated` also has no `DELETE` table privilege anywhere.
`audit_logs` has no `UPDATE` privilege or policy either. The migration also revokes all privileges on
every application table from `anonymous` if that role exists.

### 9.3 Profile provisioning

`00008_add_neon_auth_profile_provisioning.sql` adds:

```sql
public.ensure_own_profile(profile_full_name text, profile_phone text default null, profile_email text default null)
returns uuid
```

- Reads the identity from `auth.user_id()`, never from a parameter.
- Inserts a profile with `role = 'member'` hard-coded. There is no role parameter.
- Returns the same profile id on a second call; it never duplicates or promotes a profile.
- Is `SECURITY DEFINER`, revoked from `PUBLIC`, and granted only to `authenticated`.

There is still **no `INSERT` policy on `profiles`** and no client path to `admin`. The function is the
only self-service path, and it can create members only. Administrators remain a trusted manual
provisioning step.

### 9.4 Why members cannot write financially

Member policies exist only for `SELECT`. There is no INSERT/UPDATE/DELETE policy for members on groups,
memberships, cycles, installments, obligations, payments or payouts. The database — not the React route
guard — rejects the write. This was exercised with simulated member, outsider and admin identities; see
[Verification](#14-verification).

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

| Variable                 | Required            | Notes                                             |
| ------------------------ | ------------------- | ------------------------------------------------- |
| `VITE_NEON_AUTH_URL`     | yes (from Sprint 3) | Managed Better Auth URL, ending in `/auth`        |
| `VITE_NEON_DATA_API_URL` | yes (from Sprint 3) | Data API URL, ending in `/rest/v1`                |
| `DATABASE_URL`           | tooling only        | direct PostgreSQL URL; **never** a `VITE_` prefix |

`DATABASE_URL` is read only by migration and type-generation tooling. Vite exposes every `VITE_*`
variable to the browser bundle, so a `VITE_DATABASE_URL` is rejected by the type generator script and
must never be created.

No screen imports the Neon client in this migration task, so the UI still runs without a Neon project.
Sprint 3 will consume `getNeonAuth()`.

---

## 11. Administrator provisioning

There is intentionally no public path to `admin`:

- `profiles` has no INSERT policy and no client INSERT use case.
- `ensure_own_profile()` hard-codes `role = 'member'`.
- Self-promotion is blocked by the `profiles_enforce_privilege_change` trigger.
- `anonymous` has no table privileges.

To create the first administrator, a trusted operator with the direct database connection must:

1. Create the user through Neon Auth (sign-up once it exists in Sprint 3, or the Neon Console).
2. Read the managed user id (read-only):
   `select id, email from neon_auth.user where email = 'admin@example.com';`
3. Insert the matching profile:

```sql
insert into public.profiles (auth_user_id, full_name, email, role)
values ('<neon-auth-user-id>', 'Administrator Name', 'admin@example.com', 'admin')
on conflict (auth_user_id) do update
set role = 'admin',
    is_active = true,
    full_name = excluded.full_name,
    email = excluded.email;
```

4. Confirm with
   `select id, auth_user_id, role, is_active from public.profiles where auth_user_id = '<neon-auth-user-id>';`

The `neon_auth` schema is read-only for this process; only `public.profiles` is written. For production,
disable public email sign-up until a controlled onboarding flow exists. Even with sign-up enabled, a new
user can only create a **member** profile.

---

## 12. Migration workflow

Migrations are append-only and numbered. **Never edit a migration that has been applied to a persistent
database.** Create the next number instead.

### History

The Sprint 2 Supabase baseline (`profiles.id → auth.users`, `auth.uid()`, Supabase roles) was verified
only on a throwaway cluster and was **never applied to a hosted project**. It is preserved verbatim in
`db/legacy/sprint-2-supabase-baseline/` for auditability and must not be applied to Neon.

The Neon baseline is the rewritten `00001`–`00007` set, followed by the new
`00008_add_neon_auth_profile_provisioning.sql`. From this point the Neon files are append-only.

### Prerequisites

1. A Neon project and branch exist.
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

Then apply the eight migrations and `db/seed.sql`. This stub is test-only and is not part of the
repository or the Neon deployment.

---

## 13. Type generation

`src/types/database.types.ts` was regenerated **from the verified local schema** with the official Neon
generator:

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

**Hosted-generation limitation:** the committed file was generated from a local PostgreSQL 18.4 schema
that contains the same tables, enums and functions as the migrations. It was not generated from a
hosted Neon branch, because no project exists. Regenerate against the hosted branch after the first
approved remote migration.

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

### Not verified

- No hosted Neon project was created or linked.
- No migration was applied remotely.
- `neon.ts` was not deployed; no Auth or Data API endpoint exists.
- Hosted JWT forwarding, PostgREST policy evaluation and real browser sign-in were not exercised.
- Email delivery and password-reset flows remain Sprint 3 work.

---

## 16. Known limitations

1. **No hosted project / credentials.** `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` must be
   supplied before Sprint 3 can call the API. `.env` is git-ignored.
2. **Local-only migration verification.** The SQL is valid PostgreSQL, but Neon-specific behaviour
   (Data API JWT claims, hosted role privileges, Auth user ids) will be exercised when the project is
   linked.
3. **No audit-writing triggers.** The table and policies exist, but application code does not yet emit
   audit rows. That belongs to Sprint 10 (or earlier admin mutations).
4. **No installment generation.** `installments` and `contribution_obligations` are empty until
   Sprint 6 generates them atomically.
5. **Seed has no login accounts.** It cannot demonstrate authenticated RLS without first provisioning a
   real Neon Auth user and linking a member (`members.profile_id`).
6. **Generated types are local.** Regenerate with `npm run generate-types` after the first hosted
   migration.
