import { defineConfig } from '@neon/config/v1'

/**
 * Declarative Neon services for this project.
 *
 * This file describes the intended hosted configuration; it does not provision
 * anything by itself. Apply it only after the repository is linked to a Neon
 * project and you have explicitly approved the change:
 *
 *   neon link
 *   neon config plan
 *   neon deploy
 *
 * `auth` enables Managed Better Auth. `dataApi: true` requires Neon Auth and
 * makes it the JWT verifier for Data API requests, which is what the RLS
 * helpers in db/migrations expect.
 */
export default defineConfig({
  auth: true,
  dataApi: true,
})
