import { redirect } from 'react-router'
import type { Route } from '../+types/routes/settings.alert'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export async function loader({ context }: Route.LoaderArgs) {
  const { supabase, storeId } = context
  if (!storeId) throw redirect('/store-setup')
  let alertThresholdDays = 365
  if (supabase) {
    const { data } = await supabase.from('stores').select('alert_threshold_days').eq('id', storeId).maybeSingle().catch(() => ({ data: null }))
    if (data?.alert_threshold_days) alertThresholdDays = data.alert_threshold_days
  }
  return { alertThresholdDays }
}

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase, storeId } = context
  if (!storeId || !supabase) return { error: '店舗情報が取得できません' }

  const formData = await request.formData()
  const days = parseInt(formData.get('alert_threshold_days') as string, 10)

  if (isNaN(days) || days < 1) return { error: '有効な日数を入力してください' }

  try {
    const { error } = await supabase.from('stores').update({ alert_threshold_days: days }).eq('id', storeId)
    if (error) return { error: `保存に失敗しました: ${error?.message ?? error}` }
    return { success: true }
  } catch (e) {
    return { error: `エラーが発生しました: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export default function AlertSettingsPage({ loaderData, actionData }: Route.ComponentProps) {
  const { alertThresholdDays } = loaderData

  return (
    <div className="min-h-screen bg-[#F5F1EE] px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/settings" className="text-brand-plum/60 hover:text-brand-plum">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-brand-plum">アラート設定</h1>
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
            <Label className="text-brand-plum">来店なしアラート（日数）</Label>
            <p className="text-sm text-brand-plum/50">最終来店からこの日数を超えた顧客をオレンジ表示します</p>
            <div className="flex items-center gap-2">
              <Input
                name="alert_threshold_days"
                type="number"
                min="1"
                max="9999"
                defaultValue={alertThresholdDays}
                className="w-32"
              />
              <span className="text-base text-brand-plum">日</span>
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
