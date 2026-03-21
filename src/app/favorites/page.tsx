import { getCustomers, getBottlesByCustomer, getCasts } from '@/lib/kv'
import { CustomerCard } from '@/components/customer-card'
import type { Bottle, Cast } from '@/types'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const [customers, casts] = await Promise.all([getCustomers(), getCasts()])
  const castMap = new Map<string, Cast>(casts.map((c) => [c.id, c]))

  const favorites = customers.filter((c) => c.isFavorite)

  const bottlesMap = new Map<string, Bottle[]>()
  await Promise.all(
    favorites.map(async (c) => {
      const bottles = await getBottlesByCustomer(c.id)
      bottlesMap.set(c.id, bottles)
    })
  )

  return (
    <div className="relative min-h-screen bg-[#F5F1EE]">
      <div className="sticky top-16 z-20 bg-[#F5F1EE]/95 backdrop-blur border-b border-brand-beige/50 px-4 py-3">
        <h1 className="text-xl font-bold text-brand-plum">お気に入り</h1>
      </div>

      <div className="pb-24">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-plum/50">
            <p className="text-lg">お気に入りはありません</p>
            <p className="text-sm mt-1">顧客カードの★ボタンで追加できます</p>
          </div>
        ) : (
          favorites.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              bottles={bottlesMap.get(customer.id) ?? []}
              designatedCastRuby={
                customer.designatedCastIds[0]
                  ? castMap.get(customer.designatedCastIds[0])?.ruby
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
