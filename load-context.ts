import type { PlatformProxy } from 'wrangler'
import type { SupabaseClient } from './app/lib/db.server'

interface Env {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: Cloudflare
    supabase: SupabaseClient | null
  }
}
