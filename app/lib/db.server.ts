import type { PostgrestClient } from '@supabase/postgrest-js'

export type DbClient = PostgrestClient

/** React Router の load context から DB クライアントを取得する */
export function getDb(context: unknown): DbClient | null {
  return (context as { supabase?: DbClient })?.supabase ?? null
}
