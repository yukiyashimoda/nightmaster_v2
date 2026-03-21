import { useState, useEffect } from 'react'
import { useFetcher, useRevalidator } from 'react-router'
import { Plus, X } from 'lucide-react'
import { GiAmpleDress } from 'react-icons/gi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function NewCastFab() {
  const fetcher = useFetcher()
  const { revalidate } = useRevalidator()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [ruby, setRuby] = useState('')
  const [memo, setMemo] = useState('')

  const handleClose = () => {
    setOpen(false)
    setError('')
    setName('')
    setRuby('')
    setMemo('')
  }

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) {
      handleClose()
      revalidate()
    } else if (fetcher.state === 'idle' && fetcher.data?.error) {
      setError(fetcher.data.error)
      setLoading(false)
    }
  }, [fetcher.state, fetcher.data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    fetcher.submit({ name, ruby, memo }, { method: 'post', action: '/casts', encType: 'application/json' })
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-brand-plum text-white shadow-lg flex items-center justify-center hover:bg-brand-plum/90 transition-colors"
        aria-label="キャストを追加"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-50 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-beige">
              <div className="flex items-center gap-2">
                <GiAmpleDress size={16} className="text-brand-plum/60" />
                <h2 className="font-bold text-brand-plum">キャストを追加</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-brand-plum/50 hover:text-brand-plum p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-brand-plum">
                  源氏名<span className="text-brand-coral ml-0.5">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="桜"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-brand-plum">
                  ふりがな<span className="text-brand-coral ml-0.5">*</span>
                </Label>
                <Input
                  value={ruby}
                  onChange={(e) => setRuby(e.target.value)}
                  placeholder="さくら"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-brand-plum">メモ</Label>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="出勤曜日、担当など"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11"
              >
                {loading ? '登録中...' : 'キャストを登録する'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
