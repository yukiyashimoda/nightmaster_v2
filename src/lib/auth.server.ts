export const COOKIE_ACCESS = 'nm-access'
export const COOKIE_REFRESH = 'nm-refresh'
export const COOKIE_STORE = 'nm-store'
export const COOKIE_PKCE = 'nm-pkce'

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf('=')
        if (idx < 0) return [c, '']
        return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()]
      })
  )
}

export function parseAuthCookies(request: Request) {
  const cookies = parseCookies(request.headers.get('Cookie') ?? '')
  return {
    accessToken: cookies[COOKIE_ACCESS] ?? null,
    refreshToken: cookies[COOKIE_REFRESH] ?? null,
    storeId: cookies[COOKIE_STORE] ?? null,
    pkceVerifier: cookies[COOKIE_PKCE] ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function isAuthenticated(request: Request): boolean {
  const { accessToken } = parseAuthCookies(request)
  if (!accessToken) return false
  const payload = decodeJWT(accessToken)
  if (!payload) return false
  if (payload.exp && payload.exp * 1000 < Date.now()) return false
  return true
}

export function getSessionUser(request: Request): string | null {
  const { accessToken } = parseAuthCookies(request)
  if (!accessToken) return null
  const payload = decodeJWT(accessToken)
  return payload?.email ?? payload?.sub ?? null
}

const COOKIE_OPTS = 'HttpOnly; Path=/; Max-Age=604800; SameSite=Lax' // 7 days
const COOKIE_CLEAR = 'HttpOnly; Path=/; Max-Age=0; SameSite=Lax'

export function makeAuthCookies(accessToken: string, refreshToken: string, storeId: string): string[] {
  return [
    `${COOKIE_ACCESS}=${accessToken}; ${COOKIE_OPTS}`,
    `${COOKIE_REFRESH}=${refreshToken}; ${COOKIE_OPTS}`,
    `${COOKIE_STORE}=${storeId}; ${COOKIE_OPTS}`,
  ]
}

export function clearAuthCookies(): string[] {
  return [
    `${COOKIE_ACCESS}=; ${COOKIE_CLEAR}`,
    `${COOKIE_REFRESH}=; ${COOKIE_CLEAR}`,
    `${COOKIE_STORE}=; ${COOKIE_CLEAR}`,
  ]
}

export function makeStoreCookie(storeId: string): string {
  return `${COOKIE_STORE}=${storeId}; ${COOKIE_OPTS}`
}

export function makePkceCookie(verifier: string): string {
  return `${COOKIE_PKCE}=${verifier}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax`
}

export function clearPkceCookie(): string {
  return `${COOKIE_PKCE}=; ${COOKIE_CLEAR}`
}
