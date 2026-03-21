'use server'

import { updateVisitRecord, deleteVisitRecord } from '@/lib/kv'
import { VALID_PASS } from '@/lib/auth'
import type { VisitRecord } from '@/types'

export async function updateVisitAction(
  id: string,
  data: Partial<Omit<VisitRecord, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await updateVisitRecord(id, data)
    if (!result) return { success: false, error: '来店記録が見つかりません' }
    return { success: true }
  } catch {
    return { success: false, error: '更新に失敗しました' }
  }
}

export async function deleteVisitAction(
  id: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (password !== VALID_PASS) {
    return { success: false, error: 'パスワードが違います' }
  }
  try {
    await deleteVisitRecord(id)
    return { success: true }
  } catch {
    return { success: false, error: '削除に失敗しました' }
  }
}
