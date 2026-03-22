import type { SupabaseClient } from '../../app/lib/db.server'
import type { Customer, Bottle, Cast, VisitRecord, Reservation } from '@/types'
import {
  mockCustomers,
  mockBottles,
  mockCasts,
  mockVisitRecords,
  mockReservations,
} from './mock-data'

const store = {
  customers: new Map<string, Customer>(mockCustomers.map((c) => [c.id, c])),
  bottles: new Map<string, Bottle>(mockBottles.map((b) => [b.id, b])),
  casts: new Map<string, Cast>(mockCasts.map((c) => [c.id, c])),
  visitRecords: new Map<string, VisitRecord>(
    mockVisitRecords.map((v) => [v.id, v])
  ),
  reservations: new Map<string, Reservation>(mockReservations.map((r) => [r.id, r])),
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Row mappers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCustomer(r: any): Customer {
  return {
    id: r.id,
    name: r.name,
    ruby: r.ruby,
    nickname: r.nickname,
    designatedCastIds: r.designated_cast_ids ?? [],
    isAlert: r.is_alert,
    alertReason: r.alert_reason,
    memo: r.memo,
    linkedCustomerIds: r.linked_customer_ids ?? [],
    isFavorite: r.is_favorite ?? false,
    hasGlass: r.has_glass ?? false,
    glassMemo: r.glass_memo ?? '',
    receiptNames: r.receipt_names ?? [],
    phone: r.phone ?? '',
    email: r.email ?? '',
    lastVisitDate: r.last_visit_date ?? null,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBottle(r: any): Bottle {
  return {
    id: r.id,
    customerId: r.customer_id,
    name: r.name,
    remaining: r.remaining,
    openedDate: r.opened_date,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCast(r: any): Cast {
  return {
    id: r.id,
    name: r.name,
    ruby: r.ruby,
    memo: r.memo,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVisitRecord(r: any): VisitRecord {
  return {
    id: r.id,
    customerId: r.customer_id,
    visitDate: r.visit_date,
    designatedCastIds: r.designated_cast_ids ?? [],
    inStoreCastIds: r.in_store_cast_ids ?? [],
    bottlesOpened: r.bottles_opened ?? [],
    bottlesUsed: r.bottles_used ?? [],
    memo: r.memo,
    isAlert: r.is_alert ?? false,
    alertReason: r.alert_reason ?? '',
    bottleSnapshots: r.bottle_snapshots ?? [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReservation(r: any): Reservation {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    hasDesignation: r.has_designation,
    designatedCastIds: Array.isArray(r.designated_cast_ids) ? r.designated_cast_ids : [],
    isAccompanied: r.is_accompanied,
    accompaniedCastIds: Array.isArray(r.accompanied_cast_ids) ? r.accompanied_cast_ids : [],
    customerType: r.customer_type,
    customerIds: Array.isArray(r.customer_ids) ? r.customer_ids : [],
    guestName: r.guest_name ?? '',
    priceType: r.price_type,
    partyPlanPrice: r.party_plan_price ?? null,
    partyPlanMinutes: r.party_plan_minutes ?? null,
    phone: r.phone ?? '',
    memo: r.memo ?? '',
    isVisited: r.is_visited ?? false,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }
}

// ─── Customer CRUD ────────────────────────────────────────────────────────────

export async function getCustomers(db: SupabaseClient | null): Promise<Customer[]> {
  if (!db) return Array.from(store.customers.values()).sort((a, b) => a.ruby.localeCompare(b.ruby, 'ja'))
  const { data, error } = await db.from('customers').select('*').order('ruby')
  if (error) throw error
  return (data ?? []).map(toCustomer)
}

export async function getCustomer(db: SupabaseClient | null, id: string): Promise<Customer | null> {
  if (!db) return store.customers.get(id) ?? null
  const { data, error } = await db.from('customers').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toCustomer(data) : null
}

export async function createCustomer(db: SupabaseClient | null, data: Omit<Customer, 'id' | 'updatedAt'>): Promise<Customer> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!db) {
    const customer: Customer = { ...data, id, updatedAt }
    store.customers.set(id, customer)
    return customer
  }
  const { data: row, error } = await db.from('customers').insert({
    id, name: data.name, ruby: data.ruby, nickname: data.nickname,
    designated_cast_ids: data.designatedCastIds, is_alert: data.isAlert,
    alert_reason: data.alertReason, memo: data.memo,
    linked_customer_ids: data.linkedCustomerIds, is_favorite: data.isFavorite ?? false,
    has_glass: data.hasGlass ?? false, glass_memo: data.glassMemo ?? '',
    receipt_names: data.receiptNames ?? [], phone: data.phone ?? '',
    email: data.email ?? '', last_visit_date: data.lastVisitDate,
    updated_at: updatedAt, updated_by: data.updatedBy,
  }).select().single()
  if (error) throw error
  return toCustomer(row)
}

export async function updateCustomer(db: SupabaseClient | null, id: string, data: Partial<Omit<Customer, 'id'>>): Promise<Customer | null> {
  if (!db) {
    const existing = store.customers.get(id)
    if (!existing) return null
    const updated: Customer = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.customers.set(id, updated)
    return updated
  }
  const existing = await getCustomer(db, id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const { data: row, error } = await db.from('customers').update({
    name: m.name, ruby: m.ruby, nickname: m.nickname,
    designated_cast_ids: m.designatedCastIds, is_alert: m.isAlert,
    alert_reason: m.alertReason, memo: m.memo,
    linked_customer_ids: m.linkedCustomerIds, is_favorite: m.isFavorite ?? false,
    has_glass: m.hasGlass ?? false, glass_memo: m.glassMemo ?? '',
    receipt_names: m.receiptNames ?? [], phone: m.phone ?? '',
    email: m.email ?? '', last_visit_date: m.lastVisitDate,
    updated_at: m.updatedAt, updated_by: m.updatedBy,
  }).eq('id', id).select().single()
  if (error) throw error
  return toCustomer(row)
}

export async function deleteCustomer(db: SupabaseClient | null, id: string): Promise<boolean> {
  if (!db) return store.customers.delete(id)
  const { error } = await db.from('customers').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── Bottle CRUD ──────────────────────────────────────────────────────────────

export async function getBottles(db: SupabaseClient | null): Promise<Bottle[]> {
  if (!db) return Array.from(store.bottles.values())
  const { data, error } = await db.from('bottles').select('*')
  if (error) throw error
  return (data ?? []).map(toBottle)
}

export async function getBottlesByCustomer(db: SupabaseClient | null, customerId: string): Promise<Bottle[]> {
  if (!db) return Array.from(store.bottles.values()).filter((b) => b.customerId === customerId)
  const { data, error } = await db.from('bottles').select('*').eq('customer_id', customerId)
  if (error) throw error
  return (data ?? []).map(toBottle)
}

export async function getBottle(db: SupabaseClient | null, id: string): Promise<Bottle | null> {
  if (!db) return store.bottles.get(id) ?? null
  const { data, error } = await db.from('bottles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toBottle(data) : null
}

export async function createBottle(db: SupabaseClient | null, data: Omit<Bottle, 'id'>): Promise<Bottle> {
  const id = generateId()
  if (!db) {
    const bottle: Bottle = { ...data, id }
    store.bottles.set(id, bottle)
    return bottle
  }
  const { data: row, error } = await db.from('bottles').insert({
    id, customer_id: data.customerId, name: data.name,
    remaining: data.remaining, opened_date: data.openedDate,
  }).select().single()
  if (error) throw error
  return toBottle(row)
}

export async function updateBottle(db: SupabaseClient | null, id: string, data: Partial<Omit<Bottle, 'id'>>): Promise<Bottle | null> {
  if (!db) {
    const existing = store.bottles.get(id)
    if (!existing) return null
    const updated: Bottle = { ...existing, ...data, id }
    store.bottles.set(id, updated)
    return updated
  }
  const existing = await getBottle(db, id)
  if (!existing) return null
  const m = { ...existing, ...data }
  const { data: row, error } = await db.from('bottles').update({
    name: m.name, remaining: m.remaining, opened_date: m.openedDate,
  }).eq('id', id).select().single()
  if (error) throw error
  return toBottle(row)
}

export async function deleteBottle(db: SupabaseClient | null, id: string): Promise<boolean> {
  if (!db) return store.bottles.delete(id)
  const { error } = await db.from('bottles').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── Cast CRUD ────────────────────────────────────────────────────────────────

export async function getCasts(db: SupabaseClient | null): Promise<Cast[]> {
  if (!db) return Array.from(store.casts.values()).sort((a, b) => a.ruby.localeCompare(b.ruby, 'ja'))
  const { data, error } = await db.from('casts').select('*').order('ruby')
  if (error) throw error
  return (data ?? []).map(toCast)
}

export async function getCast(db: SupabaseClient | null, id: string): Promise<Cast | null> {
  if (!db) return store.casts.get(id) ?? null
  const { data, error } = await db.from('casts').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toCast(data) : null
}

export async function createCast(db: SupabaseClient | null, data: Omit<Cast, 'id' | 'updatedAt'>): Promise<Cast> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!db) {
    const cast: Cast = { ...data, id, updatedAt }
    store.casts.set(id, cast)
    return cast
  }
  const { data: row, error } = await db.from('casts').insert({
    id, name: data.name, ruby: data.ruby, memo: data.memo,
    updated_at: updatedAt, updated_by: data.updatedBy,
  }).select().single()
  if (error) throw error
  return toCast(row)
}

export async function updateCast(db: SupabaseClient | null, id: string, data: Partial<Omit<Cast, 'id' | 'updatedAt'>>): Promise<Cast | null> {
  if (!db) {
    const existing = store.casts.get(id)
    if (!existing) return null
    const updated: Cast = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.casts.set(id, updated)
    return updated
  }
  const existing = await getCast(db, id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const { data: row, error } = await db.from('casts').update({
    name: m.name, ruby: m.ruby, memo: m.memo,
    updated_at: m.updatedAt, updated_by: m.updatedBy,
  }).eq('id', id).select().single()
  if (error) throw error
  return toCast(row)
}

export async function deleteCast(db: SupabaseClient | null, id: string): Promise<boolean> {
  if (!db) return store.casts.delete(id)
  const { error } = await db.from('casts').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── VisitRecord CRUD ─────────────────────────────────────────────────────────

export async function getVisitRecords(db: SupabaseClient | null): Promise<VisitRecord[]> {
  if (!db) return Array.from(store.visitRecords.values()).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  const { data, error } = await db.from('visit_records').select('*').order('visit_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toVisitRecord)
}

export async function getVisitRecordsByCustomer(db: SupabaseClient | null, customerId: string): Promise<VisitRecord[]> {
  if (!db) return Array.from(store.visitRecords.values()).filter((v) => v.customerId === customerId).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  const { data, error } = await db.from('visit_records').select('*').eq('customer_id', customerId).order('visit_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toVisitRecord)
}

export async function getVisitRecordsByCast(db: SupabaseClient | null, castId: string): Promise<VisitRecord[]> {
  if (!db) return Array.from(store.visitRecords.values()).filter((v) => v.designatedCastIds.includes(castId)).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  const { data, error } = await db.from('visit_records').select('*').contains('designated_cast_ids', [castId]).order('visit_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toVisitRecord)
}

export async function getVisitRecordsByInStoreCast(db: SupabaseClient | null, castId: string): Promise<VisitRecord[]> {
  if (!db) return Array.from(store.visitRecords.values()).filter((v) => v.inStoreCastIds.includes(castId)).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  const { data, error } = await db.from('visit_records').select('*').contains('in_store_cast_ids', [castId]).order('visit_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toVisitRecord)
}

export async function createVisitRecord(db: SupabaseClient | null, data: Omit<VisitRecord, 'id'>): Promise<VisitRecord> {
  const id = generateId()
  if (!db) {
    const record: VisitRecord = { ...data, id }
    store.visitRecords.set(id, record)
    const customer = store.customers.get(data.customerId)
    if (customer) store.customers.set(data.customerId, { ...customer, lastVisitDate: data.visitDate, updatedAt: new Date().toISOString() })
    return record
  }
  const { data: row, error } = await db.from('visit_records').insert({
    id, customer_id: data.customerId, visit_date: data.visitDate,
    designated_cast_ids: data.designatedCastIds, in_store_cast_ids: data.inStoreCastIds,
    bottles_opened: data.bottlesOpened, bottles_used: data.bottlesUsed,
    memo: data.memo, is_alert: data.isAlert ?? false, alert_reason: data.alertReason ?? '',
    bottle_snapshots: data.bottleSnapshots ?? [],
  }).select().single()
  if (error) throw error
  await db.from('customers').update({ last_visit_date: data.visitDate, updated_at: new Date().toISOString() }).eq('id', data.customerId)
  return toVisitRecord(row)
}

export async function getVisitRecord(db: SupabaseClient | null, id: string): Promise<VisitRecord | null> {
  if (!db) return store.visitRecords.get(id) ?? null
  const { data, error } = await db.from('visit_records').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toVisitRecord(data) : null
}

export async function updateVisitRecord(db: SupabaseClient | null, id: string, data: Partial<Omit<VisitRecord, 'id'>>): Promise<VisitRecord | null> {
  if (!db) {
    const existing = store.visitRecords.get(id)
    if (!existing) return null
    const updated: VisitRecord = { ...existing, ...data, id }
    store.visitRecords.set(id, updated)
    return updated
  }
  const existing = await getVisitRecord(db, id)
  if (!existing) return null
  const m = { ...existing, ...data }
  const { data: row, error } = await db.from('visit_records').update({
    visit_date: m.visitDate, designated_cast_ids: m.designatedCastIds,
    in_store_cast_ids: m.inStoreCastIds, memo: m.memo,
    is_alert: m.isAlert ?? false, alert_reason: m.alertReason ?? '',
  }).eq('id', id).select().single()
  if (error) throw error
  return toVisitRecord(row)
}

export async function deleteVisitRecord(db: SupabaseClient | null, id: string): Promise<boolean> {
  if (!db) return store.visitRecords.delete(id)
  const { error } = await db.from('visit_records').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── Reservation CRUD ─────────────────────────────────────────────────────────

export async function getReservations(db: SupabaseClient | null): Promise<Reservation[]> {
  if (!db) return Array.from(store.reservations.values()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const { data, error } = await db.from('reservations').select('*').order('date').order('time')
  if (error) throw error
  return (data ?? []).map(toReservation)
}

export async function getReservation(db: SupabaseClient | null, id: string): Promise<Reservation | null> {
  if (!db) return store.reservations.get(id) ?? null
  const { data, error } = await db.from('reservations').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toReservation(data) : null
}

export async function createReservation(db: SupabaseClient | null, data: Omit<Reservation, 'id' | 'updatedAt'>): Promise<Reservation> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!db) {
    const reservation: Reservation = { ...data, id, updatedAt }
    store.reservations.set(id, reservation)
    return reservation
  }
  const { data: row, error } = await db.from('reservations').insert({
    id, date: data.date, time: data.time, party_size: data.partySize,
    has_designation: data.hasDesignation, designated_cast_ids: data.designatedCastIds,
    is_accompanied: data.isAccompanied, accompanied_cast_ids: data.accompaniedCastIds,
    customer_type: data.customerType, customer_ids: data.customerIds,
    guest_name: data.guestName, phone: data.phone, price_type: data.priceType,
    party_plan_price: data.partyPlanPrice, party_plan_minutes: data.partyPlanMinutes,
    memo: data.memo, is_visited: data.isVisited, updated_at: updatedAt, updated_by: data.updatedBy,
  }).select().single()
  if (error) throw error
  return toReservation(row)
}

export async function updateReservation(db: SupabaseClient | null, id: string, data: Partial<Omit<Reservation, 'id'>>): Promise<Reservation | null> {
  if (!db) {
    const existing = store.reservations.get(id)
    if (!existing) return null
    const updated: Reservation = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.reservations.set(id, updated)
    return updated
  }
  const existing = await getReservation(db, id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const { data: row, error } = await db.from('reservations').update({
    date: m.date, time: m.time, party_size: m.partySize,
    has_designation: m.hasDesignation, designated_cast_ids: m.designatedCastIds,
    is_accompanied: m.isAccompanied, accompanied_cast_ids: m.accompaniedCastIds,
    customer_type: m.customerType, customer_ids: m.customerIds,
    guest_name: m.guestName, phone: m.phone, is_visited: m.isVisited,
    price_type: m.priceType, party_plan_price: m.partyPlanPrice,
    party_plan_minutes: m.partyPlanMinutes, memo: m.memo,
    updated_at: m.updatedAt, updated_by: m.updatedBy,
  }).eq('id', id).select().single()
  if (error) throw error
  return toReservation(row)
}

export async function getReservationsByCustomer(db: SupabaseClient | null, customerId: string): Promise<Reservation[]> {
  if (!db) return Array.from(store.reservations.values()).filter((r) => r.customerIds.includes(customerId)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const { data, error } = await db.from('reservations').select('*').contains('customer_ids', [customerId]).order('date').order('time')
  if (error) throw error
  return (data ?? []).map(toReservation)
}

export async function getReservationsByCast(db: SupabaseClient | null, castId: string): Promise<Reservation[]> {
  if (!db) return Array.from(store.reservations.values()).filter((r) => r.designatedCastIds.includes(castId) || r.accompaniedCastIds.includes(castId)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const { data: d1, error: e1 } = await db.from('reservations').select('*').contains('designated_cast_ids', [castId]).order('date').order('time')
  if (e1) throw e1
  const { data: d2, error: e2 } = await db.from('reservations').select('*').contains('accompanied_cast_ids', [castId]).order('date').order('time')
  if (e2) throw e2
  const ids = new Set((d1 ?? []).map((r: any) => r.id))
  const combined = [...(d1 ?? []), ...(d2 ?? []).filter((r: any) => !ids.has(r.id))]
  return combined.map(toReservation).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

export async function deleteReservation(db: SupabaseClient | null, id: string): Promise<boolean> {
  if (!db) return store.reservations.delete(id)
  const { error } = await db.from('reservations').delete().eq('id', id)
  if (error) throw error
  return true
}
