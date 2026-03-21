import { getCustomers, getBottlesByCustomer, getCasts } from '@/lib/kv'
import { getHiraganaGroup, hiraganaGroups } from '@/lib/utils'
import { CustomerCard } from '@/components/customer-card'
import { Fab } from '@/components/fab'
import { CustomerSearch } from './customer-search'
import { isAuthenticated } from '@/lib/auth'
import type { Bottle, Cast } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CustomerListPage() {
  const [customers, casts, loggedIn] = await Promise.all([getCustomers(), getCasts(), isAuthenticated()])
  const castMap = new Map<string, Cast>(casts.map((c) => [c.id, c]))

  const bottlesMap = new Map<string, Bottle[]>()
  await Promise.all(
    customers.map(async (c) => {
      const bottles = await getBottlesByCustomer(c.id)
      bottlesMap.set(c.id, bottles)
    })
  )

  const grouped = new Map<string, typeof customers>()
  for (const group of hiraganaGroups) {
    const inGroup = customers.filter((c) => getHiraganaGroup(c.ruby) === group)
    if (inGroup.length > 0) grouped.set(group, inGroup)
  }

  const activeGroups = Array.from(grouped.keys())

  return (
    <div className="relative min-h-screen bg-[#F5F1EE]">
      <div className="sticky top-16 z-20 bg-[#F5F1EE]/95 backdrop-blur border-b border-brand-beige/50 px-4 py-3">
        <h1 className="text-xl font-bold text-brand-plum mb-3">顧客一覧</h1>
        <CustomerSearch
          customers={customers}
          bottlesMap={Object.fromEntries(bottlesMap)}
          castMap={Object.fromEntries(castMap)}
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
            const groupCustomers = grouped.get(group)!
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
                    bottles={bottlesMap.get(customer.id) ?? []}
                    designatedCastRuby={
                      customer.designatedCastIds[0]
                        ? castMap.get(customer.designatedCastIds[0])?.ruby
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
