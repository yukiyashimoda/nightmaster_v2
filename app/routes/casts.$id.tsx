import type { Route } from '../+types/routes/casts.$id'
import { Link } from 'react-router'
import { ArrowLeft, Calendar, CalendarDays, Edit } from 'lucide-react'
import { Button } from '../../src/components/ui/button'
import { getSupabase } from '../lib/db.server'
import {
  getCast,
  getVisitRecordsByCast,
  getVisitRecordsByInStoreCast,
  getCustomers,
  getBottles,
  getCasts,
  getReservationsByCast,
} from '../../src/lib/kv.server'
import { CastVisitGroup } from '../../src/components/cast-visit-group'
import { CustomerCard } from '../../src/components/customer-card'
import { ReservationCard } from '../../src/components/reservation-card'
import { formatEditedBy } from '../../src/lib/utils'
import { DeleteConfirmButton } from '../../src/components/delete-confirm-button'

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = getSupabase(context)
  const { id } = params
  const [cast, visits, inStoreVisits, reservations, customers, allCasts, bottles] = await Promise.all([
    getCast(db, id),
    getVisitRecordsByCast(db, id),
    getVisitRecordsByInStoreCast(db, id),
    getReservationsByCast(db, id),
    getCustomers(db),
    getCasts(db),
    getBottles(db),
  ])

  if (!cast) {
    throw new Response(null, { status: 404 })
  }

  const bottlesByCustomer: Record<string, number> = {}
  for (const b of bottles) {
    bottlesByCustomer[b.customerId] = (bottlesByCustomer[b.customerId] ?? 0) + 1
  }

  // 場内指名時の本指名キャスト上位5名
  const coDesignatedCount = new Map<string, number>()
  for (const v of inStoreVisits) {
    for (const cid of v.designatedCastIds) {
      coDesignatedCount.set(cid, (coDesignatedCount.get(cid) ?? 0) + 1)
    }
  }
  const top5CoDesignated = Array.from(coDesignatedCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([castId, count]) => ({ cast: allCasts.find((c) => c.id === castId), count }))
    .filter((x) => x.cast)
  const maxCoCount = top5CoDesignated[0]?.count ?? 1

  // 本指名キャストに登録された顧客（designatedCastIds ベース）
  const designatedCustomers = customers
    .filter((c) => c.designatedCastIds.includes(id))
    .sort((a, b) => {
      const dateA = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0
      const dateB = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0
      return dateB - dateA
    })

  // 場内指名客（visit records ベース）最新来店日でソート
  const inStoreCustomerLatest = new Map<string, number>()
  for (const v of inStoreVisits) {
    const t = new Date(v.visitDate).getTime()
    if (!inStoreCustomerLatest.has(v.customerId) || inStoreCustomerLatest.get(v.customerId)! < t) {
      inStoreCustomerLatest.set(v.customerId, t)
    }
  }
  const customerMap = new Map(customers.map((c) => [c.id, c]))
  const inStoreCustomerIds = Array.from(inStoreCustomerLatest.keys())
    .sort((a, b) => inStoreCustomerLatest.get(b)! - inStoreCustomerLatest.get(a)!)
  const inStoreCustomers = inStoreCustomerIds
    .map((cid) => customerMap.get(cid))
    .filter(Boolean)

  // 指名履歴（visit records）顧客ごとにグループ化
  const visitsByCustomer = new Map<string, typeof visits>()
  for (const visit of visits) {
    const arr = visitsByCustomer.get(visit.customerId) ?? []
    arr.push(visit)
    visitsByCustomer.set(visit.customerId, arr)
  }
  const sortedCustomerIds = Array.from(visitsByCustomer.keys()).sort((a, b) => {
    const latestA = Math.max(...visitsByCustomer.get(a)!.map((v) => new Date(v.visitDate).getTime()))
    const latestB = Math.max(...visitsByCustomer.get(b)!.map((v) => new Date(v.visitDate).getTime()))
    return latestB - latestA
  })

  return {
    id,
    cast,
    visits,
    inStoreVisits,
    reservations,
    customers,
    allCasts,
    bottles,
    bottlesByCustomer,
    top5CoDesignated,
    maxCoCount,
    designatedCustomers,
    inStoreCustomers,
    visitsByCustomer: Object.fromEntries(visitsByCustomer),
    sortedCustomerIds,
  }
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const body = await request.json()
  if (body._intent === 'delete') {
    const { VALID_PASS } = await import('../../src/lib/auth.server')
    const { deleteCast } = await import('../../src/lib/kv.server')
    const { getSupabase: getSupabaseInAction } = await import('../lib/db.server')
    if (body.password !== VALID_PASS) {
      return Response.json({ success: false, error: 'パスワードが違います' })
    }
    const db = getSupabaseInAction(context)
    await deleteCast(db, params.id)
    return Response.json({ success: true })
  }
  return Response.json({ success: false })
}

