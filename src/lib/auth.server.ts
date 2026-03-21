export const SESSION_COOKIE = 'bottle-session'
export const SESSION_VALUE = 'authenticated_neo_snack_l'
export const VALID_ID = 'test'
export const VALID_PASS = '3150'

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

export function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('Cookie') ?? ''
  const cookies = parseCookies(cookieHeader)
  return cookies[SESSION_COOKIE] === SESSION_VALUE
}

export function getSessionUser(request: Request): string | null {
  return isAuthenticated(request) ? VALID_ID : null
}

export function makeSessionCookie(): string {
  return `${SESSION_COOKIE}=${SESSION_VALUE}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}
