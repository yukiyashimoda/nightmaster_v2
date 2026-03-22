import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient }

/** React Router の load context から Supabase クライアントを取得する */
export function getSupabase(context: unknown): SupabaseClient | null {
  return (context as { supabase?: SupabaseClient })?.supabase ?? null
}
