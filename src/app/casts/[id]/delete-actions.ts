'use server'

import { deleteCast } from '@/lib/kv'
import { VALID_PASS } from '@/lib/auth'

export async function deleteCastAction(
  id: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (password !== VALID_PASS) {
    return { success: false, error: 'パスワードが違います' }
  }
  await deleteCast(id)
  return { success: true }
}
