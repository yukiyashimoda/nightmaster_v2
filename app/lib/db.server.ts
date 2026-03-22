// Pure fetch-based PostgREST client — zero npm dependencies
// Works in Cloudflare Workers without any SDK

class QueryBuilder {
  private params = new URLSearchParams()
  private method = 'GET'
  private body: unknown = undefined
  private prefer: string[] = []
  private returnSingle = false
  private returnMaybeSingle = false
  private headOnly = false
  private withCount = false

  constructor(
    private restBase: string,
    private hdrs: Record<string, string>,
    private table: string,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(cols = '*', opts?: { count?: 'exact'; head?: boolean }): any {
    if (cols !== '*') this.params.set('select', cols)
    if (opts?.count === 'exact') this.withCount = true
    if (opts?.head) this.headOnly = true
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eq(col: string, val: string): any {
    this.params.set(col, `eq.${val}`)
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contains(col: string, vals: string[]): any {
    this.params.set(col, `cs.{${vals.join(',')}}`)
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order(col: string, opts?: { ascending?: boolean }): any {
    const dir = opts?.ascending === false ? 'desc' : 'asc'
    const cur = this.params.get('order')
    this.params.set('order', cur ? `${cur},${col}.${dir}` : `${col}.${dir}`)
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  single(): any { this.returnSingle = true; return this }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maybeSingle(): any { this.returnMaybeSingle = true; return this }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insert(data: unknown): any {
    this.method = 'POST'
    this.body = data
    this.prefer.push('return=representation')
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(data: unknown): any {
    this.method = 'PATCH'
    this.body = data
    this.prefer.push('return=representation')
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upsert(data: unknown): any {
    this.method = 'POST'
    this.body = data
    this.prefer.push('return=representation', 'resolution=merge-duplicates')
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(): any { this.method = 'DELETE'; return this }

  then(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (val: { data: any; error: Error | null; count?: number | null }) => void,
    reject: (err: unknown) => void,
  ): void {
    this._run().then(resolve, reject)
  }

  private async _run(): Promise<{ data: unknown; error: Error | null; count?: number | null }> {
    try {
      const url = new URL(`${this.restBase}/${this.table}`)
      this.params.forEach((v, k) => url.searchParams.set(k, v))

      const headers: Record<string, string> = { ...this.hdrs }
      const preferParts = [...this.prefer]
      if (this.withCount) preferParts.push('count=exact')
      if (preferParts.length > 0) headers['Prefer'] = preferParts.join(',')

      const res = await fetch(url.toString(), {
        method: this.headOnly ? 'HEAD' : this.method,
        headers,
        body: this.body !== undefined ? JSON.stringify(this.body) : undefined,
      })

      if (this.headOnly) {
        const cr = res.headers.get('Content-Range')
        const count = cr ? (parseInt(cr.split('/')[1]) ?? null) : null
        return { data: null, error: null, count }
      }

      if (!res.ok) {
        const text = await res.text()
        return { data: null, error: new Error(`HTTP ${res.status}: ${text}`) }
      }

      if (this.method === 'DELETE') return { data: null, error: null }

      const json = await res.json()

      if (this.returnSingle || this.returnMaybeSingle) {
        const item = Array.isArray(json) ? (json[0] ?? null) : (json ?? null)
        return { data: item, error: null }
      }

      return { data: json, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
    }
  }
}

export interface DbClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any
}

export function createDbClient(supabaseUrl: string, anonKey: string): DbClient {
  const restBase = `${supabaseUrl}/rest/v1`
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  }
  return {
    from(table: string) {
      return new QueryBuilder(restBase, headers, table)
    },
  }
}

export function getDb(context: unknown): DbClient | null {
  return (context as { supabase?: DbClient })?.supabase ?? null
}
