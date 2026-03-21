'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { GiAmpleDress } from 'react-icons/gi'
import type { Cast, VisitRecord } from '@/types'

interface CastRankingProps {
  casts: Cast[]
  visits: VisitRecord[]
}

type PeriodType = 'all' | 'year' | 'month'
type RankingType = 'designated' | 'inStore'

export function CastRanking({ casts, visits }: CastRankingProps) {
  const castMap = useMemo(() => new Map(casts.map((c) => [c.id, c])), [casts])

  // 利用可能な年・月を導出
  const { availableYears, availableMonths } = useMemo(() => {
    const years = new Set<number>()
    const months = new Set<string>() // "YYYY-MM"
    for (const v of visits) {
      const d = new Date(v.visitDate)
      years.add(d.getFullYear())
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return {
      availableYears: Array.from(years).sort((a, b) => b - a),
      availableMonths: Array.from(months).sort((a, b) => b.localeCompare(a)),
    }
  }, [visits])

  const currentYear = new Date().getFullYear()
  const currentMonth = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [periodType, setPeriodType] = useState<PeriodType>('all')
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] ?? currentYear)
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] ?? currentMonth)
  const [rankingType, setRankingType] = useState<RankingType>('designated')

  const ranking = useMemo(() => {
    // 期間フィルタ
    const filtered = visits.filter((v) => {
      const d = new Date(v.visitDate)
      if (periodType === 'year') return d.getFullYear() === selectedYear
      if (periodType === 'month') {
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return ym === selectedMonth
      }
      return true
    })

    // カウント集計
    const countMap = new Map<string, number>()
    for (const v of filtered) {
      const ids = rankingType === 'designated' ? v.designatedCastIds : v.inStoreCastIds
      for (const castId of ids) {
        countMap.set(castId, (countMap.get(castId) ?? 0) + 1)
      }
    }

    return Array.from(countMap.entries())
      .map(([castId, count]) => ({ cast: castMap.get(castId), count }))
      .filter((r) => r.cast)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [visits, periodType, selectedYear, selectedMonth, rankingType, castMap])

  const medalColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-white'
    if (rank === 2) return 'bg-gray-300 text-gray-700'
    if (rank === 3) return 'bg-amber-600 text-white'
    return 'bg-brand-beige text-brand-plum/60'
  }

  return (
    <div className="rounded-xl bg-white border border-brand-beige shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 border-b border-brand-beige space-y-3">
        <div className="flex items-center gap-2">
          <GiAmpleDress size={16} className="text-brand-plum/50" />
          <h2 className="text-sm font-semibold text-brand-plum">キャストランキング TOP10</h2>
        </div>

        {/* 本指名 / 場内指名 切り替え */}
        <div className="flex rounded-lg border border-brand-beige overflow-hidden text-xs font-medium">
          <button
            onClick={() => setRankingType('designated')}
            className={`flex-1 py-1.5 transition-colors ${rankingType === 'designated' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            本指名
          </button>
          <button
            onClick={() => setRankingType('inStore')}
            className={`flex-1 py-1.5 transition-colors ${rankingType === 'inStore' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            場内指名
          </button>
        </div>

        {/* 期間タイプ切り替え */}
        <div className="flex rounded-lg border border-brand-beige overflow-hidden text-xs font-medium">
          {(['all', 'year', 'month'] as PeriodType[]).map((type) => (
            <button
              key={type}
              onClick={() => setPeriodType(type)}
              className={`flex-1 py-1.5 transition-colors ${periodType === type ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
            >
              {type === 'all' ? '全期間' : type === 'year' ? '年別' : '月別'}
            </button>
          ))}
        </div>

        {/* 年・月選択 */}
        {periodType === 'year' && availableYears.length > 0 && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full text-sm rounded-lg border border-brand-beige px-3 py-1.5 text-brand-plum bg-white outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        )}
        {periodType === 'month' && availableMonths.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full text-sm rounded-lg border border-brand-beige px-3 py-1.5 text-brand-plum bg-white outline-none"
          >
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-')
              return <option key={m} value={m}>{y}年{parseInt(mo)}月</option>
            })}
          </select>
        )}
      </div>

      {/* ランキングリスト */}
      <div className="divide-y divide-brand-beige/50">
        {ranking.length === 0 ? (
          <p className="text-sm text-brand-plum/50 text-center py-8">データがありません</p>
        ) : (
          ranking.map(({ cast, count }, i) => (
            <Link
              key={cast!.id}
              href={`/casts/${cast!.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-brand-beige/30 transition-colors"
            >
              {/* 順位バッジ */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${medalColor(i + 1)}`}>
                {i + 1}
              </div>
              {/* キャスト名 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-plum truncate">{cast!.name}</p>
                <p className="text-xs text-brand-plum/50">{cast!.ruby}</p>
              </div>
              {/* カウント */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-brand-plum tabular-nums">{count}</p>
                <p className="text-[10px] text-brand-plum/50">回</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
