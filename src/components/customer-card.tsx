import Link from 'next/link'
import { AlertTriangle, Calendar } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/favorite-button'
import { cn, formatDate, isOldVisit } from '@/lib/utils'
import type { Customer, Bottle } from '@/types'

interface CustomerCardProps {
  customer: Customer
  bottles: Bottle[]
  designatedCastRuby?: string
}

export function CustomerCard({ customer, bottles, designatedCastRuby }: CustomerCardProps) {
  const old = isOldVisit(customer.lastVisitDate)
  const avatarLabel = designatedCastRuby ?? 'FREE'

  return (
    <Link href={`/customers/${customer.id}`}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 mx-3 my-2 rounded-2xl bg-white transition-all',
          'shadow-[3px_3px_8px_rgba(75,60,82,0.12),-2px_-2px_6px_rgba(255,255,255,0.95)]',
          'hover:shadow-[4px_4px_12px_rgba(75,60,82,0.16),-2px_-2px_8px_rgba(255,255,255,1)]',
          old && 'bg-amber-50'
        )}
      >
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden',
          customer.isAlert ? 'bg-brand-coral/20 text-brand-coral' : designatedCastRuby ? 'bg-brand-coral text-white' : 'bg-brand-gold text-brand-plum'
        )}>
          {avatarLabel}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-normal text-brand-plum truncate">
              {customer.name}
            </span>
            {customer.nickname && (
              <span className="text-xs text-brand-plum/50 truncate">
                ({customer.nickname})
              </span>
            )}
          </div>
          <div className="text-xs text-brand-plum/50">{customer.ruby}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className={cn('h-3 w-3', old ? 'text-brand-gold' : 'text-brand-plum/50')} />
            <span className={cn(
              'text-xs rounded px-1',
              old
                ? 'text-brand-coral font-bold bg-brand-coral/10'
                : 'text-brand-plum/60'
            )}>
              最終来店: {formatDate(customer.lastVisitDate)}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {customer.isAlert && (
            <Badge variant="danger" className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              要確認
            </Badge>
          )}
          {customer.hasGlass && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-brand-gold/20 text-brand-plum/70 border border-brand-gold/40">
              グラス
            </span>
          )}
          {bottles.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-brand-plum/60">
              <GiBrandyBottle size={12} />
              <span>{bottles.length}</span>
            </div>
          )}
        </div>

        {/* Favorite */}
        <FavoriteButton customerId={customer.id} isFavorite={customer.isFavorite} />
      </div>
    </Link>
  )
}
