import { Link } from 'react-router'
import type { Route } from '../+types/routes/settings'
import { Store, Bell, User, Users, ChevronRight } from 'lucide-react'

export function loader(_: Route.LoaderArgs) {
  return {}
}

const items = [
  {
    to: '/settings/store',
    icon: Store,
    label: '店舗設定',
    description: '店舗名・営業時間・定休日',
  },
  {
    to: '/settings/alert',
    icon: Bell,
    label: 'アラート設定',
    description: '来店なし警告のしきい値',
  },
  {
    to: '/settings/account',
    icon: User,
    label: 'アカウント設定',
    description: 'メールアドレス・パスワード変更',
  },
  {
    to: '/settings/members',
    icon: Users,
    label: 'メンバー管理',
    description: 'スタッフの一覧・削除',
  },
]

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#F5F1EE] px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-brand-plum">設定</h1>

      <div className="space-y-2">
        {items.map(({ to, icon: Icon, label, description }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-brand-beige shadow-sm hover:border-brand-plum/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-brand-plum/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-brand-plum" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-brand-plum">{label}</p>
              <p className="text-sm text-brand-plum/50">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-brand-plum/30 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
