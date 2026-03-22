import type { Route } from '../+types/routes/settings.account'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { updatePassword } from '../lib/supabase-auth.server'
import { parseAuthCookies } from '../../src/lib/auth.server'

export async function loader({ context }: Route.LoaderArgs) {
  return { email: context.userEmail ?? '' }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabaseUrl, anonKey, accessToken } = context
  if (!supabaseUrl || !anonKey || !accessToken) return { error: '認証情報が取得できません' }

  const formData = await request.formData()
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8) return { error: 'パスワードは8文字以上で入力してください' }
  if (newPassword !== confirmPassword) return { error: 'パスワードが一致しません' }

  try {
    await updatePassword(supabaseUrl, anonKey, accessToken, newPassword)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'パスワード変更に失敗しました' }
  }
}

export default function AccountSettingsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { email } = loaderData

  return (
    <div className="min-h-screen bg-[#F5F1EE] px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/settings" className="text-brand-plum/60 hover:text-brand-plum">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-brand-plum">アカウント設定</h1>
      </div>

      {/* メールアドレス */}
      <div className="bg-white rounded-xl border border-brand-beige shadow-sm p-5 space-y-3">
        <h2 className="text-base font-semibold text-brand-plum">メールアドレス</h2>
        <p className="text-base text-brand-plum/70 bg-brand-beige/40 rounded-lg px-3 py-2.5">{email || '—'}</p>
      </div>

      {/* パスワード変更 */}
      <div className="bg-white rounded-xl border border-brand-beige shadow-sm p-5 space-y-4">
        <h2 className="text-base font-semibold text-brand-plum">パスワード変更</h2>

        {actionData?.error && (
          <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
            {actionData.error}
          </div>
        )}
        {actionData?.success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            パスワードを変更しました
          </div>
        )}

        <form method="post" className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-brand-plum">新しいパスワード</Label>
            <Input name="new_password" type="password" placeholder="8文字以上" autoComplete="new-password" minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-brand-plum">新しいパスワード（確認）</Label>
            <Input name="confirm_password" type="password" placeholder="パスワードを再入力" autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
            変更する
          </Button>
        </form>
      </div>
    </div>
  )
}
