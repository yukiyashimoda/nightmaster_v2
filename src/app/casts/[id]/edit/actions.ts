'use server'

import { updateCast } from '@/lib/kv'
import { getSessionUser } from '@/lib/auth'

export async function updateCastAction(
  id: string,
  data: { name: string; ruby: string; memo: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.name.trim() || !data.ruby.trim()) {
      return { success: false, error: '名前とふりがなは必須です' }
    }
    const updatedBy = (await getSessionUser()) ?? ''
    const result = await updateCast(id, {
      name: data.name.trim(),
      ruby: data.ruby.trim(),
      memo: data.memo.trim(),
      updatedBy,
    })
    if (!result) return { success: false, error: 'キャストが見つかりません' }
    return { success: true }
  } catch {
    return { success: false, error: '更新に失敗しました' }
  }
}
