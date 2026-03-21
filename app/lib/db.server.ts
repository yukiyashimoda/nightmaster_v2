import { neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless'

neonConfig.fetchConnectionCache = true

export type Sql = NeonQueryFunction<false, false>

let _url: string | undefined = undefined
let _sql: Sql | null = null

/**
 * Cloudflare Pages の getLoadContext から DATABASE_URL を受け取る。
 * process.env は Workers では読み取り専用のため、専用の setter で保持する。
 */
export function initDB(url: string) {
  if (_url !== url) {
    _url = url
    _sql = null
  }
}

/** DATABASE_URL が利用可能かどうかを返す */
export function hasDB(): boolean {
  return !!resolveUrl()
}

function resolveUrl(): string | undefined {
  return (
    _url ??
    (globalThis as Record<string, unknown>).__DATABASE_URL as string | undefined ??
    process.env.DATABASE_URL
  )
}

export function getDB(): Sql {
  const url = resolveUrl()
  // URL が変わったときはクライアントを再生成
  if (!_sql || _url !== url) {
    if (!url) throw new Error('DATABASE_URL is not set')
    _url = url
    _sql = neon(url)
  }
  return _sql
}
