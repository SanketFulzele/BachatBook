import { createClient } from '@neon/neon-js'
import type { Database } from '@/types/database.types'
import { getNeonConfigIssues, neonAuthUrl, neonDataApiUrl } from './config'

/**
 * Single Neon client for both Managed Better Auth and the Data API.
 *
 * Using one createClient() instance is deliberate:
 *   * it avoids two independent auth stores,
 *   * the Data API request wrapper receives the JWT issued by the Auth client
 *     automatically, so RLS sees the signed-in user.
 *
 * Initialization is lazy. Importing this module never touches the network and
 * never throws, which keeps the UI runnable before a Neon project exists. The
 * first real use fails with an actionable error when configuration is missing.
 */
function createBachifyNeonClient() {
  return createClient<Database>({
    auth: {
      url: neonAuthUrl,
    },
    dataApi: {
      url: neonDataApiUrl,
    },
  })
}

export type BachifyNeonClient = ReturnType<typeof createBachifyNeonClient>

let cachedClient: BachifyNeonClient | null = null

/** Returns the shared Neon client, creating it on first use. */
export function getNeonClient(): BachifyNeonClient {
  if (cachedClient) return cachedClient

  const issues = getNeonConfigIssues()
  if (issues.length > 0) {
    throw new Error(
      `Neon is not configured correctly:\n- ${issues.join('\n- ')}\n` +
        'Copy .env.example to .env and fill in the Auth and Data API URLs from the Neon Console.',
    )
  }

  cachedClient = createBachifyNeonClient()
  return cachedClient
}

/**
 * Ergonomic shared client. Property access is forwarded to the lazily created
 * instance, so importing this module stays side-effect free.
 *
 * Prefer getNeonClient() when you want an explicit error boundary.
 */
export const neon = new Proxy({} as BachifyNeonClient, {
  get(_target, property) {
    const client = getNeonClient()
    const value = Reflect.get(client, property)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
