'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Cast, Customer, Reservation } from '@/types'
import { ReservationCard } from '@/components/reservation-card'

interface CalendarViewProps {
  reservations: Reservation[]
  customers: Customer[]
  customerMap: Map<string, Customer>
  casts: Cast[]
  castMap: Map<string, Cast>
  bottlesByCustomer: Map<string, number>
  loggedIn: boolean
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function getWeekStart(d: Date): Date {
  const result = new Date(d)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - result.getDay())
  return result
}


// ─── 無限スクロール定数 ───────────────────────────────────────
const BUFFER_WEEKS = 26           // 前後26週 = 約1年
const TOTAL_WEEKS = BUFFER_WEEKS * 2 + 1  // 53週

export function CalendarView({ reservations, customers, customerMap, casts, castMap, bottlesByCustomer, loggedIn }: CalendarViewProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const todayStr = formatDate(today)

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // Build date → reservations map
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>()
    for (const r of reservations) {
      if (!map.has(r.date)) map.set(r.date, [])
      map.get(r.date)!.push(r)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [reservations])

  // Month grid cells
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [currentDate, viewMode])

  // ─── 無限スクロール用データ ──────────────────────────────────
  // today の週の月曜を基準にした全週リスト（マウント時に1度だけ生成）
  const todayWeekStart = useRef(getWeekStart(today)).current
  const allWeekStarts = useRef(
    Array.from({ length: TOTAL_WEEKS }, (_, i) =>
      addDays(todayWeekStart, (i - BUFFER_WEEKS) * 7)
    )
  ).current

  const scrollRef = useRef<HTMLDivElement>(null)
  const skipScrollRef = useRef(false)   // プログラム的スクロール中はtrue
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isInitializedRef = useRef(false) // 週ビュー初回スクロール済みフラグ

  // currentDate に対応する allWeekStarts のインデックス
  const activeWeekIndex = useMemo(() => {
    const ws = getWeekStart(currentDate)
    const diff = Math.round((ws.getTime() - todayWeekStart.getTime()) / (7 * 86400000))
    return BUFFER_WEEKS + diff
  }, [currentDate, todayWeekStart])

  // 指定インデックスにスクロール
  function scrollToIndex(idx: number, animate: boolean) {
    const el = scrollRef.current
    if (!el) return
    skipScrollRef.current = true
    el.scrollTo({ left: idx * el.clientWidth, behavior: animate ? 'smooth' : 'instant' })
    clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      skipScrollRef.current = false
    }, animate ? 700 : 100)
  }

  // 週ビューに入ったとき・currentDate が変わったときにスクロール位置を同期
  useEffect(() => {
    if (viewMode !== 'week') {
      isInitializedRef.current = false
      return
    }
    const sync = () => {
      const el = scrollRef.current
      if (!el) return
      const target = activeWeekIndex * el.clientWidth
      const alreadyThere = Math.abs(el.scrollLeft - target) < el.clientWidth * 0.1
      if (alreadyThere && isInitializedRef.current) return
      scrollToIndex(activeWeekIndex, isInitializedRef.current)
      isInitializedRef.current = true
    }
    if (!isInitializedRef.current) {
      requestAnimationFrame(sync) // 初回はペイント後に実行
    } else {
      sync()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, activeWeekIndex])

  // スクロールイベント → currentDate を更新（ヘッダー連動）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (skipScrollRef.current) return
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => {
        if (!scrollRef.current || skipScrollRef.current) return
        const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth)
        const weekStart = allWeekStarts[idx]
        if (weekStart) setCurrentDate(weekStart)
      }, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [allWeekStarts])

  // Navigation
  function prev() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      setCurrentDate(addDays(getWeekStart(currentDate), -7))
    }
  }
  function next() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      setCurrentDate(addDays(getWeekStart(currentDate), 7))
    }
  }

  function switchView(mode: 'month' | 'week') {
    if (mode === viewMode) return
    if (mode === 'week') {
      const anchor = selectedDate ? new Date(selectedDate) : today
      setCurrentDate(getWeekStart(anchor))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
    }
    setViewMode(mode)
  }

  // Header label（週ビューは currentDate から直接計算）
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
    }
    const start = getWeekStart(currentDate)
    const end = addDays(start, 6)
    if (start.getMonth() === end.getMonth()) {
      return `${start.getFullYear()}年${start.getMonth() + 1}月 ${start.getDate()}〜${end.getDate()}日`
    }
    return `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`
  }, [viewMode, currentDate])

  const selectedReservations = reservationsByDate.get(selectedDate) ?? []
  const selectedAccompaniedCount = selectedReservations.filter((r) => r.isAccompanied).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
      {/* Title + date picker + toggle */}
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold text-brand-plum shrink-0">予約</h1>

        {/* Date picker — center */}
        <div className="flex-1 flex justify-center">
          {viewMode === 'month' ? (
            <input
              type="month"
              value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                if (y && m) setCurrentDate(new Date(y, m - 1, 1))
              }}
              className="w-full max-w-[160px] text-sm text-brand-plum border border-brand-beige rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-brand-plum/20"
            />
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value
                if (val) {
                  setSelectedDate(val)
                  setCurrentDate(getWeekStart(new Date(val)))
                }
              }}
              className="w-full max-w-[160px] text-sm text-brand-plum border border-brand-beige rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-brand-plum/20"
            />
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-brand-beige overflow-hidden text-sm font-medium shrink-0">
          <button
            onClick={() => switchView('month')}
            className={`px-3 py-1.5 transition-colors ${viewMode === 'month' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            月
          </button>
          <button
            onClick={() => switchView('week')}
            className={`px-3 py-1.5 transition-colors ${viewMode === 'week' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            週
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prev}
          className="p-2 rounded-lg hover:bg-brand-beige/50 text-brand-plum transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-brand-plum">{headerLabel}</span>
        <button
          onClick={next}
          className="p-2 rounded-lg hover:bg-brand-beige/50 text-brand-plum transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── Month view ── */}
      {viewMode === 'month' && (
        <>
          <div className="bg-white rounded-xl border border-brand-beige overflow-hidden">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-brand-beige">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-center py-2 text-xs font-semibold ${
                    i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-brand-plum/50'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[52px] border-b border-r border-brand-beige/40 last:border-r-0"
                    />
                  )
                }
                const dateStr = formatDate(day)
                const count = reservationsByDate.get(dateStr)?.length ?? 0
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const dow = day.getDay()
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[52px] border-b border-r border-brand-beige/40 p-1 flex flex-col items-center gap-0.5 transition-colors ${
                      isSelected ? 'bg-brand-plum/10' : 'hover:bg-brand-beige/30'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? 'bg-brand-plum text-white'
                          : dow === 0
                          ? 'text-red-400'
                          : dow === 6
                          ? 'text-blue-400'
                          : 'text-brand-plum'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] font-bold text-brand-coral bg-brand-coral/10 rounded-full px-1.5 leading-4">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day reservations */}
          <div className="mt-4 space-y-2">
            <h2 className="text-sm font-semibold text-brand-plum/60">
              {selectedDate.replace(/-/g, '/')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-brand-beige bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-brand-plum/50 mb-0.5">予約件数</p>
                <p className="text-xl font-bold text-brand-plum">{selectedReservations.length} <span className="text-sm font-normal">件</span></p>
              </div>
              <div className="rounded-xl border border-brand-beige bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-brand-plum/50 mb-0.5">同伴</p>
                <p className="text-xl font-bold text-brand-gold">{selectedAccompaniedCount} <span className="text-sm font-normal">件</span></p>
              </div>
            </div>
            {selectedReservations.length === 0 ? (
              <p className="text-sm text-brand-plum/30 py-2">予約なし</p>
            ) : (
              selectedReservations.map((r) => (
                <ReservationCard key={r.id} reservation={r} customerMap={customerMap} customers={customers} castMap={castMap} casts={casts} bottlesByCustomer={bottlesByCustomer} loggedIn={loggedIn} />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Week view（無限スクロール） ── */}
      {viewMode === 'week' && (
        <>
          {/* 横スクロール・スナップコンテナ */}
          <div
            ref={scrollRef}
            className="bg-white rounded-xl border border-brand-beige mb-4 overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {/* 内側: TOTAL_WEEKS 分の幅を持つ flex コンテナ */}
            <div className="flex" style={{ width: `${TOTAL_WEEKS * 100}%` }}>
              {allWeekStarts.map((weekStart) => (
                <div
                  key={formatDate(weekStart)}
                  className="grid grid-cols-7 snap-start flex-none"
                  style={{ width: `${100 / TOTAL_WEEKS}%` }}
                >
                  {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day) => {
                    const dateStr = formatDate(day)
                    const count = reservationsByDate.get(dateStr)?.length ?? 0
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    const dow = day.getDay()
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                          isSelected ? 'bg-brand-plum/10' : 'hover:bg-brand-beige/30'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-brand-plum/50'
                          }`}
                        >
                          {DAY_LABELS[dow]}
                        </span>
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            isToday
                              ? 'bg-brand-plum text-white'
                              : isSelected
                              ? 'bg-brand-plum/20 text-brand-plum'
                              : dow === 0
                              ? 'text-red-400'
                              : dow === 6
                              ? 'text-blue-400'
                              : 'text-brand-plum'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {count > 0 ? (
                          <span className="text-[10px] font-bold text-brand-coral bg-brand-coral/10 rounded-full px-1.5 leading-4">
                            {count}
                          </span>
                        ) : (
                          <span className="h-4" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Selected day reservations */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-brand-plum/60">
              {selectedDate.replace(/-/g, '/')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-brand-beige bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-brand-plum/50 mb-0.5">予約件数</p>
                <p className="text-xl font-bold text-brand-plum">{selectedReservations.length} <span className="text-sm font-normal">件</span></p>
              </div>
              <div className="rounded-xl border border-brand-beige bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-brand-plum/50 mb-0.5">同伴</p>
                <p className="text-xl font-bold text-brand-gold">{selectedAccompaniedCount} <span className="text-sm font-normal">件</span></p>
              </div>
            </div>
            {selectedReservations.length === 0 ? (
              <p className="text-sm text-brand-plum/30 py-2">予約なし</p>
            ) : (
              selectedReservations.map((r) => (
                <ReservationCard key={r.id} reservation={r} customerMap={customerMap} customers={customers} castMap={castMap} casts={casts} bottlesByCustomer={bottlesByCustomer} loggedIn={loggedIn} />
              ))
            )}
          </div>
        </>
      )}

      {/* FAB */}
      <Link
        href="/reservations/new"
        className="fixed bottom-20 right-4 sm:bottom-6 z-40 w-14 h-14 bg-brand-plum hover:bg-brand-plum/90 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="予約を追加"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
