'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, User, AlertTriangle, X, Edit, Trash2, ChevronRight } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import { formatDate } from '@/lib/utils'
import type { VisitRecord, Cast, Bottle } from '@/types'
import { updateVisitAction, deleteVisitAction } from '@/lib/visit-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BottleCard } from '@/components/bottle-card'

interface VisitCardProps {
  visit: VisitRecord
  casts: Cast[]
  bottles: Bottle[]
  loggedIn?: boolean
}

type ModalMode = 'view' | 'edit' | 'delete'

export function VisitCard({ visit, casts, bottles, loggedIn }: VisitCardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')

  const [editDate, setEditDate] = useState(visit.visitDate.split('T')[0])
  const [editMemo, setEditMemo] = useState(visit.memo)
  const [editIsAlert, setEditIsAlert] = useState(visit.isAlert ?? false)
  const [editAlertReason, setEditAlertReason] = useState(visit.alertReason ?? '')
  const [editDesignatedCastIds, setEditDesignatedCastIds] = useState<string[]>(visit.designatedCastIds)
  const [editInStoreCastIds, setEditInStoreCastIds] = useState<string[]>(visit.inStoreCastIds)

  const castMap = new Map(casts.map((c) => [c.id, c]))
  const designatedCasts = visit.designatedCastIds.map((id) => castMap.get(id)).filter(Boolean)
  const inStoreCasts = visit.inStoreCastIds.map((id) => castMap.get(id)).filter(Boolean)

  const bottleMap = new Map(bottles.map((b) => [b.id, b]))
  const openedBottles = visit.bottlesOpened.map((id) => bottleMap.get(id)).filter(Boolean) as Bottle[]
  const usedBottles = visit.bottlesUsed.map((id) => bottleMap.get(id)).filter(Boolean) as Bottle[]

  // Use snapshots for historical bottle remaining display if available
  const snapshotMap = new Map((visit.bottleSnapshots ?? []).map((b) => [b.id, b]))
  const hasSnapshots = snapshotMap.size > 0
  const snapshotBottles = hasSnapshots
    ? [...new Map([...openedBottles, ...usedBottles].map((b) => [b.id, snapshotMap.get(b.id) ?? b])).values()]
    : [...new Map([...openedBottles, ...usedBottles].map((b) => [b.id, b])).values()]

  const isAlert = visit.isAlert ?? false
  const whiteStyle = isAlert ? { color: 'white' } : {}

  function openModal() {
    setMode('view')
    setError('')
    setIsOpen(true)
  }

  function closeModal() {
    setIsOpen(false)
    setError('')
    setPassword('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await updateVisitAction(visit.id, {
      visitDate: new Date(editDate).toISOString(),
      memo: editMemo,
      isAlert: editIsAlert,
      alertReason: editIsAlert ? editAlertReason : '',
      designatedCastIds: editDesignatedCastIds,
      inStoreCastIds: editInStoreCastIds,
    })
    setLoading(false)
    if (result.success) {
      closeModal()
      router.refresh()
    } else {
      setError(result.error ?? '更新に失敗しました')
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await deleteVisitAction(visit.id, password)
    setLoading(false)
    if (result.success) {
      closeModal()
      router.refresh()
    } else {
      setError(result.error ?? '削除に失敗しました')
    }
  }

  function toggleCast(id: string, type: 'designated' | 'inStore') {
    if (type === 'designated') {
      setEditDesignatedCastIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    } else {
      setEditInStoreCastIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }

  return (
    <>
      <div
        onClick={openModal}
        className={`rounded-xl border p-4 space-y-3 shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${
          isAlert ? 'border-brand-coral bg-brand-coral' : 'border-brand-beige bg-white'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold" style={whiteStyle}>
          {isAlert && <AlertTriangle className="h-4 w-4 shrink-0" />}
          <Calendar className="h-4 w-4" />
          <span>{formatDate(visit.visitDate)}</span>
          <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
        </div>

        {(designatedCasts.length > 0 || inStoreCasts.length > 0) && (
          <div className="flex flex-wrap gap-3 text-sm" style={whiteStyle}>
            {designatedCasts.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span className={isAlert ? '' : 'text-brand-plum/50'}>本指名:</span>
                <span className="font-medium">{designatedCasts.map((c) => c!.name).join('・')}</span>
              </div>
            )}
            {inStoreCasts.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 opacity-60" />
                <span className={isAlert ? '' : 'text-brand-plum/50'}>場内:</span>
                <span>{inStoreCasts.map((c) => c!.name).join('・')}</span>
              </div>
            )}
          </div>
        )}

        {openedBottles.length > 0 && (
          <div className="text-sm flex items-center gap-1.5" style={whiteStyle}>
            <GiBrandyBottle size={14} />
            <span className={isAlert ? '' : 'text-brand-plum/50'}>開封:</span>
            <span>{openedBottles.map((b) => b.name).join(', ')}</span>
          </div>
        )}
        {usedBottles.length > 0 && (
          <div className="text-sm flex items-center gap-1.5" style={whiteStyle}>
            <GiBrandyBottle size={14} style={{ opacity: 0.6 }} />
            <span className={isAlert ? '' : 'text-brand-plum/50'}>使用:</span>
            <span>{usedBottles.map((b) => b.name).join(', ')}</span>
          </div>
        )}

        {visit.memo && (
          <p
            className={`text-sm border-t pt-2 ${isAlert ? 'border-brand-coral' : 'border-brand-beige text-brand-plum/60'}`}
            style={whiteStyle}
          >
            {visit.memo}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-brand-beige px-4 py-3 flex items-center gap-2">
              {mode === 'view' && (
                <>
                  <div className="flex items-center gap-2 font-semibold text-brand-plum flex-1 min-w-0">
                    <Calendar className="h-4 w-4 text-brand-plum/60 shrink-0" />
                    <span className="truncate">{formatDate(visit.visitDate)}</span>
                    {isAlert && <AlertTriangle className="h-4 w-4 text-brand-coral shrink-0" />}
                  </div>
                  {loggedIn && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMode('edit')}
                        className="p-1.5 rounded-lg hover:bg-white text-brand-plum/80"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setMode('delete')}
                        className="p-1.5 rounded-lg hover:bg-brand-coral/10 text-brand-coral"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-white text-brand-plum/60">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {mode === 'edit' && (
                <>
                  <span className="font-semibold text-brand-plum flex-1">来店記録を編集</span>
                  <button onClick={() => { setMode('view'); setError('') }} className="p-1.5 rounded-lg hover:bg-white text-brand-plum/60">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
              {mode === 'delete' && (
                <>
                  <span className="font-semibold text-brand-coral flex-1">来店記録を削除</span>
                  <button onClick={() => { setMode('view'); setError('') }} className="p-1.5 rounded-lg hover:bg-white text-brand-plum/60">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <div className="p-4">
              {/* View */}
              {mode === 'view' && (
                <div className="space-y-3 text-sm">
                  {isAlert && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{visit.alertReason ? visit.alertReason : '要注意フラグあり'}</span>
                    </div>
                  )}
                  {designatedCasts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-plum/50 w-16 shrink-0">本指名</span>
                      <span className="text-brand-plum">{designatedCasts.map((c) => c!.name).join('・')}</span>
                    </div>
                  )}
                  {inStoreCasts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-plum/50 w-16 shrink-0">場内</span>
                      <span className="text-brand-plum">{inStoreCasts.map((c) => c!.name).join('・')}</span>
                    </div>
                  )}
                  {openedBottles.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-plum/50 w-16 shrink-0">開封</span>
                      <span className="text-brand-plum">{openedBottles.map((b) => b.name).join(', ')}</span>
                    </div>
                  )}
                  {usedBottles.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-plum/50 w-16 shrink-0">使用</span>
                      <span className="text-brand-plum">{usedBottles.map((b) => b.name).join(', ')}</span>
                    </div>
                  )}
                  {visit.memo && (
                    <div className="flex items-start gap-2">
                      <span className="text-brand-plum/50 w-16 shrink-0">メモ</span>
                      <span className="text-brand-plum whitespace-pre-wrap">{visit.memo}</span>
                    </div>
                  )}

                  {/* ボトル残量 */}
                  {(openedBottles.length > 0 || usedBottles.length > 0) && (
                    <div className="pt-1 space-y-2">
                      <span className="text-xs text-brand-plum/50">ボトル残量</span>
                      <div className="space-y-2">
                        {snapshotBottles.map((bottle) => (
                          <BottleCard key={bottle.id} bottle={bottle} />
                        ))}
                      </div>
                    </div>
                  )}

                  {!loggedIn && (
                    <p className="text-xs text-brand-plum/50 pt-2 text-center">編集・削除にはログインが必要です</p>
                  )}
                </div>
              )}

              {/* Edit */}
              {mode === 'edit' && (
                <>
                <form id="visit-edit-form" onSubmit={handleEdit} className="space-y-4 pb-24">
                  {error && (
                    <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">{error}</div>
                  )}
                  <div className="space-y-1.5">
                    <Label>来店日</Label>
                    <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label>本指名キャスト</Label>
                    <div className="rounded-lg border border-brand-beige bg-white max-h-36 overflow-y-auto">
                      {casts.map((cast) => (
                        <label key={cast.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${editDesignatedCastIds.includes(cast.id) ? 'bg-white' : 'hover:bg-white'}`}>
                          <input type="checkbox" checked={editDesignatedCastIds.includes(cast.id)} onChange={() => toggleCast(cast.id, 'designated')} className="accent-brand-plum" />
                          <span className="text-sm text-brand-plum">{cast.name}</span>
                          <span className="text-xs text-brand-plum/50">（{cast.ruby}）</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>場内指名キャスト</Label>
                    <div className="rounded-lg border border-brand-beige bg-white max-h-36 overflow-y-auto">
                      {casts.map((cast) => (
                        <label key={cast.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${editInStoreCastIds.includes(cast.id) ? 'bg-white' : 'hover:bg-white'}`}>
                          <input type="checkbox" checked={editInStoreCastIds.includes(cast.id)} onChange={() => toggleCast(cast.id, 'inStore')} className="accent-brand-plum" />
                          <span className="text-sm text-brand-plum">{cast.name}</span>
                          <span className="text-xs text-brand-plum/50">（{cast.ruby}）</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-lg border transition-colors ${editIsAlert ? 'border-brand-coral/40 bg-brand-coral/10' : 'border-brand-beige bg-white'}`}>
                    <div className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => setEditIsAlert((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${editIsAlert ? 'bg-brand-coral' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${editIsAlert ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <Label className="text-brand-plum cursor-pointer" onClick={() => setEditIsAlert((v) => !v)}>
                        要注意フラグ
                        {editIsAlert && <span className="ml-2 text-brand-coral text-xs font-normal">（要注意バッジが表示されます）</span>}
                      </Label>
                    </div>
                    {editIsAlert && (
                      <div className="px-3 pb-3">
                        <textarea
                          value={editAlertReason}
                          onChange={(e) => setEditAlertReason(e.target.value)}
                          placeholder="要注意の理由を入力（例：無断キャンセル、支払いトラブルなど）"
                          rows={3}
                          className="w-full text-sm rounded-md border border-brand-coral/40 bg-white px-3 py-2 text-brand-plum placeholder:text-brand-plum/50 outline-none focus:ring-1 focus:ring-brand-coral/40 resize-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>メモ</Label>
                    <Textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={3} />
                  </div>

                </form>
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-brand-beige px-4 py-3 max-w-2xl mx-auto">
                  <Button type="submit" form="visit-edit-form" disabled={loading} className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11">
                    {loading ? '更新中...' : '更新する'}
                  </Button>
                </div>
                </>
              )}

              {/* Delete */}
              {mode === 'delete' && (
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">{error}</div>
                  )}
                  <p className="text-sm text-brand-plum">
                    <span className="font-semibold">{formatDate(visit.visitDate)}</span> の来店記録を削除しますか？この操作は元に戻せません。
                  </p>
                  <div className="space-y-1.5">
                    <Label>パスワード</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="削除パスワード"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setMode('view'); setError('') }} className="flex-1">
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={loading || !password}
                      className="flex-1 bg-brand-coral hover:bg-brand-coral text-white"
                    >
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
