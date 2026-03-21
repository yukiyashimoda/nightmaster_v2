export interface Customer {
  id: string
  name: string
  ruby: string
  nickname: string
  designatedCastIds: string[]
  isAlert: boolean
  alertReason: string
  memo: string
  linkedCustomerIds: string[]
  isFavorite: boolean
  hasGlass: boolean
  glassMemo: string
  receiptNames: string[]
  phone: string
  email: string
  lastVisitDate: string | null
  updatedAt: string
  updatedBy: string
}

export interface Bottle {
  id: string
  customerId: string
  name: string
  remaining: string
  openedDate: string
}

export interface Cast {
  id: string
  name: string
  ruby: string
  memo: string
  updatedAt: string
  updatedBy: string
}

export interface Reservation {
  id: string
  date: string           // YYYY-MM-DD
  time: string           // HH:MM
  partySize: number      // 人数
  hasDesignation: boolean  // 指名の有無
  designatedCastIds: string[]      // 指名キャスト（複数可）
  isAccompanied: boolean   // 同伴か通常か
  accompaniedCastIds: string[]     // 同伴キャスト（複数可）
  customerType: 'existing' | 'new'  // 顧客か初来店か
  customerIds: string[]             // 既存顧客（複数可）
  guestName: string                 // 初来店の場合の予約名
  priceType: 'normal' | 'party'     // 通常料金かパーティープランか
  partyPlanPrice: number | null     // パーティープラン金額
  partyPlanMinutes: number | null   // パーティープランセット時間（分）
  phone: string
  memo: string
  isVisited: boolean
  updatedAt: string
  updatedBy: string
}

export interface VisitRecord {
  id: string
  customerId: string
  visitDate: string
  designatedCastIds: string[]
  inStoreCastIds: string[]
  bottlesOpened: string[]
  bottlesUsed: string[]
  memo: string
  isAlert?: boolean
  alertReason?: string
  bottleSnapshots?: Bottle[]
}
