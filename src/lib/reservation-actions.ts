'use server'

import { updateReservation, deleteReservation } from '@/lib/kv'
import { VALID_PASS } from '@/lib/auth'
import type { Reservation } from '@/types'

export async function updateReservationAction(
  id: string,
  data: Partial<Omit<Reservation, 'id' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateReservation(id, data)
    return { success: true }
  } catch {
    return { success: false, error: '更新に失敗しました' }
  }
}

export async function deleteReservationAction(
  id: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (password !== VALID_PASS) return { success: false, error: 'パスワードが違います' }
  try {
    await deleteReservation(id)
    return { success: true }
  } catch {
    return { success: false, error: '削除に失敗しました' }
  }
}
