'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, X, Plus, AlertTriangle } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { createVisitAction } from './actions'
import type { Cast, Bottle, Customer } from '@/types'

interface NewVisitFormProps {
  customerId: string
  casts: Cast[]
  existingBottles: Bottle[]
  defaultDesignatedCastIds: string[]
  allCustomers: Customer[]
  defaultLinkedCustomerIds: string[]
}

interface BottleRow {
  id: string          // 既存ボトルのID or 'new-{timestamp}'
  name: string
  remaining: number   // 0〜100（5刻み）
  openedDate: string
  isNew: boolean
}

function percentToNum(s: string): number {
  const n = parseInt(s)
  return isNaN(n) ? 5 : Math.round(n / 5) * 5
}

function remainingColor(v: number): string {
  if (v === 0) return 'text-brand-coral'
  if (v <= 30) return 'text-brand-plum/50'
  if (v <= 60) return 'text-brand-plum/80'
  return 'text-brand-plum'
}

function CastMultiSelect({
  label,
  casts,
  selectedIds,
  onChange,
}: {
  label: string
  casts: Cast[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? casts.filter((c) => c.name.includes(query) || c.ruby.includes(query))
    : casts

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-brand-plum">
        {label}
        {selectedIds.length > 0 && (
          <span className="ml-2 text-xs text-brand-plum/60">{selectedIds.length}名選択中</span>
        )}
      </Label>
      <div className="rounded-lg border border-brand-beige bg-white overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige">
            {selectedIds.map((id) => {
              const c = casts.find((x) => x.id === id)
              if (!c) return null
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-xs text-brand-plum">
                  {c.name}
                  <button type="button" onClick={() => toggle(id)} className="text-brand-plum/60 hover:text-brand-plum">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・ふりがなで検索"
            className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-brand-plum placeholder:text-brand-plum/50"
          />
        </div>
        <div className="max-h-36 overflow-y-auto border-t border-brand-beige">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-brand-plum/50">該当するキャストがいません</p>
          ) : (
            filtered.map((cast) => (
              <label
                key={cast.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                  ${selectedIds.includes(cast.id) ? 'bg-white' : 'hover:bg-white'}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(cast.id)}
                  onChange={() => toggle(cast.id)}
                  className="accent-brand-plum"
                />
                <span className="text-sm text-brand-plum">{cast.name}</span>
                <span className="text-xs text-brand-plum/50">（{cast.ruby}）</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const today = new Date().toISOString().split('T')[0]

export function NewVisitForm({
  customerId,
  casts,
  existingBottles,
  defaultDesignatedCastIds,
  allCustomers,
  defaultLinkedCustomerIds,
}: NewVisitFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [designatedCastIds, setDesignatedCastIds] = useState<string[]>(defaultDesignatedCastIds)
  const [inStoreCastIds, setInStoreCastIds] = useState<string[]>([])
  const [linkedCustomerIds, setLinkedCustomerIds] = useState<string[]>(defaultLinkedCustomerIds)
  const [linkedQuery, setLinkedQuery] = useState('')
  const [isAlert, setIsAlert] = useState(false)
  const [alertReason, setAlertReason] = useState('')
  const [bottles, setBottles] = useState<BottleRow[]>(
    existingBottles.map((b) => ({
      id: b.id,
      name: b.name,
      remaining: percentToNum(b.remaining),
      openedDate: b.openedDate.split('T')[0],
      isNew: false,
    }))
  )

  const addBottle = () => {
    setBottles((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: '', remaining: 100, openedDate: today, isNew: true },
    ])
  }

  const removeBottle = (id: string) => {
    setBottles((prev) => prev.filter((b) => b.id !== id))
  }

  const updateField = (id: string, field: 'name' | 'remaining' | 'openedDate', value: string | number) => {
    setBottles((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    const visitDate = new Date(formData.get('visitDate') as string).toISOString()

    const result = await createVisitAction({
      customerId,
      visitDate,
      designatedCastIds,
      inStoreCastIds,
      bottleUpdates: bottles
        .filter((b) => !b.isNew)
        .map((b) => ({ id: b.id, remaining: `${b.remaining}%` })),
      newBottles: bottles
        .filter((b) => b.isNew && b.name.trim())
        .map((b) => ({
          name: b.name,
          remaining: `${b.remaining}%`,
          openedDate: visitDate,
        })),
      memo: formData.get('memo') as string,
      linkedCustomerIds,
      isAlert,
      alertReason: isAlert ? alertReason : '',
    })

    setLoading(false)
    if (result.success) {
      router.push(`/customers/${customerId}`)
    } else {
      setError(result.error ?? '登録に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-brand-plum">
          来店日<span className="text-brand-coral ml-0.5">*</span>
        </Label>
        <Input name="visitDate" type="date" required defaultValue={today} />
      </div>

      <CastMultiSelect
        label="本指名キャスト"
        casts={casts}
        selectedIds={designatedCastIds}
        onChange={setDesignatedCastIds}
      />

      <CastMultiSelect
        label="場内指名キャスト"
        casts={casts}
        selectedIds={inStoreCastIds}
        onChange={setInStoreCastIds}
      />

      {/* キープボトル */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-brand-plum">
            キープボトル
            {bottles.length > 0 && (
              <span className="ml-2 text-xs text-brand-plum/60">{bottles.length}本</span>
            )}
          </Label>
          <button
            type="button"
            onClick={addBottle}
            className="flex items-center gap-1 text-sm text-brand-plum hover:text-brand-plum font-medium"
          >
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>

        {bottles.length === 0 && (
          <p className="text-xs text-brand-plum/50 py-1">キープボトルはありません</p>
        )}

        <div className="space-y-3">
          {bottles.map((bottle) => (
            <div key={bottle.id} className="rounded-lg border border-brand-beige bg-white p-3 space-y-3">
              <div className="flex items-center gap-2">
                <GiBrandyBottle size={16} className="text-brand-plum/60 shrink-0" />
                {bottle.isNew ? (
                  <Input
                    value={bottle.name}
                    onChange={(e) => updateField(bottle.id, 'name', e.target.value)}
                    placeholder="ボトル名（例：山崎12年）"
                    className="flex-1 h-8 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-brand-plum truncate">
                    {bottle.name}
                  </span>
                )}
                {bottle.isNew && (
                  <button
                    type="button"
                    onClick={() => removeBottle(bottle.id)}
                    className="text-brand-plum/50 hover:text-brand-coral shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 残量スライダー */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-plum/60">残量</span>
                  <span className={`text-sm font-bold tabular-nums ${remainingColor(bottle.remaining)}`}>
                    {bottle.remaining}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={bottle.remaining}
                    onChange={(e) => updateField(bottle.id, 'remaining', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-plum"
                    style={{
                      background: `linear-gradient(to right, #4B3C52 0%, #4B3C52 ${bottle.remaining}%, #E8E2D9 ${bottle.remaining}%, #E8E2D9 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-brand-plum/50">0%</span>
                    <span className="text-[10px] text-brand-plum/50">50%</span>
                    <span className="text-[10px] text-brand-plum/50">100%</span>
                  </div>
                </div>
              </div>

              {/* 開封日（新規ボトルのみ） */}
              {bottle.isNew && (
                <div className="space-y-1">
                  <span className="text-xs text-brand-plum/60">開封日</span>
                  <Input
                    type="date"
                    value={bottle.openedDate}
                    onChange={(e) => updateField(bottle.id, 'openedDate', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 同伴者・グループ */}
      {allCustomers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-brand-plum">
            同伴者・グループ客
            {linkedCustomerIds.length > 0 && (
              <span className="ml-2 text-xs text-brand-plum/60">{linkedCustomerIds.length}名選択中</span>
            )}
          </Label>
          <div className="rounded-lg border border-brand-beige bg-white overflow-hidden">
            {linkedCustomerIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige">
                {linkedCustomerIds.map((lid) => {
                  const c = allCustomers.find((x) => x.id === lid)
                  if (!c) return null
                  return (
                    <span key={lid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-xs text-brand-plum">
                      {c.name}
                      <button
                        type="button"
                        onClick={() => setLinkedCustomerIds((prev) => prev.filter((x) => x !== lid))}
                        className="text-brand-plum/60 hover:text-brand-plum"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
              <input
                type="text"
                value={linkedQuery}
                onChange={(e) => setLinkedQuery(e.target.value)}
                placeholder="名前・ふりがな・ニックネームで検索"
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-brand-plum placeholder:text-brand-plum/50"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border-t border-brand-beige">
              {(() => {
                const filtered = linkedQuery.trim()
                  ? allCustomers.filter((c) =>
                      c.name.includes(linkedQuery) ||
                      c.ruby.includes(linkedQuery) ||
                      c.nickname.includes(linkedQuery)
                    )
                  : allCustomers
                return filtered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-brand-plum/50">該当する顧客がいません</p>
                ) : (
                  filtered.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                        linkedCustomerIds.includes(c.id) ? 'bg-white' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={linkedCustomerIds.includes(c.id)}
                        onChange={() =>
                          setLinkedCustomerIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          )
                        }
                        className="accent-brand-plum"
                      />
                      <span className="text-sm text-brand-plum">{c.name}</span>
                      <span className="text-xs text-brand-plum/50">({c.ruby})</span>
                    </label>
                  ))
                )
              })()}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg border transition-colors ${isAlert ? 'border-brand-coral/40 bg-brand-coral/10' : 'border-brand-beige bg-white'}`}>
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={() => setIsAlert((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isAlert ? 'bg-brand-coral' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAlert ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <Label className="text-brand-plum cursor-pointer" onClick={() => setIsAlert((v) => !v)}>
            要注意フラグ
            {isAlert && <span className="ml-2 text-brand-coral text-xs font-normal">（要注意バッジが表示されます）</span>}
          </Label>
        </div>
        {isAlert && (
          <div className="px-3 pb-3">
            <textarea
              value={alertReason}
              onChange={(e) => setAlertReason(e.target.value)}
              placeholder="要注意の理由を入力（例：無断キャンセル、支払いトラブルなど）"
              rows={3}
              className="w-full text-sm rounded-md border border-brand-coral/40 bg-white px-3 py-2 text-brand-plum placeholder:text-brand-plum/50 outline-none focus:ring-1 focus:ring-brand-coral/40 resize-none"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">メモ</Label>
        <Textarea name="memo" placeholder="特記事項など" rows={3} />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11"
      >
        {loading ? '記録中...' : '来店を記録する'}
      </Button>
    </form>
  )
}
