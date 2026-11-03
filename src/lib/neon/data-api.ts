import { getNeonClient, type BachifyNeonClient } from './client'

/**
 * Neon Data API entry point.
 *
 * Every request runs through the shared client, which attaches the current
 * Neon Auth JWT. PostgreSQL RLS (not React) decides row visibility, so callers
 * never pass a user id or role as a trust signal.
 *
 * Examples for later sprints:
 *   getNeonDataApi().from('bhishi_groups').select('*')
 *   getNeonDataApi().rpc('record_payment', { ... })
 *
 * The `.auth` property is present on the underlying client but auth should be
 * reached through ./auth to keep the two concerns readable.
 */
export function getNeonDataApi(): BachifyNeonClient {
  return getNeonClient()
}
