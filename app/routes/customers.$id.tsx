import type { Route } from '../+types/routes/customers.$id'
import { Link } from 'react-router'
import { getDb } from '../lib/db.server'
import {
  getCustomer,
  getBottlesByCustomer,
  getVisitRecordsByCustomer,
  getReservationsByCustomer,
  getCasts,
  getCustomers,
  getBottles,
} from '../../src/lib/kv.server'
import { formatDate, formatEditedBy } from '../../src/lib/utils'
import { DeleteConfirmButton } from '../../src/components/delete-confirm-button'
import { BottleCard } from '../../src/components/bottle-card'
import { VisitCard } from '../../src/components/visit-card'
import { ReservationCard } from '../../src/components/reservation-card'
import { Badge } from '../../src/components/ui/badge'
import { Button } from '../../src/components/ui/button'
import { Separator } from '../../src/components/ui/separator'
import { FavoriteButton } from '../../src/components/favorite-button'
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Calendar,
  CalendarDays,
  Plus,
  Phone,
  Mail,
} from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { FaAddressCard } from 'react-icons/fa'

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = getDb(context)
  const { id } = params
  const [customer, bottles, visits, reservations, casts, allCustomers, allBottles] = await Promise.all([
    getCustomer(db, id),
    getBottlesByCustomer(db, id),
    getVisitRecordsByCustomer(db, id),
    getReservationsByCustomer(db, id),
    getCasts(db),
    getCustomers(db),
    getBottles(db),
  ])

  if (!customer) {
    throw new Response(null, { status: 404 })
  }

  const castMap = Object.fromEntries(casts.map((c) => [c.id, c]))
  const customerMap = Object.fromEntries(allCustomers.map((c) => [c.id, c]))
  const bottlesByCustomer: Record<string, number> = {}
  for (const b of allBottles) {
    bottlesByCustomer[b.customerId] = (bottlesByCustomer[b.customerId] ?? 0) + 1
  }

  return {
    id,
    customer,
    bottles,
    visits,
    reservations,
    casts,
    allCustomers,
    castMap,
    customerMap,
    bottlesByCustomer,
  }
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { id } = params
  const body = await request.json()

  if (body._intent === 'delete') {
    const { isAuthenticated } = await import('../../src/lib/auth.server')
    const { deleteCustomer } = await import('../../src/lib/kv.server')
    const { getDb: getDbInAction } = await import('../lib/db.server')
    if (!isAuthenticated(request)) {
      return Response.json({ success: false, error: '認証が必要です' }, { status: 401 })
    }
    const db = getDbInAction(context)
    await deleteCustomer(db, id)
    return Response.json({ success: true })
  }

  return Response.json({ success: false, error: '不正なリクエストです' })
}

