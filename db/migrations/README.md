# Database migrations (Neon PostgreSQL)

These files are the **only** migrations that should be applied. They target Neon PostgreSQL and
assume the Neon Data API is enabled on the branch (which creates the `authenticated` and `anonymous`
roles and the `auth.user_id()` identity function).

| File                                              | Contents                                                                                      | Status                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------- |
| `00001_create_enums.sql`                          | `user_role`, `group_status`, `cycle_status`, `membership_status`, `payment_method`            | Rewritten for Neon baseline   |
| `00002_create_core_tables.sql`                    | `profiles` (with `auth_user_id` mapping), groups, members, memberships, cycles, cycle members | Rewritten for Neon baseline   |
| `00003_create_financial_tables.sql`               | installments, obligations, payments, payouts, audit logs, void / one-payout constraints       | Superseded baseline, adapted  |
| `00004_create_indexes.sql`                        | 14 targeted indexes                                                                           | Superseded baseline, adapted  |
| `00005_create_helper_functions.sql`               | `current_profile_id`, `is_admin`, `is_group_member`, `can_access_*`, privilege guard          | Rewritten for Neon Auth       |
| `00006_enable_rls.sql`                            | RLS on all 11 application tables                                                              | Superseded baseline, adapted  |
| `00007_create_rls_policies.sql`                   | 31 policies, explicit grants, immutable financial/audit tables                                | Rewritten for Neon identities |
| `00008_add_neon_auth_profile_provisioning.sql`    | `ensure_own_profile()` — member-only self-provisioning linked through `auth.user_id()`        | **New for Neon**              |
| `00009_add_cycle_activation.sql`                  | `activate_cycle()` — atomic cycle, chit order, installment and obligation generation          | **Applied**                   |
| `00010_add_cycle_drafts.sql`                      | Draft cycle, manual chit order and atomic draft activation; one draft/active cycle per group  | **Applied**                   |
| `00011_collection_day_due_dates.sql`              | Use each cycle's saved collection day for both activation paths                               | **Applied**                   |
| `00012_secure_payment_operations.sql`             | Admin-only transactional payment recording/voiding and own-payment member read policy         | **Applied**                   |
| `00013_secure_payout_operations.sql`              | Admin-only transactional payout recording/voiding, derived recipient and audit history        | **Applied**                   |
| `00014_auth_signup_and_role_management.sql`       | Member profile provisioning, audited role/access RPCs, and identity-bound initial-admin setup | **Applied**                   |
| `00015_add_profiles_to_group.sql`                 | Trusted admin-only RPC `add_profiles_to_group()` linking registered profiles to groups        | **Applied**                   |
| `00016_recipient_excluded_contribution_logic.sql` | Recipient-excluded contribution model; payout refused while outstanding                       | **Applied**                   |

## Migration history

The Sprint 2 baseline was written for Supabase Auth: `profiles.id` referenced `auth.users(id)` and
every helper called `auth.uid()`. It was verified only on a throwaway PostgreSQL cluster. **It was
never applied to a hosted Supabase project**, so there is no persistent migration history to
preserve.

The original seven files are archived verbatim in
[`../legacy/sprint-2-supabase-baseline/`](../legacy/sprint-2-supabase-baseline/) for reference.
They must **not** be applied to a Neon database. The files in this directory are the Neon baseline,
followed by migrations `00008`–`00014`.

`00009` is the first migration that adds a write workflow rather than a table: it wraps cycle
activation in one `SECURITY DEFINER` transaction so a half-generated schedule can never be left
behind. Login-to-member uniqueness is already enforced by the `members_profile_id_key` index from
`00004`, so `00009` adds no duplicate index.

`00010` adds the Sprint 5 draft workflow. It creates partial unique indexes for one draft and one
active cycle per group, then adds three functions: `create_cycle_draft()`, `set_cycle_chit_order()`
and `activate_cycle_draft()`. The older `activate_cycle()` is intentionally left in place for
backward compatibility. Both migrations were applied to the hosted production branch and their
functions/indexes were confirmed there.

