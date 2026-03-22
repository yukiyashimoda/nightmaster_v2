export interface DbClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any
  storeId: string | null
}

export function getDb(context: unknown): DbClient | null {
  return (context as { supabase?: DbClient })?.supabase ?? null
}

export function getStoreId(context: unknown): string | null {
  return (context as { storeId?: string | null })?.storeId ?? null
}
