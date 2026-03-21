'use client'

import { cn } from '@/lib/utils'
import { hiraganaGroups, groupLabels } from '@/lib/utils'

interface HiraganaIndexProps {
  activeGroups: string[]
}

export function HiraganaIndex({ activeGroups }: HiraganaIndexProps) {
  const scrollToGroup = (group: string) => {
    const el = document.getElementById(`group-${group}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-0.5 pr-1">
      {hiraganaGroups.map((group) => {
        const isActive = activeGroups.includes(group)
        return (
          <button
            key={group}
            onClick={() => scrollToGroup(group)}
            disabled={!isActive}
            className={cn(
              'w-7 h-7 text-xs rounded-md font-medium transition-colors',
              isActive
                ? 'text-brand-plum hover:bg-white cursor-pointer'
                : 'text-brand-plum/20 cursor-default'
            )}
          >
            {groupLabels[group]}
          </button>
        )
      })}
    </div>
  )
}
