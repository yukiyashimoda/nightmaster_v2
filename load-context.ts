import type { DbClient } from './app/lib/db.server'

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: Record<string, string | undefined>
    supabase: DbClient | null
    userId: string | null
    userEmail: string | null
    storeId: string | null
    accessToken: string | null
    supabaseUrl: string | null
    anonKey: string | null
  }
}
