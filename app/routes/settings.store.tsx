import { redirect } from 'react-router'
import type { Route } from '../+types/routes/settings.store'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

const DAYS = ['日', '月', '火', '水', '木', '金', '土']

async function getStore(supabase: any, storeId: string) {
  const { data } = await supabase.from('stores').select('*').eq('id', storeId).maybeSingle()
  return data
}

export async function loader({ context }: Route.LoaderArgs) {
  const { supabase, storeId } = context
  if (!storeId) throw redirect('/store-setup')
  const store = supabase ? await getStore(supabase, storeId).catch(() => null) : null
  return { store }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, storeId } = context
  if (!storeId || !supabase) return { error: '店舗情報が取得できません' }

  const formData = await request.formData()
  const name = (formData.get('name') as string)?.trim()
  const openingTime = formData.get('opening_time') as string
  const closingTime = formData.get('closing_time') as string
  const closedDays = DAYS.map((_, i) => formData.get(`day_${i}`) === 'on' ? i : null).filter((v) => v !== null)

  if (!name) return { error: '店舗名を入力してください' }

  try {
    const { error } = await supabase.from('stores').update({
      name,
      opening_time: openingTime || '19:00',
      closing_time: closingTime || '02:00',
      closed_days: JSON.stringify(closedDays),
    }).eq('id', storeId)

    if (error) return { error: `保存に失敗しました: ${error?.message ?? error}` }
    return { success: true }
  } catch (e) {
    return { error: `エラーが発生しました: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export default function StoreSettingsPage({ loaderData, actionData }: Route.ComponentProps) {
  const store = loaderData?.store
  const closedDays: number[] = store?.closed_days ? JSON.parse(store.closed_days) : [0]

  return (
    <div className="min-h-screen bg-[#F5F1EE] px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/settings" className="text-brand-plum/60 hover:text-brand-plum">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-brand-plum">店舗設定</h1>
      </div>

      <div className="bg-white rounded-xl border border-brand-beige shadow-sm p-5 space-y-5">
        {actionData?.error && (
          <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
            {actionData.error}
          </div>
        )}
        {actionData?.success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            保存しました
          </div>
        )}

        <form method="post" className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-brand-plum">店舗名</Label>
            <Input name="name" defaultValue={store?.name ?? ''} required placeholder="店舗名を入力" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-brand-plum">営業開始時間</Label>
              <Input name="opening_time" type="time" defaultValue={store?.opening_time ?? '19:00'} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-plum">営業終了時間</Label>
              <Input name="closing_time" type="time" defaultValue={store?.closing_time ?? '02:00'} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-brand-plum">定休日</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, i) => {
                const checked = closedDays.includes(i)
                return (
                  <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`day_${i}`}
                      defaultChecked={checked}
                      className="w-4 h-4 accent-brand-plum"
                    />
                    <span className="text-base text-brand-plum">{day}曜</span>
                  </label>
                )
              })}
            </div>
          </div>

          <Button type="submit" className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
            保存する
          </Button>
        </form>
      </div>
    </div>
  )
}
