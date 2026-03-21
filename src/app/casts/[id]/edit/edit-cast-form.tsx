'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCastAction } from './actions'
import type { Cast } from '@/types'

export function EditCastForm({ cast }: { cast: Cast }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const result = await updateCastAction(cast.id, {
      name: data.get('name') as string,
      ruby: data.get('ruby') as string,
      memo: data.get('memo') as string,
    })
    setLoading(false)
    if (result.success) {
      router.push(`/casts/${cast.id}`)
    } else {
      setError(result.error ?? '更新に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-gray-700">源氏名<span className="text-red-500 ml-0.5">*</span></Label>
        <Input name="name" required defaultValue={cast.name} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-700">ふりがな<span className="text-red-500 ml-0.5">*</span></Label>
        <Input name="ruby" required defaultValue={cast.ruby} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-gray-700">メモ</Label>
        <Textarea name="memo" defaultValue={cast.memo} rows={4} placeholder="出勤曜日、担当など" />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold h-11"
      >
        {loading ? '更新中...' : '更新する'}
      </Button>
    </form>
  )
}
