import { useState, useEffect } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, X, Plus } from 'lucide-react'
import { GiBrandyBottle } from 'react-icons/gi'
import type { Cast, Customer } from '@/types'

interface NewCustomerFormProps {
  casts: Cast[]
  customers: Customer[]
  initialName?: string
  initialFirstVisitDate?: string
}

interface BottleInput {
  name: string
  remaining: number // 0〜100（5刻み）
  openedDate: string
}

const today = new Date().toISOString().split('T')[0]

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
      <Label className="text-brand-plum">{label}</Label>
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

export function NewCustomerForm({ casts, customers, initialName = '', initialFirstVisitDate = '' }: NewCustomerFormProps) {
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(initialName)
  const [isAlert, setIsAlert] = useState(false)
  const [alertReason, setAlertReason] = useState('')
  const [hasGlass, setHasGlass] = useState(false)
  const [glassMemo, setGlassMemo] = useState('')
  const [receiptNames, setReceiptNames] = useState<string[]>([])
  const [designatedCastIds, setDesignatedCastIds] = useState<string[]>([])
  const [inStoreCastIds, setInStoreCastIds] = useState<string[]>([])
  const [linkedIds, setLinkedIds] = useState<string[]>([])
  const [linkedQuery, setLinkedQuery] = useState('')
  const [bottles, setBottles] = useState<BottleInput[]>([])
  const [firstVisitDate, setFirstVisitDate] = useState(initialFirstVisitDate)

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success && fetcher.data?.id) {
      navigate(`/customers/${fetcher.data.id}`)
    } else if (fetcher.state === 'idle' && fetcher.data?.error) {
      setError(fetcher.data.error)
      setLoading(false)
    }
  }, [fetcher.state, fetcher.data])

  const filteredCustomers = linkedQuery.trim()
    ? customers.filter((c) => c.name.includes(linkedQuery) || c.ruby.includes(linkedQuery) || c.nickname.includes(linkedQuery))
    : customers

  const toggleLinked = (id: string) => {
    setLinkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const addBottle = () => {
    setBottles((prev) => [...prev, { name: '', remaining: 100, openedDate: today }])
  }

  const removeBottle = (idx: number) => {
    setBottles((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateBottle = (idx: number, field: keyof BottleInput, value: string | number) => {
    setBottles((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b))
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    fetcher.submit(
      {
        data: {
          name,
          ruby: formData.get('ruby') as string,
          nickname: formData.get('nickname') as string,
          phone: formData.get('phone') as string,
          email: formData.get('email') as string,
          designatedCastIds,
          isAlert,
          alertReason: isAlert ? alertReason : '',
          memo: formData.get('memo') as string,
          linkedCustomerIds: linkedIds,
          isFavorite: false,
          hasGlass,
          glassMemo: hasGlass ? glassMemo : '',
          receiptNames: receiptNames.filter((n) => n.trim()),
          lastVisitDate: firstVisitDate ? new Date(firstVisitDate).toISOString() : null,
        },
        bottles: bottles.filter((b) => b.name.trim()).map((b) => ({
          name: b.name,
          remaining: `${b.remaining}%`,
          openedDate: new Date(b.openedDate).toISOString(),
        })),
        inStoreCastIds,
      },
      { method: 'post', encType: 'application/json' }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-24">
      {error && (
        <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-brand-plum">氏名（漢字）<span className="text-brand-coral ml-0.5">*</span></Label>
        <Input name="name" required placeholder="田中 一郎" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">ふりがな<span className="text-brand-coral ml-0.5">*</span></Label>
        <Input name="ruby" required placeholder="たなか いちろう" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">ニックネーム</Label>
        <Input name="nickname" placeholder="たなちゃん" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">電話番号</Label>
        <Input name="phone" type="tel" placeholder="090-0000-0000" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">メールアドレス</Label>
        <Input name="email" type="email" placeholder="example@email.com" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">最初の来店日</Label>
        <Input
          type="date"
          value={firstVisitDate}
          onChange={(e) => setFirstVisitDate(e.target.value)}
        />
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

      {/* 領収書名 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-brand-plum">領収書名</Label>
          <button
            type="button"
            onClick={() => setReceiptNames((prev) => [...prev, ''])}
            className="flex items-center gap-1 text-sm text-brand-plum hover:text-brand-plum font-medium"
          >
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>
        {receiptNames.length === 0 && (
          <p className="text-xs text-brand-plum/50">「追加」を押して領収書名を入力してください</p>
        )}
        <div className="space-y-2">
          {receiptNames.map((name, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setReceiptNames((prev) => prev.map((n, i) => i === idx ? e.target.value : n))}
                placeholder="例：株式会社〇〇"
              />
              <button
                type="button"
                onClick={() => setReceiptNames((prev) => prev.filter((_, i) => i !== idx))}
                className="text-brand-plum/50 hover:text-brand-coral shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-brand-plum">特記事項・メモ</Label>
        <Textarea name="memo" placeholder="アレルギー、好みのお酒、誕生日など" rows={3} />
      </div>

      {/* Alert toggle */}
      <div className={`rounded-lg border transition-colors ${isAlert ? 'border-brand-coral/40 bg-brand-coral/10' : 'border-brand-beige bg-white'}`}>
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={() => setIsAlert(!isAlert)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isAlert ? 'bg-brand-coral' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAlert ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <Label className="text-brand-plum cursor-pointer" onClick={() => setIsAlert(!isAlert)}>
            要注意フラグ
            {isAlert && <span className="ml-2 text-brand-coral text-xs font-normal">（要確認バッジが表示されます）</span>}
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

      {/* グラス預かり */}
      <div className={`rounded-lg border transition-colors ${hasGlass ? 'border-brand-gold/60 bg-brand-gold/10' : 'border-brand-beige bg-white'}`}>
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            onClick={() => setHasGlass(!hasGlass)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${hasGlass ? 'bg-brand-gold' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${hasGlass ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <Label className="text-brand-plum cursor-pointer" onClick={() => setHasGlass(!hasGlass)}>
            グラス預かり
            {hasGlass && <span className="ml-2 text-brand-gold text-xs font-normal">（グラスタグが表示されます）</span>}
          </Label>
        </div>
        {hasGlass && (
          <div className="px-3 pb-3">
            <textarea
              value={glassMemo}
              onChange={(e) => setGlassMemo(e.target.value)}
              placeholder="グラスの詳細を入力（例：マイグラス・棚番号3など）"
              rows={2}
              className="w-full text-sm rounded-md border border-brand-gold/40 bg-white px-3 py-2 text-brand-plum placeholder:text-brand-plum/50 outline-none focus:ring-1 focus:ring-brand-gold/40 resize-none"
            />
          </div>
        )}
      </div>

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
          <p className="text-xs text-brand-plum/50 py-1">ボトルを追加する場合は「追加」を押してください</p>
        )}

        <div className="space-y-3">
          {bottles.map((bottle, idx) => (
            <div key={idx} className="rounded-lg border border-brand-beige bg-white p-3 space-y-3">
              <div className="flex items-center gap-2">
                <GiBrandyBottle size={16} className="text-brand-plum/60 shrink-0" />
                <Input
                  value={bottle.name}
                  onChange={(e) => updateBottle(idx, 'name', e.target.value)}
                  placeholder="ボトル名（例：山崎12年）"
                  className="flex-1 h-8 text-sm"
                />
                <button type="button" onClick={() => removeBottle(idx)} className="text-brand-plum/50 hover:text-brand-coral shrink-0">
                  <X className="h-4 w-4" />
                </button>
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
                    onChange={(e) => updateBottle(idx, 'remaining', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-plum bg-white"
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

              {/* 開封日 */}
              <div className="space-y-1">
                <span className="text-xs text-brand-plum/60">開封日</span>
                <Input
                  type="date"
                  value={bottle.openedDate}
                  onChange={(e) => updateBottle(idx, 'openedDate', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 同伴者・グループ客 */}
      {customers.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-brand-plum">
            同伴者・グループ客
            {linkedIds.length > 0 && (
              <span className="ml-2 text-xs text-brand-plum/60">{linkedIds.length}名選択中</span>
            )}
          </Label>
          <div className="rounded-lg border border-brand-beige bg-white overflow-hidden">
            {linkedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige">
                {linkedIds.map((id) => {
                  const c = customers.find((x) => x.id === id)
                  if (!c) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-xs text-brand-plum">
                      {c.name}
                      <button type="button" onClick={() => toggleLinked(id)} className="text-brand-plum/60 hover:text-brand-plum">
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
              {filteredCustomers.length === 0 ? (
                <p className="px-3 py-2 text-xs text-brand-plum/50">該当する顧客がいません</p>
              ) : (
                filteredCustomers.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                      ${linkedIds.includes(c.id) ? 'bg-white' : 'hover:bg-white'}`}
                  >
                    <input type="checkbox" checked={linkedIds.includes(c.id)} onChange={() => toggleLinked(c.id)} className="accent-brand-plum" />
                    <span className="text-sm text-brand-plum">{c.name}</span>
                    <span className="text-xs text-brand-plum/50">({c.ruby})</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-brand-beige px-4 py-3 max-w-2xl mx-auto">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11"
        >
          {loading ? '登録中...' : '顧客を登録する'}
        </Button>
      </div>
    </form>
  )
}
