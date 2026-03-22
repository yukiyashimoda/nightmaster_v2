export interface DbClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any
}

export function getDb(context: unknown): DbClient | null {
  return (context as { supabase?: DbClient })?.supabase ?? null
}
