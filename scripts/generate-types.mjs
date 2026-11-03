#!/usr/bin/env node
/**
 * Regenerate src/types/database.types.ts from a live PostgreSQL schema.
 *
 * The current `@neon/neon-js` package does not bundle the type generator, so
 * this script runs the separate CLI from the package's previous name
 * (`@neondatabase/neon-js`). Neon's documentation explicitly recommends this;
 * the generated file works with both packages.
 *
 * DATABASE_URL must be a server-side direct (non-pooled) PostgreSQL connection
 * string. It is never read by browser code and must not use a VITE_ prefix.
 *
 * Usage:
 *   npm run generate-types
 *
 * On a fresh machine with no hosted Neon project, point DATABASE_URL at any
 * PostgreSQL database that has db/migrations applied. The generated file is
 * identical in shape to one produced from Neon, because it introspects
 * standard PostgreSQL catalogs.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const databaseUrl = (process.env.DATABASE_URL ?? '').trim()

if (!databaseUrl) {
  console.error(
    [
      'DATABASE_URL is not set.',
      '',
      'Set it to a server-side PostgreSQL connection string before running:',
      '  PowerShell:  $env:DATABASE_URL = "postgresql://..."',
      '  Bash:        export DATABASE_URL="postgresql://..."',
      'or put it in .env (never commit .env).',
    ].join('\n'),
  )
  process.exit(1)
}

if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  console.error('DATABASE_URL must start with postgresql:// or postgres://')
  process.exit(1)
}

if (process.env.VITE_DATABASE_URL) {
  console.warn(
    'Warning: VITE_DATABASE_URL is set. Remove it - Vite would expose the database connection string to browsers.',
  )
}

const output = resolve(process.cwd(), 'src/types/database.types.ts')

/**
 * Locate npm's JavaScript entry point so the CLI can be launched without a
 * shell. Spawning `.cmd` shims directly fails with EINVAL on Windows, and a
 * shell would have to re-quote the connection string.
 */
function resolveNpmCli() {
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate))
}

const npmCli = resolveNpmCli()

if (!npmCli) {
  console.error(
    'Could not locate npm. Run this script through npm instead:\n  npm run generate-types',
  )
  process.exit(1)
}

const cliArgs = ['gen-types', '--db-url', databaseUrl, '--output', output, '--schema', 'public']

const result = spawnSync(
  process.execPath,
  [npmCli, 'exec', '--yes', '--', '@neondatabase/neon-js@latest', ...cliArgs],
  { stdio: 'inherit', env: process.env },
)

if (result.error) {
  console.error(`Failed to run the Neon type generator: ${result.error.message}`)
  process.exit(1)
}

if (result.status !== 0) {
  console.error(`Neon type generator exited with code ${result.status ?? 'unknown'}.`)
  process.exit(result.status ?? 1)
}

console.log(`Wrote ${output}`)
