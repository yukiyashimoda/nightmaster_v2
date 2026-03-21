import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CustomerCard } from '@/components/customer-card'
import type { Customer, Bottle, Cast } from '@/types'

interface CustomerSearchProps {
  customers: Customer[]
  bottlesMap: Record<string, Bottle[]>
  castMap: Record<string, Cast>
}

export function CustomerSearch({ customers, bottlesMap, castMap }: CustomerSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.includes(query) ||
          c.ruby.includes(query) ||
          c.nickname.includes(query)
      )
    : null

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・ふりがな・ニックネームで検索"
          className="pl-9 pr-9 bg-white border-brand-beige"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-plum/50 hover:text-brand-plum"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered && (
        <div className="mt-2 rounded-lg border border-brand-beige bg-white overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-center text-brand-plum/50 py-4 text-sm">
              該当する顧客が見つかりません
            </p>
          ) : (
            filtered.map((customer) => (
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
      )}
    </div>
  )
}
