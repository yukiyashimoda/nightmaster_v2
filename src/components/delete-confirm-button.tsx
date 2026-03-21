import { useState, useRef, useEffect } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteConfirmButtonProps {
  actionUrl: string
  redirectTo: string
  itemName: string
}

export function DeleteConfirmButton({ actionUrl, redirectTo, itemName }: DeleteConfirmButtonProps) {
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Watch for successful delete
  const prevState = useRef(fetcher.state)
  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      if (fetcher.data?.success) {
        handleClose()
        navigate(redirectTo)
      } else if (fetcher.data?.error) {
        setError(fetcher.data.error)
        setPassword('')
      }
    }
    prevState.current = fetcher.state
  }, [fetcher.state, fetcher.data])

  const handleClose = () => {
    setOpen(false)
    setPassword('')
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetcher.submit(
      { _intent: 'delete', password },
      { method: 'post', action: actionUrl, encType: 'application/json' }
    )
  }

  const loading = fetcher.state !== 'idle'

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-brand-coral/40 text-brand-coral hover:bg-brand-coral/10 hover:text-brand-coral"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        削除
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-coral">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-bold text-brand-plum">削除の確認</h2>
              </div>
              <button onClick={handleClose} className="text-brand-plum/50 hover:text-brand-plum">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-brand-plum/80">
              <span className="font-semibold text-brand-plum">「{itemName}」</span> を削除します。
              この操作は取り消せません。
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-brand-plum">
                  パスワードを入力して確認
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-brand-coral">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 bg-brand-coral hover:bg-brand-coral text-white"
                >
                  {loading ? '削除中...' : '削除する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
