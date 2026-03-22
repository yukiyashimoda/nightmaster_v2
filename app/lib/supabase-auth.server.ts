const AUTH = (url: string) => `${url}/auth/v1`

interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email?: string }
}

export async function signInWithPassword(
  supabaseUrl: string, anonKey: string, email: string, password: string
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH(supabaseUrl)}/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.msg || 'ログインに失敗しました')
  }
  return res.json()
}

export async function signUp(
  supabaseUrl: string, anonKey: string, email: string, password: string
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH(supabaseUrl)}/signup`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.msg || '登録に失敗しました')
  }
  return res.json()
}

export async function signOut(supabaseUrl: string, anonKey: string, accessToken: string): Promise<void> {
  await fetch(`${AUTH(supabaseUrl)}/logout`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
  })
}

export async function refreshSession(
  supabaseUrl: string, anonKey: string, refreshToken: string
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH(supabaseUrl)}/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

// PKCE helpers for Google OAuth
function base64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64urlEncode(array.buffer)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64urlEncode(hash)
}

export function getOAuthUrl(
  supabaseUrl: string, provider: string, redirectTo: string, codeChallenge: string
): string {
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${AUTH(supabaseUrl)}/authorize?${params}`
}

export async function updatePassword(
  supabaseUrl: string, anonKey: string, accessToken: string, newPassword: string
): Promise<void> {
  const res = await fetch(`${AUTH(supabaseUrl)}/user`, {
    method: 'PUT',
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.msg || 'パスワード変更に失敗しました')
  }
}

export async function exchangeCode(
  supabaseUrl: string, anonKey: string, code: string, codeVerifier: string
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH(supabaseUrl)}/token?grant_type=pkce`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.msg || 'OAuth認証に失敗しました')
  }
  return res.json()
}
