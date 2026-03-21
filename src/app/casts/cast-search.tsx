import { useState } from 'react'
import { Link } from 'react-router'
import { Search, X } from 'lucide-react'
import { GiAmpleDress } from 'react-icons/gi'
import { Input } from '@/components/ui/input'
import type { Cast } from '@/types'

interface CastSearchProps {
  casts: Cast[]
  visitCounts: Record<string, number>
}

export function CastSearch({ casts, visitCounts }: CastSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? casts.filter(
        (c) => c.name.includes(query) || c.ruby.includes(query)
      )
    : null

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・ふりがなで検索"
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
              該当するキャストが見つかりません
            </p>
          ) : (
            filtered.map((cast) => (
              <Link
                key={cast.id}
                to={`/casts/${cast.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-brand-beige last:border-b-0 hover:bg-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-plum text-white flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                  {cast.ruby}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-brand-plum">{cast.name}</div>
                </div>
                <div className="flex items-center gap-1 text-brand-plum/60 text-sm">
                  <GiAmpleDress size={14} className="text-brand-plum/50" />
                  <span>{visitCounts[cast.id] ?? 0} 指名</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
