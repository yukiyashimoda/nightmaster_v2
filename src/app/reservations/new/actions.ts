'use server'

import { createReservation } from '@/lib/kv'
import { getSessionUser } from '@/lib/auth'
import type { Reservation } from '@/types'

export async function createReservationAction(
  data: Omit<Reservation, 'id' | 'updatedAt' | 'updatedBy'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const updatedBy = (await getSessionUser()) ?? ''
    const reservation = await createReservation({ ...data, updatedBy })
    return { success: true, id: reservation.id }
  } catch {
    return { success: false, error: '登録に失敗しました' }
  }
}
