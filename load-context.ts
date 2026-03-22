import type { DbClient } from './app/lib/db.server'

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: Record<string, string | undefined>
    supabase: DbClient | null
  }
}
