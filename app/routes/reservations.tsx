import type { Route } from '../+types/routes/reservations'
import { getDb } from '../lib/db.server'
import { getReservations, getCustomers, getCasts, getBottles } from '../../src/lib/kv.server'
import { CalendarView } from '../../src/app/reservations/calendar-view'

export async function loader({ context }: Route.LoaderArgs) {
  const db = getDb(context)
  const [reservations, customers, casts, bottles] = await Promise.all([
    getReservations(db),
    getCustomers(db),
    getCasts(db),
    getBottles(db),
  ])

  const customerMap = new Map(customers.map((c) => [c.id, c]))
  const castMap = new Map(casts.map((c) => [c.id, c]))
  const bottlesByCustomer = new Map<string, number>()
  for (const b of bottles) {
    bottlesByCustomer.set(b.customerId, (bottlesByCustomer.get(b.customerId) ?? 0) + 1)
  }

  return {
    reservations,
    customers,
    customerMap: Object.fromEntries(customerMap),
    casts,
    castMap: Object.fromEntries(castMap),
    bottlesByCustomer: Object.fromEntries(bottlesByCustomer),
  }
}

export default function ReservationsPage({ loaderData }: Route.ComponentProps) {
  const { reservations, customers, customerMap, casts, castMap, bottlesByCustomer } = loaderData
  const loggedIn = true

  return (
    <CalendarView
      reservations={reservations}
      customers={customers}
      customerMap={new Map(Object.entries(customerMap))}
      casts={casts}
      castMap={new Map(Object.entries(castMap))}
      bottlesByCustomer={new Map(Object.entries(bottlesByCustomer).map(([k, v]) => [k, Number(v)]))}
      loggedIn={loggedIn}
    />
  )
}
