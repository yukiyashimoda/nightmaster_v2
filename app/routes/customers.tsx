import type { Route } from '../+types/routes/customers'
import { getDb } from '../lib/db.server'
import { getCustomers, getBottlesByCustomer, getCasts } from '../../src/lib/kv.server'
import { getHiraganaGroup, hiraganaGroups } from '../../src/lib/utils'
import { CustomerCard } from '../../src/components/customer-card'
import { Fab } from '../../src/components/fab'
import { CustomerSearch } from '../../src/app/customers/customer-search'
import type { Bottle, Cast } from '../../src/types'

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const db = getDb(context)
    const [customers, casts] = await Promise.all([getCustomers(db), getCasts(db)])
    const castMap = new Map<string, Cast>(casts.map((c) => [c.id, c]))

    const bottlesMap = new Map<string, Bottle[]>()
    await Promise.all(
      customers.map(async (c) => {
        const bottles = await getBottlesByCustomer(db, c.id)
        bottlesMap.set(c.id, bottles)
      })
    )

    const grouped = new Map<string, typeof customers>()
    for (const group of hiraganaGroups) {
      const inGroup = customers.filter((c) => getHiraganaGroup(c.ruby) === group)
      if (inGroup.length > 0) grouped.set(group, inGroup)
    }

    const activeGroups = Array.from(grouped.keys())

    return {
      customers,
      casts,
      castMap: Object.fromEntries(castMap),
      bottlesMap: Object.fromEntries(bottlesMap),
      grouped: Object.fromEntries(grouped),
      activeGroups,
    }
  } catch (e) {
    console.error("customers loader error:", String(e), (e as Error)?.stack)
    throw e
  }
}

export default function CustomerListPage({ loaderData }: Route.ComponentProps) {
  const { customers, castMap, bottlesMap, grouped, activeGroups } = loaderData
  const loggedIn = true

  return (
    <div className="relative min-h-screen bg-[#F5F1EE]">
      <div className="sticky top-16 z-20 bg-[#F5F1EE]/95 backdrop-blur border-b border-brand-beige/50 px-4 py-3">
        <h1 className="text-xl font-bold text-brand-plum mb-3">顧客一覧</h1>
        <CustomerSearch
          customers={customers}
          bottlesMap={bottlesMap}
          castMap={castMap}
        />
      </div>

      <div className="pb-24">
        {activeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-plum/50">
            <p className="text-lg">顧客が登録されていません</p>
            <p className="text-sm mt-1">右下のボタンから追加してください</p>
          </div>
        ) : (
          activeGroups.map((group) => {
            const groupCustomers = grouped[group]!
            return (
              <div key={group} id={`group-${group}`}>
                <div className="sticky top-[calc(4rem+4.5rem)] z-10 bg-[#F5F1EE]/90 backdrop-blur px-4 py-1.5">
                  <span className="text-xs font-semibold text-brand-plum/60 uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                {groupCustomers.map((customer) => (
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
                ))}
              </div>
            )
          })
        )}
      </div>

      {loggedIn && <Fab href="/customers/new" label="新規顧客" />}
    </div>
  )
}
