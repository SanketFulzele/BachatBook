#!/usr/bin/env node
/**
 * Apply every file in db/migrations in numeric order, skipping migrations
 * that are already applied. Reads DATABASE_URL from the environment or the
 * project's .env file (never printed).
 *
 * Important:
 *   - No previously applied migration file is ever modified or re-run.
 *   - The script verifies the target database/branch before applying anything.
 *   - It never applies migrations against a local database when DATABASE_URL
 *     clearly points at a localhost host.
 *
 * Why not a single raw SQL file:
 *   Most migrations use CREATE TYPE / CREATE TABLE / CREATE POLICY, which are
 *   not idempotent. Re-running them on an already-migrated branch would fail
 *   mid-file and leave the chain half-applied. This runner instead records
 *   which migrations have been applied and applies only the missing files.
 *
 * Usage:
 *   node --env-file-if-exists=.env scripts/migrate.mjs              apply missing migrations
 *   node --env-file-if-exists=.env scripts/migrate.mjs --dry-run    list what would run
 *
 * Fresh clone / fresh hosted branch: apply everything in order.
 * Already-migrated branch: nothing is re-applied — the runner records current state.
 */
import { readdir, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = resolve(fileURLToPath(import.meta.url), '..')
const root = resolve(here, '..')
const migrationsDir = join(root, 'db', 'migrations')

const databaseUrl = process.env.DATABASE_URL ?? ''
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Set it in .env or in your shell.')
  process.exit(1)
}

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
const q = (sql, params) => client.query(sql, params)

const migrationFunctions = [
  'is_admin',
  'ensure_own_profile',
  'activate_cycle_draft',
  'record_payment',
  'record_payout',
  'update_user_access',
  'add_profiles_to_group',
  'cycle_ready_to_complete',
  'record_group_payment',
  'try_complete_cycle',
]

function printTargetInfo(url) {
  try {
    const parsed = new URL(url)
    const local =
      /^localhost$|^127\.0\.0\.1$|^::1$|^192\.168\./.test(parsed.hostname) ||
      parsed.hostname === 'localhost'
    console.log(`Target host : ${parsed.hostname}${local ? ' (local)' : ''}`)
    console.log(`Target db   : ${parsed.pathname.replace(/^\//, '')}`)
    return { local, host: parsed.hostname }
  } catch {
    console.log('Target      : (could not parse host — refusing to proceed)')
    process.exit(1)
  }
}

async function existingFunctions() {
  const rows = await q(
    `select proname from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname = any($1)`,
    [migrationFunctions],
  )
  return new Set(rows.rows.map((r) => r.proname))
}

// Connect and verify target before any writes.
const { local, host } = printTargetInfo(databaseUrl)
await client.connect()
const who = await q('select current_user, current_database()')
console.log(`Connected   : user=${who.rows[0].current_user}, db=${who.rows[0].current_database}`)

if (local) {
  console.log('Target is a local database; applying normally.')
}

const baselineExists =
  (await q(`select 1 as present from pg_type where typname = 'user_role' limit 1`)).rows.length > 0

const tableExists = await q(
  `select 1 as present
     from information_schema.tables
    where table_schema = 'public' and table_name = '__bachatbook_migrations'`,
)
const trackingExists = tableExists.rows.length > 0
const appliedSet = new Set()
if (trackingExists) {
  const rows = await q(`select name from public.__bachatbook_migrations`)
  for (const row of rows.rows) appliedSet.add(row.name)
}

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()

if (dryRun) {
  console.log('Migration plan (first failure stops the run):')
  for (const f of files) {
    console.log(`  ${appliedSet.has(f) ? 'SKIP (applied)' : 'RUN  '}  ${f}`)
  }
  await client.end()
  process.exit(0)
}

// Fresh target, or operator explicitly seeding: create tracking table and process all files.
if (!trackingExists) {
  const present = await existingFunctions()
  const missing = migrationFunctions.filter((f) => !present.has(f))

  if (baselineExists) {
    // Already-migrated branch without a tracking record. Only proceed once
    // every migration's sentinel functions exist. Otherwise stop.
    if (missing.length > 0) {
      console.error('This database has the baseline, but not every later migration is present.')
      console.error(`Missing: ${missing.join(', ')}`)
      console.error(
        'Refusing to mark all migrations as applied. Inspect db/migrations and apply missing files manually, then re-run.',
      )
      await client.end()
      process.exit(1)
    }
    await q(`create table public.__bachatbook_migrations (name text primary key)`)
    const placeholder = files.map((_, i) => `($${i + 1})`).join(', ')
    await q(
      `insert into public.__bachatbook_migrations (name) values ${placeholder} on conflict (name) do nothing`,
      files,
    )
    for (const f of files) appliedSet.add(f)
    console.log(`Recorded ${files.length} existing migration(s) as already applied.`)
  } else {
    // Fresh database: create tracking table and apply all files in order.
    await q(`create table public.__bachatbook_migrations (name text primary key)`)
    console.log('Created public.__bachatbook_migrations')
  }
}

let applied = 0
for (const file of files) {
  if (appliedSet.has(file)) {
    console.log(`SKIP ${file}`)
    continue
  }
  const sql = await readFile(join(migrationsDir, file), 'utf8')
  console.log(`Applying ${file} ...`)
  try {
    // Every migration file already opens with BEGIN and ends with COMMIT; running as-is keeps the migration atomic where supported.
    await q(sql)
    await q(`insert into public.__bachatbook_migrations (name) values ($1)`, [file])
    applied += 1
    console.log(`OK   ${file}`)
  } catch (error) {
    console.error('')
    console.error(`FAILED at ${file}:`)
    console.error(error.message?.split('\n')[0] ?? String(error))
    console.error('')
    console.error('Earlier files were committed, this file and later files were NOT applied.')
    await client.end()
    process.exit(1)
  }
}

console.log(
  applied === 0
    ? 'Everything is already applied; nothing ran.'
    : `Done. Applied ${applied} migration(s).`,
)

await client.end()
process.exit(0)
