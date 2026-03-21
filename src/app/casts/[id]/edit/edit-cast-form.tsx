import { useState, useEffect } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Cast } from '@/types'

export function EditCastForm({ cast }: { cast: Cast }) {
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) {
      navigate(`/casts/${cast.id}`)
    } else if (fetcher.state === 'idle' && fetcher.data?.error) {
      setError(fetcher.data.error)
      setLoading(false)
    }
  }, [fetcher.state, fetcher.data])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    fetcher.submit(
      {
        name: data.get('name') as string,
        ruby: data.get('ruby') as string,
        memo: data.get('memo') as string,
      },
      { method: 'post', encType: 'application/json' }
    )
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
