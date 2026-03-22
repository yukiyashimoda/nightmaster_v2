import { redirect } from 'react-router'
import type { Route } from '../+types/routes/store-setup'
import { parseAuthCookies, decodeJWT, makeAuthCookies } from '../../src/lib/auth.server'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'

export async function loader({ request }: Route.LoaderArgs) {
  const { accessToken } = parseAuthCookies(request)
  if (!accessToken) throw redirect('/login')
  return {}
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase } = context
  const { accessToken, refreshToken } = parseAuthCookies(request)

  if (!accessToken || !refreshToken) throw redirect('/login')

  const payload = decodeJWT(accessToken)
  if (!payload?.sub) throw redirect('/login')

  const formData = await request.formData()
  const storeName = (formData.get('store_name') as string)?.trim()

  if (!storeName) return { error: '店舗名を入力してください' }

  if (!supabase) {
    return { error: 'データベース接続がありません（環境変数を確認してください）' }
  }

  try {
    const storeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const { error: storeError } = await supabase.from('stores').insert({
      id: storeId,
      name: storeName,
      owner_id: payload.sub,
      created_at: now,
    })

    if (storeError) {
      return { error: `店舗登録に失敗しました: ${storeError?.message ?? JSON.stringify(storeError)}` }
    }

    const { error: linkError } = await supabase.from('user_stores').insert({
      user_id: payload.sub,
      store_id: storeId,
      role: 'owner',
    })

    if (linkError) {
      return { error: `店舗連携に失敗しました: ${linkError?.message ?? JSON.stringify(linkError)}` }
    }

    const cookies = makeAuthCookies(accessToken, refreshToken, storeId)
    return redirect('/', {
      headers: cookies.map((c) => ['Set-Cookie', c] as [string, string]),
    })
  } catch (e) {
    return { error: `エラーが発生しました: ${e instanceof Error ? e.message : JSON.stringify(e)}` }
  }
}

export default function StoreSetupPage({ actionData }: Route.ComponentProps) {
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
          <div>
            <h1 className="text-lg font-bold text-brand-plum">店舗登録</h1>
            <p className="text-sm text-brand-plum/60 mt-1">管理する店舗の名前を入力してください</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
              {error}
            </div>
          )}

          <form method="post" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-brand-plum">店舗名</Label>
              <Input name="store_name" required placeholder="例: Club Neo Snack" autoComplete="off" />
            </div>
            <Button type="submit" className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
              店舗を登録する
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
