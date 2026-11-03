# Database migrations (Neon PostgreSQL)

These files are the **only** migrations that should be applied. They target Neon PostgreSQL and
assume the Neon Data API is enabled on the branch (which creates the `authenticated` and `anonymous`
roles and the `auth.user_id()` identity function).

| File                                           | Contents                                                                                      | Status                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------- |
| `00001_create_enums.sql`                       | `user_role`, `group_status`, `cycle_status`, `membership_status`, `payment_method`            | Rewritten for Neon baseline   |
| `00002_create_core_tables.sql`                 | `profiles` (with `auth_user_id` mapping), groups, members, memberships, cycles, cycle members | Rewritten for Neon baseline   |
| `00003_create_financial_tables.sql`            | installments, obligations, payments, payouts, audit logs, void / one-payout constraints       | Superseded baseline, adapted  |
| `00004_create_indexes.sql`                     | 14 targeted indexes                                                                           | Superseded baseline, adapted  |
| `00005_create_helper_functions.sql`            | `current_profile_id`, `is_admin`, `is_group_member`, `can_access_*`, privilege guard          | Rewritten for Neon Auth       |
| `00006_enable_rls.sql`                         | RLS on all 11 application tables                                                              | Superseded baseline, adapted  |
| `00007_create_rls_policies.sql`                | 31 policies, explicit grants, immutable financial/audit tables                                | Rewritten for Neon identities |
| `00008_add_neon_auth_profile_provisioning.sql` | `ensure_own_profile()` — member-only self-provisioning linked through `auth.user_id()`        | **New for Neon**              |

## Migration history

The Sprint 2 baseline was written for Supabase Auth: `profiles.id` referenced `auth.users(id)` and
every helper called `auth.uid()`. It was verified only on a throwaway PostgreSQL cluster. **It was
never applied to a hosted Supabase project**, so there is no persistent migration history to
preserve.

The original seven files are archived verbatim in
[`../legacy/sprint-2-supabase-baseline/`](../legacy/sprint-2-supabase-baseline/) for reference.
They must **not** be applied to a Neon database. The files in this directory are the Neon baseline,
followed by the new `00008` migration.

From this point on, these files are append-only. Never edit a migration that has been applied to a
persistent Neon database; add the next numbered file instead.

## Prerequisites

1. The Neon project/branch exists.
2. The Neon Data API is enabled (this creates `authenticated`, `anonymous` and `auth.user_id()`).
3. `DATABASE_URL` points at the branch using the **direct** (non-pooled) connection string, and is
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