`00011` corrects due-date generation in both activation functions. It uses the saved collection-day
snapshot and clamps to the last calendar day when a month is shorter. It does not modify tables,
constraints or RLS policies and must be applied only after approval.

`00012` adds admin-only `record_payment()` and `void_payment()` functions. Recording locks the
obligation and rejects amounts above its current balance; voiding preserves the row and requires a
reason. Both operations record the acting profile in the payment and append an audit entry. Direct
Data API payment inserts/updates are revoked, and members can select only their own payment rows.
Apply it after `00011`; the earlier migrations remain unchanged.

`00013` adds admin-only `record_payout()` and `void_payout()` functions. Recording locks the
installment, derives the recipient from its saved schedule, and relies on the existing partial unique
index to prevent duplicate active payouts. Voiding preserves the row, requires a reason, and records
the acting profile in both the payout and audit log. Direct Data API payout inserts/updates are
revoked. Apply it after `00012`; no earlier migration is modified.

`00014` adds `update_user_access()` for atomic role and account-status changes, blocks direct
Data-API updates to protected profile columns, and removes direct client inserts into the audit log.
It also updates `ensure_own_profile()` to create new profiles as members and reject conflicting email
links. `claim_initial_admin()` is bound to the existing owner-supplied Neon Auth identity, accepts no
identity parameters, requires exactly one matching application profile, refuses any different
application admin, seeds the permanent completion marker when an Admin already exists, and disables
itself after the first claim. Apply after `00013`; no earlier migration is modified.

`00015` adds `add_profiles_to_group(target_group_id uuid, target_profile_ids uuid[]) returns integer`,
a trusted admin-only RPC that links existing registered profiles to a Bhishi group in one transaction.
It requires an active administrator, rejects a missing/archived group, reuses or creates one linked
`members` row per profile from the profile's current name/email/phone, inserts into `group_members`
idempotently with `on conflict (group_id, member_id) do nothing`, and appends `group_members_added`
to the audit log only when at least one membership was actually added. Registered members must still
exist in `profiles` with `is_active = true`. Apply after `00014`; no earlier migration is modified.

`00016` implements the recipient-excluded contribution model. Both activation paths (`activate_cycle()`
and `activate_cycle_draft()`) generate installments as before, but the recipient of each installment is
excluded from that installment's contribution obligations; obligations are created for the other
participating members only, each for the configured contribution. The installment `expected_amount` is
set to contribution × (participating members − 1). The `record_payout()` function now also refuses to
record while required obligations for the installment remain outstanding. Apply after `00015`; no
earlier migration is modified.

From this point on, these files are append-only. Never edit a migration that has been applied to a
persistent Neon database; add the next numbered file instead.

## Prerequisites

1. The Neon project/branch exists.
2. The Neon Data API is enabled (this creates `authenticated`, `anonymous` and `auth.user_id()`).
3. Apply pending migrations in order after reviewing the deployment plan and
   confirming the target branch. `00014` includes the one-time setup for the existing initial-admin
   identity specified by the project owner. `00015` adds `add_profiles_to_group()` and must be applied
   after `00014` if this flow is used. `00016` implements the recipient-excluded contribution model and
   its payout gate; review it before applying to a branch that holds live cycles.
4. `DATABASE_URL` points at the branch using the **direct** (non-pooled) connection string, and is
   available only to your shell / CI, never to browser code.

## Apply

```bash
# Bash
for file in db/migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file" || exit 1
done
```

```powershell
# PowerShell
Get-ChildItem db/migrations/*.sql | Sort-Object Name | ForEach-Object {
  psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
```

Do not run `neon deploy`, `neon config apply` or any remote migration command until the project is
linked and you have explicitly approved it.

## Verify

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
select count(*) from pg_policies where schemaname = 'public';
select current_profile_id(), is_admin();
```

## Seed

`../seed.sql` is idempotent development data. It creates no Neon Auth users and no profiles.
