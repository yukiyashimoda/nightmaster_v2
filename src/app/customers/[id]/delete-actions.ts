'use server'

import { deleteCustomer } from '@/lib/kv'
import { VALID_PASS } from '@/lib/auth'

export async function deleteCustomerAction(
  id: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (password !== VALID_PASS) {
    return { success: false, error: 'パスワードが違います' }
  }
  await deleteCustomer(id)
  return { success: true }
}
