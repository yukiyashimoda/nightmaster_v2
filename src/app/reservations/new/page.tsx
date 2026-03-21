import { getCustomers, getCasts, getBottles } from '@/lib/kv'
import { ReservationForm } from './reservation-form'

export default async function NewReservationPage() {
  const [customers, casts, bottles] = await Promise.all([getCustomers(), getCasts(), getBottles()])
  const sortedCustomers = [...customers].sort((a, b) => a.ruby.localeCompare(b.ruby, 'ja'))
  const sortedCasts = [...casts].sort((a, b) => a.ruby.localeCompare(b.ruby, 'ja'))
  const bottlesByCustomer = new Map<string, number>()
  for (const b of bottles) {
    bottlesByCustomer.set(b.customerId, (bottlesByCustomer.get(b.customerId) ?? 0) + 1)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-brand-plum mb-5">予約登録</h1>
      <ReservationForm customers={sortedCustomers} casts={sortedCasts} bottlesByCustomer={bottlesByCustomer} />
    </div>
  )
}
