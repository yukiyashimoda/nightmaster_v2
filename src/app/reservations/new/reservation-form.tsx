import { useState, useEffect } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, X, Check } from 'lucide-react'
import type { Customer, Cast } from '@/types'

interface ReservationFormProps {
  customers: Customer[]
  casts: Cast[]
  bottlesByCustomer: Map<string, number>
}

// 複数選択キャストピッカー
function CastMultiPicker({
  casts,
  selectedIds,
  onChange,
  label,
  required,
}: {
  casts: Cast[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label: string
  required?: boolean
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
    <div className="rounded-lg border border-brand-beige bg-white overflow-hidden">
      <p className="text-xs text-brand-plum/60 px-3 pt-2 pb-1 font-medium">
        {label}{required && <span className="text-brand-coral ml-0.5">*</span>}
      </p>
      {/* 選択済みチップ */}
      {selectedCasts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {selectedCasts.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 text-xs bg-brand-plum/10 text-brand-plum px-2 py-0.5 rounded-full font-medium"
            >
              {c.name}
              <button type="button" onClick={() => toggle(c.id)} className="hover:text-brand-coral">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* 検索 */}
      <div className="relative border-t border-brand-beige">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-plum/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・ふりがなで検索"
          className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-brand-plum placeholder:text-brand-plum/50"
        />
      </div>
      {/* 一覧 */}
      <div className="max-h-40 overflow-y-auto border-t border-brand-beige">
        {filtered.map((c) => {
          const isSelected = selectedIds.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-beige/50 transition-colors ${isSelected ? 'bg-brand-plum/5' : ''}`}
            >
              <span className={`w-4 h-4 flex items-center justify-center rounded border shrink-0 ${isSelected ? 'bg-brand-plum border-brand-plum' : 'border-brand-beige'}`}>
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="text-sm text-brand-plum">{c.name}</span>
              <span className="text-xs text-brand-plum/50">({c.ruby})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReservationForm({ customers, casts, bottlesByCustomer }: ReservationFormProps) {
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)
  const [savedDate, setSavedDate] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('20:00')
  const [partySize, setPartySize] = useState(2)
  const [hasDesignation, setHasDesignation] = useState(false)
  const [designatedCastIds, setDesignatedCastIds] = useState<string[]>([])
  const [isAccompanied, setIsAccompanied] = useState(false)
  const [accompaniedCastIds, setAccompaniedCastIds] = useState<string[]>([])
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('new')
  const [guestName, setGuestName] = useState('')
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [customerQuery, setCustomerQuery] = useState('')
  const [priceType, setPriceType] = useState<'normal' | 'party'>('normal')
  const [partyPlanPrice, setPartyPlanPrice] = useState<string>('')
  const [partyPlanMinutes, setPartyPlanMinutes] = useState<string>('90')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.success) {
      if (customerType === 'new') {
        setSavedDate(date)
        setShowRegisterPrompt(true)
      } else {
        navigate('/reservations')
      }
      setLoading(false)
    } else if (fetcher.state === 'idle' && fetcher.data?.error) {
      setError(fetcher.data.error)
      setLoading(false)
    }
  }, [fetcher.state, fetcher.data])

  const filteredCustomers = customerQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.includes(customerQuery) ||
          c.ruby.includes(customerQuery) ||
          c.nickname.includes(customerQuery)
      )
    : customers

  const selectedCustomers = customers.filter((c) => selectedCustomerIds.includes(c.id))

  function toggleCustomer(id: string) {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const Toggle = ({
    value, onChange, label, activeLabel, activeColor = 'bg-brand-plum',
  }: {
    value: boolean; onChange: (v: boolean) => void; label: string; activeLabel?: string; activeColor?: string
  }) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? activeColor : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-brand-plum">
        {value && activeLabel ? activeLabel : label}
      </span>
    </div>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hasDesignation && designatedCastIds.length === 0) {
      setError('指名キャストを1名以上選択してください')
      return
    }
    if (isAccompanied && accompaniedCastIds.length === 0) {
      setError('同伴キャストを1名以上選択してください')
      return
    }
    setLoading(true)
    setError('')
    fetcher.submit(
      {
        date,
        time,
        partySize,
        hasDesignation,
        designatedCastIds: hasDesignation ? designatedCastIds : [],
        isAccompanied,
        accompaniedCastIds: isAccompanied ? accompaniedCastIds : [],
        customerType,
        customerIds: customerType === 'existing' ? selectedCustomerIds : [],
        guestName: customerType === 'new' ? guestName : '',
        phone,
        isVisited: false,
        priceType,
        partyPlanPrice: priceType === 'party' && partyPlanPrice ? Number(partyPlanPrice) : null,
        partyPlanMinutes: priceType === 'party' && partyPlanMinutes ? Number(partyPlanMinutes) : null,
        memo,
      },
      { method: 'post', encType: 'application/json' }
    )
  }

  return (
    <>
    {showRegisterPrompt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl space-y-4">
          <h2 className="text-base font-bold text-brand-plum">顧客リストに登録しますか？</h2>
          <p className="text-sm text-brand-plum/70">
            {guestName ? `「${guestName}」を` : '初来店のお客様を'}顧客リストに追加できます。予約名などのデータを引き継いで登録画面に進みます。
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate('/reservations')}
              className="flex-1 py-2.5 rounded-lg border border-brand-beige text-sm font-medium text-brand-plum/70 hover:bg-brand-beige/50 transition-colors"
            >
              スキップ
            </button>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (guestName) params.set('name', guestName)
                if (savedDate) params.set('date', savedDate)
                navigate(`/customers/new?${params.toString()}`)
              }}
              className="flex-1 py-2.5 rounded-lg bg-brand-plum text-white text-sm font-bold hover:bg-brand-plum/90 transition-colors"
            >
              顧客登録へ
            </button>
          </div>
        </div>
      </div>
    )}
    <form onSubmit={handleSubmit} className="space-y-5 pb-24">
      {error && (
        <div className="p-3 rounded-lg bg-brand-coral/10 border border-brand-coral/40 text-brand-coral text-sm">
          {error}
        </div>
      )}

      {/* 日付 */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">日付<span className="text-brand-coral ml-0.5">*</span></Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      {/* 連絡先（電話番号） */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">連絡先（電話番号）</Label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="例：090-1234-5678"
        />
      </div>

      {/* 時間 */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">時間<span className="text-brand-coral ml-0.5">*</span></Label>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
      </div>

      {/* 人数 */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">人数<span className="text-brand-coral ml-0.5">*</span></Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPartySize((n) => Math.max(1, n - 1))}
            className="w-9 h-9 rounded-lg border border-brand-beige bg-white text-brand-plum text-lg font-bold hover:bg-brand-beige/50 transition-colors"
          >−</button>
          <span className="text-xl font-bold text-brand-plum w-12 text-center tabular-nums">{partySize}</span>
          <button
            type="button"
            onClick={() => setPartySize((n) => n + 1)}
            className="w-9 h-9 rounded-lg border border-brand-beige bg-white text-brand-plum text-lg font-bold hover:bg-brand-beige/50 transition-colors"
          >＋</button>
          <span className="text-sm text-brand-plum/60">名</span>
        </div>
      </div>

      {/* 指名 */}
      <div className="space-y-2">
        <div className="rounded-lg border border-brand-beige bg-white p-3">
          <Toggle
            value={hasDesignation}
            onChange={(v) => { setHasDesignation(v); if (!v) setDesignatedCastIds([]) }}
            label="指名なし"
            activeLabel="指名あり"
          />
        </div>
        {hasDesignation && (
          <CastMultiPicker
            casts={casts}
            selectedIds={designatedCastIds}
            onChange={setDesignatedCastIds}
            label="指名キャストを選択（複数可）"
            required
          />
        )}
      </div>

      {/* 同伴 */}
      <div className="space-y-2">
        <Label className="text-brand-plum">来店種別</Label>
        <select
          value={isAccompanied ? 'accompanied' : 'normal'}
          onChange={(e) => {
            const v = e.target.value === 'accompanied'
            setIsAccompanied(v)
            if (!v) setAccompaniedCastIds([])
          }}
          className="w-full rounded-lg border border-brand-beige bg-white px-3 py-2.5 text-sm text-brand-plum outline-none focus:ring-2 focus:ring-brand-plum/30"
        >
          <option value="normal">通常来店</option>
          <option value="accompanied">同伴</option>
        </select>
        {isAccompanied && (
          <CastMultiPicker
            casts={casts}
            selectedIds={accompaniedCastIds}
            onChange={setAccompaniedCastIds}
            label="同伴キャストを選択（複数可）"
            required
          />
        )}
      </div>

      {/* 顧客か初来店か */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">来店区分</Label>
        <div className="flex rounded-lg border border-brand-beige overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setCustomerType('new')}
            className={`flex-1 py-2.5 transition-colors ${customerType === 'new' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            初来店
          </button>
          <button
            type="button"
            onClick={() => setCustomerType('existing')}
            className={`flex-1 py-2.5 transition-colors ${customerType === 'existing' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            既存顧客
          </button>
        </div>

        {/* 初来店：予約名 */}
        {customerType === 'new' && (
          <div className="mt-2">
            <Input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="予約名（任意）"
            />
          </div>
        )}

        {/* 既存顧客選択（複数可） */}
        {customerType === 'existing' && (
          <div className="rounded-lg border border-brand-beige bg-white overflow-hidden mt-2">
            {/* 選択済みチップ */}
            {selectedCustomers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-brand-beige bg-brand-plum/5">
                {selectedCustomers.map((c) => (
                  <span key={c.id} className="flex items-center gap-1 text-xs bg-brand-plum/10 text-brand-plum px-2 py-0.5 rounded-full font-medium">
                    {c.name}
                    {(bottlesByCustomer.get(c.id) ?? 0) > 0 && (
                      <span className="text-brand-gold">🍾{bottlesByCustomer.get(c.id)}</span>
                    )}
                    <button type="button" onClick={() => toggleCustomer(c.id)} className="hover:text-brand-coral">
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
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="名前・ふりがな・ニックネームで検索"
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-0 outline-none text-brand-plum placeholder:text-brand-plum/50"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border-t border-brand-beige">
              {filteredCustomers.map((c) => {
                const bottleCount = bottlesByCustomer.get(c.id) ?? 0
                const isSelected = selectedCustomerIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCustomer(c.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-beige/50 transition-colors ${isSelected ? 'bg-brand-plum/5' : ''}`}
                  >
                    <span className={`w-4 h-4 flex items-center justify-center rounded border shrink-0 ${isSelected ? 'bg-brand-plum border-brand-plum' : 'border-brand-beige'}`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="text-sm text-brand-plum">{c.name}</span>
                    <span className="text-xs text-brand-plum/50">({c.ruby})</span>
                    {bottleCount > 0 && (
                      <span className="ml-auto text-[11px] text-brand-gold font-medium">🍾 {bottleCount}本</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 料金プラン */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">料金プラン</Label>
        <div className="flex rounded-lg border border-brand-beige overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setPriceType('normal')}
            className={`flex-1 py-2.5 transition-colors ${priceType === 'normal' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            通常料金
          </button>
          <button
            type="button"
            onClick={() => setPriceType('party')}
            className={`flex-1 py-2.5 transition-colors ${priceType === 'party' ? 'bg-brand-plum text-white' : 'text-brand-plum/60 hover:bg-brand-beige/50'}`}
          >
            パーティープラン
          </button>
        </div>

        {/* パーティープラン詳細 */}
        {priceType === 'party' && (
          <div className="rounded-lg border border-brand-beige bg-white p-3 space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-brand-plum text-sm">金額（円）</Label>
              <Input
                type="number"
                value={partyPlanPrice}
                onChange={(e) => setPartyPlanPrice(e.target.value)}
                placeholder="例：30000"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-plum text-sm">セット時間（分）</Label>
              <Input
                type="number"
                value={partyPlanMinutes}
                onChange={(e) => setPartyPlanMinutes(e.target.value)}
                placeholder="例：90"
                min={0}
              />
            </div>
          </div>
        )}
      </div>

      {/* 特記事項・メモ */}
      <div className="space-y-1.5">
        <Label className="text-brand-plum">特記事項・メモ</Label>
        <Textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="アレルギー、リクエスト、注意事項など"
          rows={3}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-brand-beige px-4 py-3 sm:left-60">
        <Button
          type="submit"
          disabled={loading}
          className="w-full max-w-2xl mx-auto block bg-brand-plum hover:bg-brand-plum/90 text-white font-bold h-11"
        >
          {loading ? '登録中...' : '予約を登録する'}
        </Button>
      </div>
    </form>
    </>
  )
}
