'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const result = await loginAction({
      id: form.id_field.value,
      pass: form.pass_field.value,
    })
    setLoading(false)
    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      setError(result.error ?? 'ログインに失敗しました')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex flex-col leading-none gap-0.5">
<span className="text-brand-plum text-base" style={{ fontFamily: 'var(--font-audiowide)' }}><span style={{ color: '#F1896C' }}>N</span>ight Master v1</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-beige shadow-sm p-6">
          <h1 className="text-lg font-bold text-brand-plum mb-5">ログイン</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-brand-plum">ID</Label>
              <Input name="id_field" required placeholder="ID を入力" autoComplete="username" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-brand-plum">パスワード</Label>
              <Input name="pass_field" type="password" required placeholder="パスワードを入力" autoComplete="current-password" />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
