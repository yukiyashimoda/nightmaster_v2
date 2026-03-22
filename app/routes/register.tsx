import { redirect } from 'react-router'
import type { Route } from '../+types/routes/register'
import { isAuthenticated, makeAuthCookies, makePkceCookie } from '../../src/lib/auth.server'
import { signUp, generateCodeVerifier, generateCodeChallenge, getOAuthUrl } from '../lib/supabase-auth.server'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'

export async function loader({ request }: Route.LoaderArgs) {
  if (isAuthenticated(request)) {
    throw redirect('/')
  }
  return {}
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabaseUrl, anonKey } = context
  const formData = await request.formData()
  const intent = formData.get('intent') as string

  // Social OAuth (Google / Apple)
  if (intent === 'google' || intent === 'apple') {
    if (!supabaseUrl) return { error: 'サーバー設定が不完全です' }
    const origin = new URL(request.url).origin
    const redirectTo = `${origin}/auth/callback`
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const oauthUrl = getOAuthUrl(supabaseUrl, intent, redirectTo, challenge)
    return redirect(oauthUrl, {
      headers: { 'Set-Cookie': makePkceCookie(verifier) },
    })
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('password_confirm') as string

  if (password !== passwordConfirm) {
    return { error: 'パスワードが一致しません' }
  }

  if (!supabaseUrl || !anonKey) {
    return { error: 'サーバー設定が不完全です' }
  }

  try {
    const tokens = await signUp(supabaseUrl, anonKey, email, password)

    // Set temporary auth cookies (no storeId yet) and redirect to store setup
    const cookies = makeAuthCookies(tokens.access_token, tokens.refresh_token, '')
    return redirect('/store-setup', {
      headers: cookies.map((c) => ['Set-Cookie', c] as [string, string]),
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : '登録に失敗しました' }
  }
}

export default function RegisterPage({ actionData }: Route.ComponentProps) {
  const error = actionData?.error

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="text-brand-plum text-base font-audiowide">
            <span style={{ color: '#F1896C' }}>N</span>ight Master
          </span>
        </div>

        <div className="bg-white rounded-xl border border-brand-beige shadow-sm p-6 space-y-5">
          <h1 className="text-lg font-bold text-brand-plum">新規登録</h1>

          {error && (
            <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
              {error}
            </div>
          )}

          <form method="post" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-brand-plum">メールアドレス</Label>
              <Input name="email" type="email" required placeholder="example@email.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-plum">パスワード</Label>
              <Input name="password" type="password" required placeholder="8文字以上" autoComplete="new-password" minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-plum">パスワード（確認）</Label>
              <Input name="password_confirm" type="password" required placeholder="パスワードを再入力" autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
              アカウントを作成
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-beige" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-brand-plum/50">または</span>
            </div>
          </div>

          <div className="space-y-2">
            <form method="post">
              <input type="hidden" name="intent" value="google" />
              <Button type="submit" variant="outline" className="w-full h-11 border-brand-beige font-medium">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Googleで登録
              </Button>
            </form>

          </div>

          <p className="text-center text-sm text-brand-plum/50">
            すでにアカウントをお持ちの方は{' '}
            <a href="/login" className="text-brand-plum font-medium hover:underline">
              ログイン
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
