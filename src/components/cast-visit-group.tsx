'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, ChevronDown, ChevronUp } from 'lucide-react'
import { VisitCard } from '@/components/visit-card'
import type { VisitRecord, Cast, Bottle, Customer } from '@/types'

interface CastVisitGroupProps {
  customer: Customer
  visits: VisitRecord[]
  casts: Cast[]
  bottles: Bottle[]
  loggedIn: boolean
}

export function CastVisitGroup({ customer, visits, casts, bottles, loggedIn }: CastVisitGroupProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...visits].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  )
  const latest = sorted[0]
  const rest = sorted.slice(1)

  return (
    <div className="space-y-2">
      <Link
        href={`/customers/${customer.id}`}
        className="flex items-center gap-2 text-sm text-brand-plum hover:text-brand-plum font-medium"
      >
        <User className="h-3.5 w-3.5 text-brand-plum/50" />
        {customer.name}
        <span className="text-brand-plum/50 text-xs font-normal">({customer.ruby})</span>
      </Link>

      <VisitCard visit={latest} casts={casts} bottles={bottles} loggedIn={loggedIn} />

      {rest.length > 0 && (
        <>
          {expanded && (
            <div className="space-y-2">
              {rest.map((visit) => (
                <VisitCard key={visit.id} visit={visit} casts={casts} bottles={bottles} loggedIn={loggedIn} />
              ))}
            </div>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-brand-plum/50 hover:text-brand-plum transition-colors pl-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                折りたたむ
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                もっと見る（他{rest.length}件）
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
