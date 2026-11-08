#!/usr/bin/env node
/**
 * Apply every file in db/migrations in numeric order, skipping migrations
 * that are already applied. Uses the same direct DATABASE_URL that the type
 * generator and the temp apply-file tool use.
 *
 * Why not one raw .sql file:
 *   - Most migrations use `create type`, `create table` and `create policy`,
 *     none of which are idempotent. Re-running them on an already-migrated
 *     branch fails mid-file and can leave the chain in a half-applied state.
 *
 * Usage:
 *   node --env-file-if-exists=.env scripts/migrate.mjs              apply missing migrations
 *   node --env-file-if-exists=.env scripts/migrate.mjs --dry-run    list what would run
 *   node --env-file-if-exists=.env scripts/migrate.mjs --seed       mark every migration as applied
 *                                                               (use on an already-migrated branch)
 *
 * Safety rules:
 *   - Refuses to run against a database that clearly already has the baseline
 *     applied when the migration table has not been seeded (prevents
 *     half-applying 00001 on an existing branch).
 *   - Every file is applied in a transaction; the first failure stops the run.
 *   - No migration file is modified or touched.
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
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const seed = args.has('--seed')

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

const q = (sql, params) => client.query(sql, params)

async function main() {
  await client.connect()

  const baselineExists = await q(
    `select 1 as present from pg_type where typname = 'user_role' limit 1`,
  )
  const baselinePresent = baselineExists.rows.length > 0

  const tableExists = await q(
    `select 1 as present
     from information_schema.tables
     where table_schema = 'public' and table_name = '__bachatbook_migrations'`,
  )
  const trackingExists = tableExists.rows.length > 0
  const appliedSet = new Set()

  if (dryRun) {
    console.log('Would apply:')
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()
    const tracked = new Set()
    if (trackingExists) {
      console.log('Tracking table present; marking applied rows with SKIP.')
      const rows = await q(`select name from public.__bachatbook_migrations`)
      for (const row of rows.rows) tracked.add(row.name)
    }
    if (baselinePresent && !trackingExists) {
      console.log('Baseline already applied (user_role exists); all migrations below would also need to be seeded (use --seed) to be marked applied.')
    }
    for (const file of files) {
      console.log(`  ${tracked.has(file) ? 'SKIP (applied)' : 'RUN  '}  ${file}`)
    }
    return
  }

  if (!trackingExists) {
    if (baselinePresent && !seed) {
      console.error('')
      console.error('  This database already has the baseline applied (user_role exists),')
      console.error('  but there is no migration-tracking table yet.')
      console.error('')
      console.error('  To avoid half-applying 00001, either:')
      console.error('    a) seed the tracking table first, then re-run safely:')
      console.error('       node --env-file-if-exists=.env scripts/migrate.mjs --seed')
      console.error('')
      console.error('    b) re-run with --dry-run to see what would happen:')
      console.error('       node --env-file-if-exists=.env scripts/migrate.mjs --dry-run')
      process.exit(1)
    }
    if (!dryRun) {
      await q(`create table public.__bachatbook_migrations (name text primary key)`)
      console.log('Created public.__bachatbook_migrations')
    }
  } else {
    const rows = await q(`select name from public.__bachatbook_migrations`)
    for (const row of rows.rows) appliedSet.add(row.name)
  }

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()

  if (seed) {
    if (!trackingExists) {
      await q(`create table public.__bachatbook_migrations (name text primary key)`)
    }
    const placeholder = files.map((_, i) => `($${i + 1})`).join(', ')
    await q(
      `insert into public.__bachatbook_migrations (name) values ${placeholder} on conflict (name) do nothing`,
      files,
    )
    console.log(`Seeded ${files.length} migration(s) as already applied.`)
    console.log('Future runs apply only files not yet recorded.')
    return
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
      await q(sql)
      await q(`insert into public.__bachatbook_migrations (name) values ($1)`, [file])
      applied += 1
      console.log(`OK   ${file}`)
    } catch (error) {
      console.error('')
      console.error(`FAILED at ${file}:`)
      console.error(error.message)
      console.error('')
      console.error('Stopped. Earlier files were committed; this file and later files were not applied.')
      process.exitCode = 1
      return
    }
  }

  if (applied === 0) {
    console.log('Everything is already applied. No files were run.')
  } else {
    console.log(`Done. Applied ${applied} migration(s).`)
  }
}

main()
  .catch((error) => {
    console.error('Migrate failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => {
    client.end().catch(() => {})
  })
