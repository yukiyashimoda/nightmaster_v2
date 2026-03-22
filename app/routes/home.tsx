import { Link } from 'react-router'
import type { Route } from '../+types/routes/home'
import { getDb } from '../lib/db.server'
import { getCustomers, getBottles, getVisitRecords, getCasts, getReservations } from '../../src/lib/kv.server'
import { formatDate } from '../../src/lib/utils'
import { AlertTriangle, Calendar, CalendarDays, Users, TrendingUp } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { GiAmpleDress } from 'react-icons/gi'
import { FaAddressCard } from 'react-icons/fa'
import { CastRanking } from '../../src/components/cast-ranking'
import { ReservationCard } from '../../src/components/reservation-card'

export async function loader({ context }: Route.LoaderArgs) {
  console.log("home loader called")
  try {
    const db = getDb(context)
    console.log("home loader db:", !!db)
    const [customers, bottles, visits, casts, reservations] = await Promise.all([
      getCustomers(db),
      getBottles(db),
      getVisitRecords(db),
      getCasts(db),
      getReservations(db),
    ])
    console.log("home loader ok, customers:", customers.length)
    return { customers, bottles, visits, casts, reservations }
  } catch (e) {
    console.error("home loader error:", String(e))
    throw e
  }
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { customers, bottles, visits, casts, reservations } = loaderData
  const loggedIn = true

  // JST（UTC+9）基準で日付を計算
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const alertCustomers = customers.filter((c) => c.isAlert)
  const activeCustomers = customers.filter(
    (c) => c.lastVisitDate && new Date(c.lastVisitDate) >= thirtyDaysAgo
  )
  const recentVisits = visits
    .filter((v) => new Date(v.visitDate) >= sevenDaysAgo)
    .slice(0, 5)

  const castMap = new Map(casts.map((c) => [c.id, c]))
  const customerMap = new Map(customers.map((c) => [c.id, c]))

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayReservations = reservations
    .filter((r) => r.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time))

  const bottlesByCustomer = new Map<string, number>()
  for (const b of bottles) {
    bottlesByCustomer.set(b.customerId, (bottlesByCustomer.get(b.customerId) ?? 0) + 1)
  }

  return (
    <div className="min-h-screen bg-[#F5F1EE] px-4 py-6 pb-24 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-plum">ダッシュボード</h1>
        <p className="text-sm text-brand-plum/50 mt-0.5">{now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/customers" className="rounded-xl bg-white border border-brand-beige shadow-sm p-4 hover:border-brand-plum/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <FaAddressCard size={16} className="text-brand-plum/50" />
            <p className="text-xs text-brand-plum/50">総顧客数</p>
          </div>
          <p className="text-2xl font-bold text-brand-plum">{customers.length}<span className="text-sm font-normal ml-1">名</span></p>
        </Link>

        <Link to="/customers" className="rounded-xl bg-white border border-brand-beige shadow-sm p-4 hover:border-brand-plum/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-brand-plum/50" />
            <p className="text-xs text-brand-plum/50">30日以内来店</p>
          </div>
          <p className="text-2xl font-bold text-brand-plum">{activeCustomers.length}<span className="text-sm font-normal ml-1">名</span></p>
        </Link>

        <Link to="/customers" className="rounded-xl bg-white border border-brand-beige shadow-sm p-4 hover:border-brand-plum/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <GiBrandyBottle size={16} className="text-brand-plum/50" />
            <p className="text-xs text-brand-plum/50">ボトルキープ数</p>
          </div>
          <p className="text-2xl font-bold text-brand-plum">{bottles.length}<span className="text-sm font-normal ml-1">本</span></p>
        </Link>

        <Link to="/casts" className="rounded-xl bg-white border border-brand-beige shadow-sm p-4 hover:border-brand-plum/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <GiAmpleDress size={16} className="text-brand-plum/50" />
            <p className="text-xs text-brand-plum/50">キャスト数</p>
          </div>
          <p className="text-2xl font-bold text-brand-plum">{casts.length}<span className="text-sm font-normal ml-1">名</span></p>
        </Link>
      </div>

      {/* Today's Reservations */}
      <div>
        <h2 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          本日の予約
          <span className="text-brand-plum font-bold">{todayReservations.length}</span>
        </h2>
        {todayReservations.length === 0 ? (
          <p className="text-sm text-brand-plum/50">本日の予約はありません</p>
        ) : (
          <div className="space-y-2">
            {todayReservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                customerMap={customerMap}
                customers={customers}
                castMap={castMap}
                casts={casts}
                bottlesByCustomer={bottlesByCustomer}
                loggedIn={loggedIn}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cast Ranking */}
      <CastRanking casts={casts} visits={visits} />

      {/* Alert Customers */}
      {alertCustomers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-brand-coral" />
            要確認顧客
            <span className="text-brand-coral font-bold">{alertCustomers.length}</span>
          </h2>
          <div className="space-y-2">
            {alertCustomers.map((c) => (
              <Link
                key={c.id}
                to={`/customers/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-brand-coral/30 shadow-sm hover:border-brand-coral/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand-coral/20 flex items-center justify-center text-[10px] font-bold text-brand-coral shrink-0">
                  {c.designatedCastIds[0] ? (castMap.get(c.designatedCastIds[0])?.ruby ?? 'FREE') : 'FREE'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-plum truncate">{c.name}</p>
                  {c.alertReason && (
                    <p className="text-xs text-brand-coral/80 truncate">{c.alertReason}</p>
                  )}
                </div>
                <AlertTriangle className="h-4 w-4 text-brand-coral shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Visits */}
      <div>
        <h2 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          直近7日の来店履歴
        </h2>
        {recentVisits.length === 0 ? (
          <p className="text-sm text-brand-plum/50">直近7日の来店記録はありません</p>
        ) : (
          <div className="space-y-2">
            {recentVisits.map((v) => {
              const customer = customerMap.get(v.customerId)
              const designatedNames = v.designatedCastIds
                .map((id) => castMap.get(id)?.name)
                .filter(Boolean)
                .join('・')
              return (
                <Link
                  key={v.id}
                  to={`/customers/${v.customerId}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-brand-beige shadow-sm hover:border-brand-plum/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-gold/20 flex items-center justify-center text-xs font-bold text-brand-plum shrink-0">
                    {customer?.name.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-plum truncate">{customer?.name ?? '不明'}</p>
                    <p className="text-xs text-brand-plum/50">
                      {formatDate(v.visitDate)}
                      {designatedNames && ` ・ ${designatedNames}`}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      {loggedIn && (
        <div>
          <h2 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            クイックアクセス
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/customers/new"
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-brand-plum text-white font-medium text-sm shadow-sm hover:bg-brand-plum/90 transition-colors"
            >
              <FaAddressCard size={16} />
              新規顧客登録
            </Link>
            <Link
              to="/customers"
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white border border-brand-beige text-brand-plum font-medium text-sm shadow-sm hover:border-brand-plum/30 transition-colors"
            >
              <FaAddressCard size={16} />
              顧客一覧を見る
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
