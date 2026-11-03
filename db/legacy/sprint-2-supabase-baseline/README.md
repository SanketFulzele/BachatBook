# Archived Sprint 2 Supabase baseline

**Do not apply these files.** They are kept only so the project history is auditable.

These seven migrations and the seed/config were written during Sprint 2, when the backend plan was
Supabase. They assume:

- `profiles.id uuid references auth.users(id)`,
- `auth.uid()` returning a UUID,
- Supabase's `anon` / `authenticated` / `service_role` roles,
- Supabase CLI local development and `supabase db push`.

They were verified against a temporary PostgreSQL 18.4 cluster with a stubbed Supabase `auth` schema.
No hosted Supabase project existed, so nothing here was ever applied to a persistent database.

The Neon replacements live in [`../../migrations/`](../../migrations/). See
[`../../migrations/README.md`](../../migrations/README.md) for the per-file mapping and the new
`00008` migration.
