/**
 * Neon endpoint configuration.
 *
 * Two browser-safe URLs are required:
 *   VITE_NEON_AUTH_URL       Managed Better Auth base URL, ending in /auth
 *   VITE_NEON_DATA_API_URL   Data API base URL, ending in /rest/v1
 *
 * DATABASE_URL is intentionally NOT read here. It is a server-side PostgreSQL
 * connection string used only by migration/type-generation tooling. Vite only
 * exposes variables prefixed with VITE_ to the browser bundle.
 */

function readUrl(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

export const neonAuthUrl = readUrl(import.meta.env.VITE_NEON_AUTH_URL)
export const neonDataApiUrl = readUrl(import.meta.env.VITE_NEON_DATA_API_URL)

function inspectUrl(name: string, value: string, issues: string[]): void {
  if (!value) {
    issues.push(`${name} is missing.`)
    return
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    issues.push(`${name} must be a valid absolute URL.`)
    return
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    issues.push(`${name} must use http or https.`)
  }

  if (parsed.username || parsed.password) {
    issues.push(`${name} must not contain embedded credentials.`)
  }

  if (parsed.search || parsed.hash) {
    issues.push(`${name} must not contain a query string or fragment.`)
  }
}

/**
 * Human-readable configuration problems. Never includes URL values, so it is
 * safe to surface in a development notice.
 */
export function getNeonConfigIssues(): string[] {
  const issues: string[] = []

  inspectUrl('VITE_NEON_AUTH_URL', neonAuthUrl, issues)
  inspectUrl('VITE_NEON_DATA_API_URL', neonDataApiUrl, issues)

  return issues
}

/** True when both browser-safe Neon endpoints are present and well formed. */
export const isNeonConfigured = getNeonConfigIssues().length === 0
