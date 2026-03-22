import type { Route } from '../+types/routes/reservations.new'
import { getSupabase } from '../lib/db.server'
import { getCustomers, getCasts, getBottles, createReservation } from '../../src/lib/kv.server'
import { getSessionUser } from '../../src/lib/auth.server'
import { ReservationForm } from '../../src/app/reservations/new/reservation-form'

export async function loader({ context }: Route.LoaderArgs) {
  const db = getSupabase(context)
  const [customers, casts, bottles] = await Promise.all([
    getCustomers(db),
    getCasts(db),
    getBottles(db),
  ])

  const sortedCustomers = [...customers].sort((a, b) => a.ruby.localeCompare(b.ruby, 'ja'))
  const sortedCasts = [...casts].sort((a, b) => a.ruby.localeCompare(b.ruby, 'ja'))

  const bottlesByCustomer = new Map<string, number>()
  for (const b of bottles) {
    bottlesByCustomer.set(b.customerId, (bottlesByCustomer.get(b.customerId) ?? 0) + 1)
  }

  return {
    customers: sortedCustomers,
    casts: sortedCasts,
    bottlesByCustomer: Object.fromEntries(bottlesByCustomer),
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = getSupabase(context)
  try {
    const body = await request.json()
    const updatedBy = getSessionUser(request) ?? ''
    const reservation = await createReservation(db, { ...body, updatedBy })
    return Response.json({ success: true, id: reservation.id })
  } catch {
    return Response.json({ success: false, error: '登録に失敗しました' })
  }
}

export default function NewReservationPage({ loaderData }: Route.ComponentProps) {
  const { customers, casts, bottlesByCustomer } = loaderData

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-brand-plum mb-5">予約登録</h1>
      <ReservationForm
        customers={customers}
        casts={casts}
        bottlesByCustomer={new Map(Object.entries(bottlesByCustomer).map(([k, v]) => [k, Number(v)]))}
      />
    </div>
  )
}
