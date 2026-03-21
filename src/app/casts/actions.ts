'use server'

import { createCast } from '@/lib/kv'
import { getSessionUser } from '@/lib/auth'

export async function createCastAction(
  data: { name: string; ruby: string; memo: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.name.trim() || !data.ruby.trim()) {
      return { success: false, error: '名前とふりがなは必須です' }
    }
    const updatedBy = (await getSessionUser()) ?? ''
    await createCast({ name: data.name.trim(), ruby: data.ruby.trim(), memo: data.memo.trim(), updatedBy })
    return { success: true }
  } catch {
    return { success: false, error: '登録に失敗しました' }
  }
}
