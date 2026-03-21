import { getReservations, getCustomers, getCasts, getBottles } from '@/lib/kv'
import { isAuthenticated } from '@/lib/auth'
import { CalendarView } from './calendar-view'

export default async function ReservationsPage() {
  const [reservations, customers, casts, bottles, loggedIn] = await Promise.all([
    getReservations(), getCustomers(), getCasts(), getBottles(), isAuthenticated(),
  ])
  const customerMap = new Map(customers.map((c) => [c.id, c]))
  const castMap = new Map(casts.map((c) => [c.id, c]))
  const bottlesByCustomer = new Map<string, number>()
  for (const b of bottles) {
    bottlesByCustomer.set(b.customerId, (bottlesByCustomer.get(b.customerId) ?? 0) + 1)
  }

  return (
    <CalendarView
      reservations={reservations}
      customers={customers}
      customerMap={customerMap}
      casts={casts}
      castMap={castMap}
      bottlesByCustomer={bottlesByCustomer}
      loggedIn={loggedIn}
    />
  )
}
