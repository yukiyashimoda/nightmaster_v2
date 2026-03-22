import type { Route } from '../+types/routes/favorites'
import { getDb } from '../lib/db.server'
import { getCustomers, getBottlesByCustomer, getCasts } from '../../src/lib/kv.server'
import { CustomerCard } from '../../src/components/customer-card'
import type { Bottle, Cast } from '../../src/types'

export async function loader({ context }: Route.LoaderArgs) {
  const db = getDb(context)
  const [customers, casts] = await Promise.all([getCustomers(db), getCasts(db)])
  const castMap = new Map<string, Cast>(casts.map((c) => [c.id, c]))

  const favorites = customers.filter((c) => c.isFavorite)

  const bottlesMap = new Map<string, Bottle[]>()
  await Promise.all(
    favorites.map(async (c) => {
      const bottles = await getBottlesByCustomer(db, c.id)
      bottlesMap.set(c.id, bottles)
    })
  )

  return {
    favorites,
    castMap: Object.fromEntries(castMap),
    bottlesMap: Object.fromEntries(bottlesMap),
  }
}

export default function FavoritesPage({ loaderData }: Route.ComponentProps) {
  const { favorites, castMap, bottlesMap } = loaderData

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
              bottles={bottlesMap[customer.id] ?? []}
              designatedCastRuby={
                customer.designatedCastIds[0]
                  ? castMap[customer.designatedCastIds[0]]?.ruby
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
