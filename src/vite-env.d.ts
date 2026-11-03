/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production' | string
  /** Neon Managed Better Auth base URL, ending in /auth. */
  readonly VITE_NEON_AUTH_URL?: string
  /** Neon Data API base URL, ending in /rest/v1. */
  readonly VITE_NEON_DATA_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