export default function CustomerDetailPage({ loaderData }: Route.ComponentProps) {
  const {
    id,
    customer,
    bottles,
    visits,
    reservations,
    casts,
    allCustomers,
    castMap,
    customerMap,
    bottlesByCustomer,
  } = loaderData
  const loggedIn = true

  const designatedCasts = customer.designatedCastIds
    .map((cid: string) => castMap[cid])
    .filter(Boolean)
  const linkedCustomers = customer.linkedCustomerIds
    .map((cid: string) => customerMap[cid])
    .filter(Boolean)

  const inStoreCastIdSet = new Set(visits.flatMap((v: any) => v.inStoreCastIds))
  const inStoreCasts = Array.from(inStoreCastIdSet)
    .map((cid) => castMap[cid as string])
    .filter(Boolean)

  const designatedCastRuby = designatedCasts[0]?.ruby
  const avatarLabel = designatedCastRuby ?? 'FREE'

  const castMapForReservation = new Map(casts.map((c: any) => [c.id, c]))
  const customerMapForReservation = new Map(allCustomers.map((c: any) => [c.id, c]))
  const bottlesByCustomerMap = new Map(Object.entries(bottlesByCustomer))

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-brand-beige px-4 py-3 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-plum/60">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-brand-plum flex-1 truncate">{customer.name}</h1>
        <FavoriteButton customerId={id} isFavorite={customer.isFavorite} />
        {loggedIn && (
          <div className="flex items-center gap-2">
            <Link to={`/customers/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-brand-beige text-brand-plum/80 hover:text-brand-plum">
                <Edit className="h-3.5 w-3.5 mr-1" />
                編集
              </Button>
            </Link>
            <DeleteConfirmButton
              actionUrl={`/customers/${id}`}
              redirectTo="/"
              itemName={customer.name}
            />
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-brand-beige bg-white p-5 shadow-sm">
          {/* 名前・ニックネーム */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden ${customer.isAlert ? 'bg-brand-coral/20 text-brand-coral' : designatedCastRuby ? 'bg-brand-coral text-white' : 'bg-brand-gold text-brand-plum'}`}>
              {avatarLabel}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-brand-plum">{customer.name}</h2>
                {customer.isAlert && (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    要確認
                  </Badge>
                )}
              </div>
              <p className="text-brand-plum/50 text-sm">{customer.ruby}</p>
              {customer.nickname && (
                <p className="text-brand-plum/80 text-sm mt-0.5">
                  ニックネーム: {customer.nickname}
                </p>
              )}
              {customer.isAlert && customer.alertReason && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-brand-coral bg-brand-coral/10 border border-brand-coral/40 rounded-md px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap">{customer.alertReason}</span>
                </div>
              )}
              {customer.hasGlass && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-brand-plum/80 bg-brand-gold/10 border border-brand-gold/40 rounded-md px-3 py-2">
                  <span className="text-xs font-semibold text-brand-gold shrink-0 mt-0.5">グラス</span>
                  <span className="whitespace-pre-wrap">{customer.glassMemo || 'グラス預かりあり'}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* 本指名キャスト + ボトル本数 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-brand-plum/50 text-xs mb-1.5">本指名キャスト</p>
              {designatedCasts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {designatedCasts.map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/casts/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-brand-beige text-sm text-brand-plum hover:border-brand-plum/40 transition-colors shadow-sm"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-brand-plum font-medium">フリー</p>
              )}
            </div>
            <div>
              <p className="text-brand-plum/50 text-xs mb-0.5">ボトル本数</p>
              <p className="text-brand-plum font-medium flex items-center gap-1">
                <GiBrandyBottle size={14} className="text-brand-plum/50" />
                {bottles.length} 本
              </p>
            </div>
          </div>

          {/* 場内指名履歴 */}
          {inStoreCasts.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-brand-plum/50 text-xs mb-1.5">場内指名履歴</p>
                <div className="flex flex-wrap gap-1.5">
                  {inStoreCasts.map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/casts/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-brand-beige text-sm text-brand-plum hover:border-brand-plum/40 transition-colors shadow-sm"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {customer.memo && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-brand-plum/50 text-xs mb-1">特記事項</p>
                <p className="text-brand-plum text-sm whitespace-pre-wrap">{customer.memo}</p>
              </div>
            </>
          )}

          {customer.receiptNames && customer.receiptNames.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-brand-plum/50 text-xs mb-2">領収書名</p>
                <div className="flex flex-wrap gap-2">
                  {customer.receiptNames.map((name: string, idx: number) => (
                    <span key={idx} className="text-sm px-3 py-1 rounded-lg bg-brand-beige/50 border border-brand-beige text-brand-plum">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {(customer.phone || customer.email) && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-col gap-2">
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 text-sm text-brand-plum hover:text-brand-plum/70 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-brand-plum/50 shrink-0" />
                    {customer.phone}
                  </a>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 text-sm text-brand-plum hover:text-brand-plum/70 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-brand-plum/50 shrink-0" />
                    {customer.email}
                  </a>
                )}
              </div>
            </>
          )}

          {customer.updatedBy && (
            <p className="text-xs text-brand-plum/50 mt-3 text-right">
              {formatEditedBy(customer.updatedBy, customer.updatedAt)}
            </p>
          )}
        </div>

        {/* 来店を記録するボタン */}
        {loggedIn && (
          <Link to={`/customers/${id}/visits/new`} className="block mt-2">
            <Button className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
              <Plus className="h-4 w-4 mr-2" />
              来店を記録する
            </Button>
          </Link>
        )}

        {/* キープボトル一覧 */}
        <div>
          <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GiBrandyBottle size={16} />
            ボトルキープ ({bottles.length})
          </h3>
          {bottles.length === 0 ? (
            <p className="text-brand-plum/50 text-sm">ボトルはありません</p>
          ) : (
            <div className="space-y-2">
              {bottles.map((bottle: any) => (
                <BottleCard key={bottle.id} bottle={bottle} />
              ))}
            </div>
          )}
        </div>

        {/* 来店回数 + 最終来店日 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-brand-beige bg-white p-4 shadow-sm text-sm">
            <p className="text-brand-plum/50 text-xs mb-1">来店回数</p>
            <p className="text-brand-plum font-bold text-lg">{visits.length} <span className="text-sm font-normal">回</span></p>
          </div>
          <div className="rounded-xl border border-brand-beige bg-white p-4 shadow-sm text-sm">
            <p className="text-brand-plum/50 text-xs mb-1">最終来店</p>
            <p className="text-brand-plum font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-plum/50 shrink-0" />
              {formatDate(customer.lastVisitDate)}
            </p>
          </div>
        </div>

        {/* Linked Customers */}
        {linkedCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaAddressCard size={16} />
              同伴者・グループ
            </h3>
            <div className="space-y-2">
              {linkedCustomers.map((linked: any) => (
                <Link
                  key={linked.id}
                  to={`/customers/${linked.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border border-brand-beige hover:border-brand-plum/40 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-brand-plum flex items-center justify-center text-sm font-bold">
                    {linked.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-brand-plum font-medium text-sm">{linked.name}</p>
                    <p className="text-brand-plum/50 text-xs">{linked.ruby}</p>
                  </div>
                </Link>
              ))}
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
                  customerMap={customerMapForReservation}
                  customers={allCustomers}
                  castMap={castMapForReservation}
                  casts={casts}
                  bottlesByCustomer={bottlesByCustomerMap}
                  loggedIn={loggedIn}
                  showDate
                />
              ))}
            </div>
          )}
        </div>

        {/* Visit History */}
        <div>
          <h3 className="text-sm font-semibold text-brand-plum/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            来店履歴 ({visits.length})
          </h3>
          {visits.length === 0 ? (
            <p className="text-brand-plum/50 text-sm">来店履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {visits.map((visit: any) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  casts={casts}
                  bottles={bottles}
                  loggedIn={loggedIn}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
