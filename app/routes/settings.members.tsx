import { redirect } from 'react-router'
import type { Route } from '../+types/routes/settings.members'
import { Button } from '../../src/components/ui/button'
import { ArrowLeft, User, Crown, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { decodeJWT } from '../../src/lib/auth.server'

interface Member {
  user_id: string
  role: string
  email?: string
}

export async function loader({ context }: Route.LoaderArgs) {
  const { supabase, storeId, userId } = context
  if (!storeId) throw redirect('/store-setup')

  let members: Member[] = []
  if (supabase && storeId) {
    const { data } = await supabase.from('user_stores').select('*').eq('store_id', storeId).catch(() => ({ data: null }))
    members = data ?? []
  }

  return { members, currentUserId: userId }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, storeId, userId } = context
  if (!storeId || !supabase) return { error: '店舗情報が取得できません' }

  const formData = await request.formData()
  const targetUserId = formData.get('user_id') as string

  if (targetUserId === userId) return { error: 'オーナー自身は削除できません' }

  try {
    const { error } = await supabase.from('user_stores').delete()
      .eq('store_id', storeId)
      .eq('user_id', targetUserId)
    if (error) return { error: `削除に失敗しました: ${error?.message ?? error}` }
    return { success: true }
  } catch (e) {
    return { error: `エラーが発生しました: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export default function MembersSettingsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { members, currentUserId } = loaderData

  return (
    <div className="min-h-screen bg-[#F5F1EE] px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/settings" className="text-brand-plum/60 hover:text-brand-plum">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-brand-plum">メンバー管理</h1>
      </div>

      {actionData?.error && (
        <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
          {actionData.error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-brand-beige shadow-sm divide-y divide-brand-beige">
        {members.length === 0 ? (
          <p className="p-4 text-sm text-brand-plum/50">メンバーがいません</p>
        ) : (
          members.map((m) => {
            const isOwner = m.role === 'owner'
            const isMe = m.user_id === currentUserId
            return (
              <div key={m.user_id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-brand-plum/10 flex items-center justify-center shrink-0">
                  {isOwner
                    ? <Crown className="h-4 w-4 text-brand-gold" />
                    : <User className="h-4 w-4 text-brand-plum/60" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-brand-plum truncate">
                    {m.user_id.slice(0, 8)}…
                    {isMe && <span className="ml-1.5 text-xs text-brand-plum/40">（自分）</span>}
                  </p>
                  <p className="text-sm text-brand-plum/50">{isOwner ? 'オーナー' : 'メンバー'}</p>
                </div>
                {!isOwner && !isMe && (
                  <form method="post">
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-8 w-8 p-0 border-brand-coral/30 text-brand-coral hover:bg-brand-coral/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 rounded-xl bg-brand-beige/40 border border-brand-beige text-sm text-brand-plum/60">
        <p className="font-medium text-brand-plum/80 mb-1">メンバーの招待</p>
        <p>スタッフが同じメールアドレスでアカウントを登録し、ログイン後に店舗IDを共有することでメンバーとして参加できます。</p>
      </div>
    </div>
  )
}