export default function CastDetailPage({ loaderData }: Route.ComponentProps) {
  const {
    id,
    cast,
    visits,
    inStoreVisits,
    reservations,
    customers,
    allCasts,
    bottles,
    bottlesByCustomer,
    top5CoDesignated,
    maxCoCount,
    designatedCustomers,
    inStoreCustomers,
    visitsByCustomer,
    sortedCustomerIds,
  } = loaderData
  const loggedIn = true

  const customerMap = new Map(customers.map((c: any) => [c.id, c]))
  const castMap = new Map(allCasts.map((c: any) => [c.id, c]))
  const bottlesByCustomerMap = new Map(Object.entries(bottlesByCustomer))

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-brand-beige px-4 py-3 flex items-center gap-3">
        <Link to="/casts">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-plum/60">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-brand-plum flex-1">{cast.name}</h1>
        {loggedIn && (
          <div className="flex items-center gap-2">
            <Link to={`/casts/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-brand-beige text-brand-plum/80 hover:text-brand-plum">
                <Edit className="h-3.5 w-3.5 mr-1" />
                編集
              </Button>
            </Link>
            <DeleteConfirmButton
              actionUrl={`/casts/${id}`}
              redirectTo="/casts"
              itemName={cast.name}
            />
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-brand-beige bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-plum text-white flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
              {cast.ruby}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-plum">{cast.name}</h2>
            </div>
          </div>

          {/* メモ */}
          <div className="rounded-lg border border-brand-beige bg-white p-3">
            <p className="text-xs text-brand-plum/50 mb-1">メモ</p>
            {cast.memo ? (
              <p className="text-sm text-brand-plum whitespace-pre-wrap">{cast.memo}</p>
            ) : (
              <p className="text-sm text-brand-plum/50">なし</p>
            )}
          </div>

          {/* 担当顧客数 / 場内指名本数 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white border border-brand-beige p-3 text-center">
              <p className="text-2xl font-bold text-brand-plum">{designatedCustomers.length}</p>
              <p className="text-xs text-brand-plum/60 mt-0.5">担当顧客数</p>
            </div>
            <div className="rounded-lg bg-white border border-brand-beige p-3 text-center">
              <p className="text-2xl font-bold text-brand-plum">{inStoreVisits.length}</p>
              <p className="text-xs text-brand-plum/60 mt-0.5">場内指名本数</p>
            </div>
          </div>

          {/* 場内指名時の本指名キャスト上位5 */}
          {top5CoDesignated.length > 0 && (
            <div className="rounded-lg bg-white border border-brand-beige p-4 space-y-3">
              <p className="text-xs font-semibold text-brand-plum/60 uppercase tracking-wider">場内指名時の本指名キャスト TOP5</p>
              <div className="space-y-2.5">
                {top5CoDesignated.map(({ cast: c, count }: any) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-plum font-medium truncate">{c.name}</span>
                      <span className="text-brand-plum/60 tabular-nums ml-2 shrink-0">{count}回</span>
                    </div>
                    <div className="h-2 rounded-full bg-brand-beige overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-coral transition-all"
                        style={{ width: `${Math.round((count / maxCoCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cast.updatedBy && (
            <p className="text-xs text-brand-plum/50 text-right">
              {formatEditedBy(cast.updatedBy, cast.updatedAt)}
            </p>
          )}
        </div>

        {/* 指名客一覧 */}
        {designatedCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-1 flex items-center gap-2">
              指名客 ({designatedCustomers.length})
            </h3>
            <div>
              {designatedCustomers.map((customer: any) => {
                const customerBottles = bottles.filter((b: any) => b.customerId === customer.id)
                const designatedCastRuby = customer.designatedCastIds[0]
                  ? allCasts.find((c: any) => c.id === customer.designatedCastIds[0])?.ruby
                  : undefined
                return (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    bottles={customerBottles}
                    designatedCastRuby={designatedCastRuby}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* 場内指名客一覧 */}
        {inStoreCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-1 flex items-center gap-2">
              場内指名客 ({inStoreCustomers.length})
            </h3>
            <div>
              {inStoreCustomers.map((customer: any) => {
                const customerBottles = bottles.filter((b: any) => b.customerId === customer.id)
                const designatedCastRuby = customer.designatedCastIds[0]
                  ? allCasts.find((c: any) => c.id === customer.designatedCastIds[0])?.ruby
                  : undefined
                return (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    bottles={customerBottles}
                    designatedCastRuby={designatedCastRuby}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Reservations */}
        <div>
          <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            予約 ({reservations.length})
          </h3>
          {reservations.length === 0 ? (
            <p className="text-brand-plum/50 text-sm">予約はありません</p>
          ) : (
            <div className="space-y-2">
              {reservations.map((res: any) => (
                <ReservationCard
                  key={res.id}
                  reservation={res}
                  customerMap={customerMap}
                  customers={customers}
                  castMap={castMap}
                  casts={allCasts}
                  bottlesByCustomer={bottlesByCustomerMap}
                  loggedIn={loggedIn}
                  showDate
                />
              ))}
            </div>
          )}
        </div>

        {/* Visit Records */}
        <div>
          <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            指名履歴 ({visits.length})
          </h3>
          {visits.length === 0 ? (
            <p className="text-brand-plum/50 text-sm">指名履歴はありません</p>
          ) : (
            <div className="space-y-4">
              {sortedCustomerIds.map((customerId: string) => {
                const customer = customerMap.get(customerId)
                if (!customer) return null
                return (
                  <CastVisitGroup
                    key={customerId}
                    customer={customer}
                    visits={visitsByCustomer[customerId]!}
                    casts={allCasts}
                    bottles={bottles}
                    loggedIn={loggedIn}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
