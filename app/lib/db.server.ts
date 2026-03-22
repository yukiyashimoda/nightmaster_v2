import { neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless'

/**
 * Cloudflare Pages / Workers エッジ向け設定
 *
 * neon() は WebSocket ではなく HTTP fetch を使用するため
 * Cloudflare Workers でそのまま動作する。
 * fetchConnectionCache を有効にすることで、同一アイソレート内の
 * リクエスト間で HTTP 接続を再利用しスループットを向上させる。
 */
neonConfig.fetchConnectionCache = true

export type Sql = NeonQueryFunction<false, false>

/** モジュールスコープのシングルトン — アイソレートの寿命中に一度だけ生成 */
let _sql: Sql | null = null

/**
 * 型安全な Neon SQL クライアントを返す。
 * DATABASE_URL が未設定の場合は起動時に明示的なエラーを投げる。
 */
export function getDB(): Sql {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    _sql = neon(url)
  }
  return _sql
}
