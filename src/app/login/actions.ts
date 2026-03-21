'use server'

import { cookies } from 'next/headers'
import { SESSION_COOKIE, SESSION_VALUE, VALID_ID, VALID_PASS } from '@/lib/auth'

export async function loginAction(
  data: { id: string; pass: string }
): Promise<{ success: boolean; error?: string }> {
  if (data.id === VALID_ID && data.pass === VALID_PASS) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      sameSite: 'lax',
    })
    return { success: true }
  }
  return { success: false, error: 'IDまたはパスワードが違います' }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
