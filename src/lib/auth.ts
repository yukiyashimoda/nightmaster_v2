import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'bottle-session'
export const SESSION_VALUE = 'authenticated_neo_snack_l'
export const VALID_ID = 'test'
export const VALID_PASS = '3150'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export async function getSessionUser(): Promise<string | null> {
  const cookieStore = await cookies()
  if (cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE) return VALID_ID
  return null
}
