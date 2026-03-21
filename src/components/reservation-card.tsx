'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, X, Edit, Trash2, Check, Search, ChevronRight, Phone, ExternalLink } from 'lucide-react'
import type { Cast, Customer, Reservation } from '@/types'
import { updateReservationAction, deleteReservationAction } from '@/lib/reservation-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ReservationCardProps {
  reservation: Reservation
  customerMap: Map<string, Customer>
  customers: Customer[]
  castMap: Map<string, Cast>
  casts: Cast[]
  bottlesByCustomer: Map<string, number>
  loggedIn: boolean
  showDate?: boolean
}

type ModalMode = 'view' | 'edit' | 'delete'

// キャスト複数選択ピッカー
function CastPicker({
  casts,
  selectedIds,
  onChange,
  label,
}: {
  casts: Cast[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label: string
}) {
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? casts.filter((c) => c.name.includes(query) || c.ruby.includes(query))
    : casts

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  const selectedCasts = casts.filter((c) => selectedIds.includes(c.id))

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="rounded-lg border border-brand-beige bg-white overflow-hidden">
        {selectedCasts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige">
            {selectedCasts.map((c) => (
              <span key={c.id} className="flex items-center gap-1 text-xs bg-brand-plum/10 text-brand-plum px-2 py-0.5 rounded-full">
                {c.name}
                <button type="button" onClick={() => toggle(c.id)} className="hover:text-brand-coral">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・ふりがなで検索"
            className="w-full pl-9 pr-3 py-2 text-sm bg-transparent outline-none text-brand-plum placeholder:text-brand-plum/50"
          />
        </div>
        <div className="max-h-36 overflow-y-auto border-t border-brand-beige">
          {filtered.map((c) => {
            const sel = selectedIds.includes(c.id)
            return (
              <button key={c.id} type="button" onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-beige/50 ${sel ? 'bg-brand-plum/5' : ''}`}>
                <span className={`w-4 h-4 flex items-center justify-center rounded border shrink-0 ${sel ? 'bg-brand-plum border-brand-plum' : 'border-brand-beige'}`}>
                  {sel && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="text-sm text-brand-plum">{c.name}</span>
                <span className="text-xs text-brand-plum/50">({c.ruby})</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ReservationCard({ reservation: r, customerMap, customers, castMap, casts, bottlesByCustomer, loggedIn, showDate }: ReservationCardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')

  // Edit state
  const [editDate, setEditDate] = useState(r.date)
  const [editTime, setEditTime] = useState(r.time)
  const [editPartySize, setEditPartySize] = useState(r.partySize)
  const [editPhone, setEditPhone] = useState(r.phone ?? '')
  const [editHasDesignation, setEditHasDesignation] = useState(r.hasDesignation)
  const [editDesignatedCastIds, setEditDesignatedCastIds] = useState<string[]>(r.designatedCastIds)
  const [editIsAccompanied, setEditIsAccompanied] = useState(r.isAccompanied)
  const [editAccompaniedCastIds, setEditAccompaniedCastIds] = useState<string[]>(r.accompaniedCastIds)
  const [editCustomerType, setEditCustomerType] = useState<'existing' | 'new'>(r.customerType)
  const [editCustomerIds, setEditCustomerIds] = useState<string[]>(r.customerIds)
  const [editGuestName, setEditGuestName] = useState(r.guestName)
  const [editPriceType, setEditPriceType] = useState<'normal' | 'party'>(r.priceType)
  const [editPartyPlanPrice, setEditPartyPlanPrice] = useState(r.partyPlanPrice?.toString() ?? '')
  const [editPartyPlanMinutes, setEditPartyPlanMinutes] = useState(r.partyPlanMinutes?.toString() ?? '90')
  const [editMemo, setEditMemo] = useState(r.memo)
  const [customerQuery, setCustomerQuery] = useState('')
  const [isVisited, setIsVisited] = useState(r.isVisited)
  const [visitedLoading, setVisitedLoading] = useState(false)

  const reservationCustomers = r.customerIds.map((id) => customerMap.get(id)).filter(Boolean) as Customer[]
  const designatedCastNames = r.designatedCastIds.map((id) => castMap.get(id)?.name).filter(Boolean).join('・')
  const accompaniedCastNames = r.accompaniedCastIds.map((id) => castMap.get(id)?.name).filter(Boolean).join('・')

  const filteredCustomers = customerQuery.trim()
    ? customers.filter((c) => c.name.includes(customerQuery) || c.ruby.includes(customerQuery) || c.nickname.includes(customerQuery))
    : customers
  const editSelectedCustomers = customers.filter((c) => editCustomerIds.includes(c.id))

  function toggleEditCustomer(id: string) {
    setEditCustomerIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function openModal() { setMode('view'); setError(''); setIsOpen(true) }
  function closeModal() { setIsOpen(false); setError(''); setPassword('') }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await updateReservationAction(r.id, {
      date: editDate,
      time: editTime,
      partySize: editPartySize,
      phone: editPhone,
      hasDesignation: editHasDesignation,
      designatedCastIds: editHasDesignation ? editDesignatedCastIds : [],
      isAccompanied: editIsAccompanied,
      accompaniedCastIds: editIsAccompanied ? editAccompaniedCastIds : [],
      customerType: editCustomerType,
      customerIds: editCustomerType === 'existing' ? editCustomerIds : [],
      guestName: editCustomerType === 'new' ? editGuestName : '',
      priceType: editPriceType,
      partyPlanPrice: editPriceType === 'party' && editPartyPlanPrice ? Number(editPartyPlanPrice) : null,
      partyPlanMinutes: editPriceType === 'party' && editPartyPlanMinutes ? Number(editPartyPlanMinutes) : null,
      memo: editMemo,
    })
    setLoading(false)
    if (result.success) { closeModal(); router.refresh() }
    else setError(result.error ?? '更新に失敗しました')
  }

  async function handleDelete() {
    setLoading(true); setError('')
    const result = await deleteReservationAction(r.id, password)
    setLoading(false)
    if (result.success) { closeModal(); router.refresh() }
    else { setError(result.error ?? '削除に失敗しました'); setPassword('') }
  }

  async function toggleVisited() {
    setVisitedLoading(true)
    const next = !isVisited
    await updateReservationAction(r.id, { isVisited: next })
    setIsVisited(next)
    setVisitedLoading(false)
    router.refresh()
  }

  return (
    <>
      {/* カードトリガー */}
      <div
        onClick={openModal}
        className={`rounded-lg border p-3 space-y-1.5 cursor-pointer transition-colors ${
          isVisited
            ? 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'
            : 'bg-white border-brand-beige hover:bg-brand-beige/20'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-brand-plum/50 shrink-0" />
            {showDate && <span className="text-sm font-semibold text-brand-plum">{r.date.replace(/-/g, '/')}</span>}
            <span className="text-sm font-semibold text-brand-plum">{r.time}</span>
            <span className="text-sm text-brand-plum">{r.partySize}名</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {r.hasDesignation && (
                <span className="text-[10px] bg-brand-plum/10 text-brand-plum px-1.5 py-0.5 rounded-full font-medium">
                  指名{r.designatedCastIds.length > 0 && '：'}
                  {r.designatedCastIds.map((cid, i) => {
                    const c = castMap.get(cid)
                    if (!c) return null
                    return (
                      <span key={cid}>
                        {i > 0 && '・'}
                        <Link href={`/casts/${cid}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{c.name}</Link>
                      </span>
                    )
                  })}
                </span>
              )}
              {r.isAccompanied && (
                <span className="text-[10px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded-full font-medium">
                  同伴{r.accompaniedCastIds.length > 0 && '：'}
                  {r.accompaniedCastIds.map((cid, i) => {
                    const c = castMap.get(cid)
                    if (!c) return null
                    return (
                      <span key={cid}>
                        {i > 0 && '・'}
                        <Link href={`/casts/${cid}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{c.name}</Link>
                      </span>
                    )
                  })}
                </span>
              )}
              {r.priceType === 'party' && (
                <span className="text-[10px] bg-brand-coral/10 text-brand-coral px-1.5 py-0.5 rounded-full font-medium">パーティー</span>
              )}
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-brand-plum/30 shrink-0" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.customerType === 'existing' ? 'bg-brand-beige text-brand-plum/70' : 'bg-gray-100 text-gray-500'}`}>
            {r.customerType === 'existing' ? '既存' : '初来店'}
          </span>
          {reservationCustomers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-brand-plum font-medium hover:underline"
            >
              {c.name}
            </Link>
          ))}
          {r.customerType === 'new' && r.guestName && <span className="text-xs text-brand-plum/70">{r.guestName}</span>}
          {reservationCustomers.map((c) => (bottlesByCustomer.get(c.id) ?? 0) > 0 && (
            <span key={`bottle-${c.id}`} className="text-[11px] text-brand-gold font-medium">🍾 {bottlesByCustomer.get(c.id)}本</span>
          ))}
        </div>
        {r.memo && <p className="text-[11px] text-brand-plum/50 border-t border-brand-beige pt-1.5 line-clamp-1">{r.memo}</p>}
      </div>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="sticky top-0 bg-white border-b border-brand-beige px-4 py-3 flex items-center gap-2">
              {mode === 'view' && (
                <>
                  <div className="flex items-center gap-2 font-semibold text-brand-plum flex-1 min-w-0">
                    <Clock className="h-4 w-4 text-brand-plum/60 shrink-0" />
                    <span className="truncate">{r.date.replace(/-/g, '/')} {r.time}</span>
                  </div>
                  {loggedIn && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setMode('edit')} className="p-1.5 rounded-lg hover:bg-brand-beige/50 text-brand-plum/80">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setMode('delete')} className="p-1.5 rounded-lg hover:bg-brand-coral/10 text-brand-coral">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-brand-beige/50 text-brand-plum/60">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {mode === 'edit' && (
                <>
                  <span className="font-semibold text-brand-plum flex-1">予約を編集</span>
                  <button onClick={() => { setMode('view'); setError('') }} className="p-1.5 rounded-lg hover:bg-brand-beige/50 text-brand-plum/60">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {mode === 'delete' && (
                <>
                  <span className="font-semibold text-brand-coral flex-1">予約を削除</span>
                  <button onClick={() => { setMode('view'); setError('') }} className="p-1.5 rounded-lg hover:bg-brand-beige/50 text-brand-plum/60">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <div className="p-4">
              {/* ── 詳細表示 ── */}
              {mode === 'view' && (
                <div className="space-y-3 text-sm">
                  <Row label="日時">{r.date.replace(/-/g, '/')} {r.time}</Row>
                  <Row label="人数">{r.partySize}名</Row>
                  {r.phone && <Row label="連絡先"><span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-brand-plum/50" />{r.phone}</span></Row>}
                  <Row label="来店区分">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${r.customerType === 'existing' ? 'bg-brand-beige text-brand-plum/70' : 'bg-gray-100 text-gray-500'}`}>
                      {r.customerType === 'existing' ? '既存顧客' : '初来店'}
                    </span>
                    {reservationCustomers.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && '・'}
                        <Link href={`/customers/${c.id}`} onClick={closeModal} className="ml-1 font-medium text-brand-plum hover:underline inline-flex items-center gap-0.5">
                          {c.name}<ExternalLink className="h-3 w-3 opacity-50" />
                        </Link>
                      </span>
                    ))}
                    {r.customerType === 'new' && r.guestName && <span className="ml-1 text-brand-plum/70">{r.guestName}</span>}
                  </Row>
                  {r.hasDesignation && (
                    <Row label="指名">
                      {r.designatedCastIds.length > 0
                        ? r.designatedCastIds.map((cid, i) => {
                            const c = castMap.get(cid)
                            if (!c) return null
                            return (
                              <span key={cid}>
                                {i > 0 && '・'}
                                <Link href={`/casts/${cid}`} onClick={closeModal} className="font-medium text-brand-plum hover:underline inline-flex items-center gap-0.5">
                                  {c.name}<ExternalLink className="h-3 w-3 opacity-50" />
                                </Link>
                              </span>
                            )
                          })
                        : '—'}
                    </Row>
                  )}
                  {r.isAccompanied && (
                    <Row label="同伴">
                      {r.accompaniedCastIds.length > 0
                        ? r.accompaniedCastIds.map((cid, i) => {
                            const c = castMap.get(cid)
                            if (!c) return null
                            return (
                              <span key={cid}>
                                {i > 0 && '・'}
                                <Link href={`/casts/${cid}`} onClick={closeModal} className="font-medium text-brand-plum hover:underline inline-flex items-center gap-0.5">
                                  {c.name}<ExternalLink className="h-3 w-3 opacity-50" />
                                </Link>
                              </span>
                            )
                          })
                        : '—'}
                    </Row>
                  )}
                  <Row label="料金">
                    {r.priceType === 'normal' ? '通常料金' : (
                      <span>パーティープラン{r.partyPlanPrice ? ` ¥${r.partyPlanPrice.toLocaleString()}` : ''}{r.partyPlanMinutes ? ` / ${r.partyPlanMinutes}分` : ''}</span>
                    )}
                  </Row>
                  {r.memo && <Row label="メモ"><span className="whitespace-pre-wrap">{r.memo}</span></Row>}
                  {!loggedIn && <p className="text-xs text-brand-plum/50 pt-2 text-center">編集・削除にはログインが必要です</p>}

                  {/* 来店済スイッチ */}
                  <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isVisited ? 'border-green-200' : 'border-brand-beige'}`}>
                    <span className={`text-sm font-medium ${isVisited ? 'text-green-600' : 'text-brand-plum/60'}`}>
                      {isVisited ? '来店済み' : '来店前'}
                    </span>
                    <button
                      type="button"
                      onClick={toggleVisited}
                      disabled={visitedLoading}
                      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${isVisited ? 'bg-green-500' : 'bg-gray-200'} disabled:opacity-50`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isVisited ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── 編集 ── */}
              {mode === 'edit' && (
                <>
                  <form id="res-edit-form" onSubmit={handleEdit} className="space-y-4 pb-24">
                    {error && <ErrorBox>{error}</ErrorBox>}

                    <div className="space-y-1.5">
                      <Label>日付<Req /></Label>
                      <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>時間<Req /></Label>
                      <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>人数<Req /></Label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setEditPartySize((n) => Math.max(1, n - 1))} className="w-9 h-9 rounded-lg border border-brand-beige bg-white text-brand-plum text-lg font-bold hover:bg-brand-beige/50">−</button>
                        <span className="text-xl font-bold text-brand-plum w-12 text-center tabular-nums">{editPartySize}</span>
                        <button type="button" onClick={() => setEditPartySize((n) => n + 1)} className="w-9 h-9 rounded-lg border border-brand-beige bg-white text-brand-plum text-lg font-bold hover:bg-brand-beige/50">＋</button>
                        <span className="text-sm text-brand-plum/60">名</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>連絡先（電話番号）</Label>
                      <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="090-1234-5678" />
                    </div>

                    {/* 指名 */}
                    <div className="space-y-2">
                      <div className="rounded-lg border border-brand-beige bg-white p-3">
                        <ToggleSwitch value={editHasDesignation} onChange={(v) => { setEditHasDesignation(v); if (!v) setEditDesignatedCastIds([]) }} label="指名なし" activeLabel="指名あり" />
                      </div>
                      {editHasDesignation && (
                        <CastPicker casts={casts} selectedIds={editDesignatedCastIds} onChange={setEditDesignatedCastIds} label="指名キャスト（複数可）" />
                      )}
                    </div>

                    {/* 同伴 */}
                    <div className="space-y-2">
                      <Label>来店種別</Label>
                      <select
                        value={editIsAccompanied ? 'accompanied' : 'normal'}
                        onChange={(e) => { const v = e.target.value === 'accompanied'; setEditIsAccompanied(v); if (!v) setEditAccompaniedCastIds([]) }}
                        className="w-full rounded-lg border border-brand-beige bg-white px-3 py-2.5 text-sm text-brand-plum outline-none"
                      >
                        <option value="normal">通常来店</option>
                        <option value="accompanied">同伴</option>
                      </select>
                      {editIsAccompanied && (
                        <CastPicker casts={casts} selectedIds={editAccompaniedCastIds} onChange={setEditAccompaniedCastIds} label="同伴キャスト（複数可）" />
                      )}
                    </div>

                    {/* 来店区分 */}
                    <div className="space-y-1.5">
                      <Label>来店区分</Label>
                      <div className="flex rounded-lg border border-brand-beige overflow-hidden text-sm font-medium">
                        <button type="button" onClick={() => setEditCustomerType('new')} className={`flex-1 py-2.5 transition-colors ${editCustomerType === 'new' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}>初来店</button>
                        <button type="button" onClick={() => setEditCustomerType('existing')} className={`flex-1 py-2.5 transition-colors ${editCustomerType === 'existing' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}>既存顧客</button>
                      </div>
                      {editCustomerType === 'new' && (
                        <Input type="text" value={editGuestName} onChange={(e) => setEditGuestName(e.target.value)} placeholder="予約名（任意）" className="mt-2" />
                      )}
                      {editCustomerType === 'existing' && (
                        <div className="rounded-lg border border-brand-beige bg-white overflow-hidden mt-2">
                          {editSelectedCustomers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige bg-brand-plum/5">
                              {editSelectedCustomers.map((c) => (
                                <span key={c.id} className="flex items-center gap-1 text-xs bg-brand-plum/10 text-brand-plum px-2 py-0.5 rounded-full font-medium">
                                  {c.name}
                                  <button type="button" onClick={() => toggleEditCustomer(c.id)} className="hover:text-brand-coral"><X className="h-3 w-3" /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
                            <input type="text" value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="名前・ふりがなで検索" className="w-full pl-9 pr-3 py-2 text-sm bg-transparent outline-none text-brand-plum placeholder:text-brand-plum/50" />
                          </div>
                          <div className="max-h-40 overflow-y-auto border-t border-brand-beige">
                            {filteredCustomers.map((c) => {
                              const isSel = editCustomerIds.includes(c.id)
                              return (
                                <button key={c.id} type="button" onClick={() => toggleEditCustomer(c.id)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-beige/50 ${isSel ? 'bg-brand-plum/5' : ''}`}>
                                  <span className={`w-4 h-4 flex items-center justify-center rounded border shrink-0 ${isSel ? 'bg-brand-plum border-brand-plum' : 'border-brand-beige'}`}>
                                    {isSel && <Check className="h-3 w-3 text-white" />}
                                  </span>
                                  <span className="text-sm text-brand-plum">{c.name}</span>
                                  <span className="text-xs text-brand-plum/50">({c.ruby})</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 料金プラン */}
                    <div className="space-y-1.5">
                      <Label>料金プラン</Label>
                      <div className="flex rounded-lg border border-brand-beige overflow-hidden text-sm font-medium">
                        <button type="button" onClick={() => setEditPriceType('normal')} className={`flex-1 py-2.5 transition-colors ${editPriceType === 'normal' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}>通常料金</button>
                        <button type="button" onClick={() => setEditPriceType('party')} className={`flex-1 py-2.5 transition-colors ${editPriceType === 'party' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}>パーティープラン</button>
                      </div>
                      {editPriceType === 'party' && (
                        <div className="rounded-lg border border-brand-beige bg-white p-3 space-y-3 mt-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm">金額（円）</Label>
                            <Input type="number" value={editPartyPlanPrice} onChange={(e) => setEditPartyPlanPrice(e.target.value)} placeholder="例：30000" min={0} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">セット時間（分）</Label>
                            <Input type="number" value={editPartyPlanMinutes} onChange={(e) => setEditPartyPlanMinutes(e.target.value)} placeholder="例：90" min={0} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* メモ */}
                    <div className="space-y-1.5">
                      <Label>特記事項・メモ</Label>
                      <Textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={3} />
                    </div>
                  </form>
                  <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-brand-beige px-4 py-3">
                    <Button type="submit" form="res-edit-form" disabled={loading} className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
                      {loading ? '更新中...' : '更新する'}
                    </Button>
                  </div>
                </>
              )}

              {/* ── 削除 ── */}
              {mode === 'delete' && (
                <div className="space-y-4">
                  {error && <ErrorBox>{error}</ErrorBox>}
                  <p className="text-sm text-brand-plum">
                    <span className="font-semibold">{r.date.replace(/-/g, '/')} {r.time}</span> の予約を削除しますか？この操作は元に戻せません。
                  </p>
                  <div className="space-y-1.5">
                    <Label>パスワード</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="削除パスワード" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setMode('view'); setError('') }} className="flex-1">キャンセル</Button>
                    <Button onClick={handleDelete} disabled={loading || !password} className="flex-1 bg-brand-coral hover:bg-brand-coral/90 text-white">
                      {loading ? '削除中...' : '削除する'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── ユーティリティコンポーネント ──────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-brand-plum/50 w-16 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-brand-plum text-sm">{children}</span>
    </div>
  )
}

function Req() {
  return <span className="text-brand-coral ml-0.5">*</span>
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">{children}</div>
  )
}

function ToggleSwitch({ value, onChange, label, activeLabel }: { value: boolean; onChange: (v: boolean) => void; label: string; activeLabel: string }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-brand-plum' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-brand-plum">{value ? activeLabel : label}</span>
    </div>
  )
}
