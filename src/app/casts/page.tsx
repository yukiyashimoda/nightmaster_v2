import Link from 'next/link'
import { getCasts, getCustomers } from '@/lib/kv'
import { getHiraganaGroup, hiraganaGroups } from '@/lib/utils'
import { HiraganaIndex } from '@/components/hiragana-index'
import { CastSearch } from './cast-search'
import { NewCastFab } from './new-cast-fab'
import { isAuthenticated } from '@/lib/auth'
import { GiAmpleDress } from 'react-icons/gi'

export const dynamic = 'force-dynamic'

export default async function CastListPage() {
  const [casts, customers, loggedIn] = await Promise.all([getCasts(), getCustomers(), isAuthenticated()])

  const customerCounts = new Map<string, number>()
  for (const cast of casts) {
    customerCounts.set(cast.id, customers.filter((c) => c.designatedCastIds.includes(cast.id)).length)
  }

  const grouped = new Map<string, typeof casts>()
  for (const group of hiraganaGroups) {
    const inGroup = casts.filter((c) => getHiraganaGroup(c.ruby) === group)
    if (inGroup.length > 0) {
      grouped.set(group, inGroup)
    }
  }

  const activeGroups = Array.from(grouped.keys())

  return (
    <div className="relative min-h-screen bg-[#F5F1EE]">
      <div className="sticky top-16 z-20 bg-[#F5F1EE]/95 backdrop-blur border-b border-brand-beige/50 px-4 py-3">
        <h1 className="text-xl font-bold text-brand-plum mb-3">キャスト一覧</h1>
        <CastSearch
          casts={casts}
          visitCounts={Object.fromEntries(customerCounts)}
        />
      </div>

      <div className="pb-24">
        {activeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-plum/50">
            <p className="text-lg">キャストが登録されていません</p>
          </div>
        ) : (
          activeGroups.map((group) => {
            const groupCasts = grouped.get(group)!
            return (
              <div key={group} id={`group-${group}`}>
                <div className="sticky top-[calc(4rem+4.5rem)] z-10 bg-[#F5F1EE]/90 backdrop-blur px-4 py-1.5">
                  <span className="text-xs font-semibold text-brand-plum/60 uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                {groupCasts.map((cast) => (
                  <Link
                    key={cast.id}
                    href={`/casts/${cast.id}`}
                    className="flex items-center gap-3 px-4 py-3 mx-3 my-2 rounded-2xl bg-white transition-all shadow-[3px_3px_8px_rgba(75,60,82,0.12),-2px_-2px_6px_rgba(255,255,255,0.95)] hover:shadow-[4px_4px_12px_rgba(75,60,82,0.16),-2px_-2px_8px_rgba(255,255,255,1)]"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-plum text-white flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                      {cast.ruby}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-normal text-brand-plum">{cast.name}</span>
                        {cast.memo && (
                          <span className="text-xs text-brand-plum/50 truncate">{cast.memo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-brand-plum/60 text-sm shrink-0">
                      <GiAmpleDress size={14} className="text-brand-plum/50" />
                      <span>{customerCounts.get(cast.id) ?? 0} 人</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          })
        )}
      </div>

      {loggedIn && <NewCastFab />}
    </div>
  )
}
