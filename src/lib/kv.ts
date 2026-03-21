import { neon } from '@neondatabase/serverless'
import type { Customer, Bottle, Cast, VisitRecord, Reservation } from '@/types'
import {
  mockCustomers,
  mockBottles,
  mockCasts,
  mockVisitRecords,
  mockReservations,
} from './mock-data'

// In-memory fallback for local dev without DATABASE_URL
const useDB = !!process.env.DATABASE_URL

function getSQL() {
  return neon(process.env.DATABASE_URL!)
}

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

// ─── Customer CRUD ────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  if (!useDB) {
    return Array.from(store.customers.values()).sort((a, b) =>
      a.ruby.localeCompare(b.ruby, 'ja')
    )
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM customers ORDER BY ruby`
  return rows.map(toCustomer)
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (!useDB) return store.customers.get(id) ?? null
  const sql = getSQL()
  const rows = await sql`SELECT * FROM customers WHERE id = ${id}`
  return rows[0] ? toCustomer(rows[0]) : null
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'updatedAt'>
): Promise<Customer> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!useDB) {
    const customer: Customer = { ...data, id, updatedAt }
    store.customers.set(id, customer)
    return customer
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO customers (id, name, ruby, nickname, designated_cast_ids, is_alert, alert_reason, memo, linked_customer_ids, is_favorite, has_glass, glass_memo, receipt_names, phone, email, last_visit_date, updated_at, updated_by)
    VALUES (${id}, ${data.name}, ${data.ruby}, ${data.nickname}, ${data.designatedCastIds}, ${data.isAlert}, ${data.alertReason}, ${data.memo}, ${data.linkedCustomerIds}, ${data.isFavorite ?? false}, ${data.hasGlass ?? false}, ${data.glassMemo ?? ''}, ${data.receiptNames ?? []}, ${data.phone ?? ''}, ${data.email ?? ''}, ${data.lastVisitDate}, ${updatedAt}, ${data.updatedBy})
    RETURNING *
  `
  return toCustomer(rows[0])
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id'>>
): Promise<Customer | null> {
  if (!useDB) {
    const existing = store.customers.get(id)
    if (!existing) return null
    const updated: Customer = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.customers.set(id, updated)
    return updated
  }
  const existing = await getCustomer(id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const sql = getSQL()
  const rows = await sql`
    UPDATE customers SET
      name = ${m.name}, ruby = ${m.ruby}, nickname = ${m.nickname},
      designated_cast_ids = ${m.designatedCastIds}, is_alert = ${m.isAlert},
      alert_reason = ${m.alertReason}, memo = ${m.memo},
      linked_customer_ids = ${m.linkedCustomerIds}, is_favorite = ${m.isFavorite ?? false},
      has_glass = ${m.hasGlass ?? false}, glass_memo = ${m.glassMemo ?? ''}, receipt_names = ${m.receiptNames ?? []}, phone = ${m.phone ?? ''}, email = ${m.email ?? ''}, last_visit_date = ${m.lastVisitDate},
      updated_at = ${m.updatedAt}, updated_by = ${m.updatedBy}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toCustomer(rows[0]) : null
}

export async function deleteCustomer(id: string): Promise<boolean> {
  if (!useDB) return store.customers.delete(id)
  const sql = getSQL()
  await sql`DELETE FROM customers WHERE id = ${id}`
  return true
}

// ─── Bottle CRUD ──────────────────────────────────────────────────────────────

export async function getBottles(): Promise<Bottle[]> {
  if (!useDB) return Array.from(store.bottles.values())
  const sql = getSQL()
  const rows = await sql`SELECT * FROM bottles`
  return rows.map(toBottle)
}

export async function getBottlesByCustomer(customerId: string): Promise<Bottle[]> {
  if (!useDB) return Array.from(store.bottles.values()).filter((b) => b.customerId === customerId)
  const sql = getSQL()
  const rows = await sql`SELECT * FROM bottles WHERE customer_id = ${customerId}`
  return rows.map(toBottle)
}

export async function getBottle(id: string): Promise<Bottle | null> {
  if (!useDB) return store.bottles.get(id) ?? null
  const sql = getSQL()
  const rows = await sql`SELECT * FROM bottles WHERE id = ${id}`
  return rows[0] ? toBottle(rows[0]) : null
}

export async function createBottle(data: Omit<Bottle, 'id'>): Promise<Bottle> {
  const id = generateId()
  if (!useDB) {
    const bottle: Bottle = { ...data, id }
    store.bottles.set(id, bottle)
    return bottle
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO bottles (id, customer_id, name, remaining, opened_date)
    VALUES (${id}, ${data.customerId}, ${data.name}, ${data.remaining}, ${data.openedDate})
    RETURNING *
  `
  return toBottle(rows[0])
}

export async function updateBottle(
  id: string,
  data: Partial<Omit<Bottle, 'id'>>
): Promise<Bottle | null> {
  if (!useDB) {
    const existing = store.bottles.get(id)
    if (!existing) return null
    const updated: Bottle = { ...existing, ...data, id }
    store.bottles.set(id, updated)
    return updated
  }
  const existing = await getBottle(id)
  if (!existing) return null
  const m = { ...existing, ...data }
  const sql = getSQL()
  const rows = await sql`
    UPDATE bottles SET name = ${m.name}, remaining = ${m.remaining}, opened_date = ${m.openedDate}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toBottle(rows[0]) : null
}

export async function deleteBottle(id: string): Promise<boolean> {
  if (!useDB) return store.bottles.delete(id)
  const sql = getSQL()
  await sql`DELETE FROM bottles WHERE id = ${id}`
  return true
}

// ─── Cast CRUD ────────────────────────────────────────────────────────────────

export async function getCasts(): Promise<Cast[]> {
  if (!useDB) {
    return Array.from(store.casts.values()).sort((a, b) =>
      a.ruby.localeCompare(b.ruby, 'ja')
    )
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM casts ORDER BY ruby`
  return rows.map(toCast)
}

export async function getCast(id: string): Promise<Cast | null> {
  if (!useDB) return store.casts.get(id) ?? null
  const sql = getSQL()
  const rows = await sql`SELECT * FROM casts WHERE id = ${id}`
  return rows[0] ? toCast(rows[0]) : null
}

export async function createCast(data: Omit<Cast, 'id' | 'updatedAt'>): Promise<Cast> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!useDB) {
    const cast: Cast = { ...data, id, updatedAt }
    store.casts.set(id, cast)
    return cast
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO casts (id, name, ruby, memo, updated_at, updated_by)
    VALUES (${id}, ${data.name}, ${data.ruby}, ${data.memo}, ${updatedAt}, ${data.updatedBy})
    RETURNING *
  `
  return toCast(rows[0])
}

export async function updateCast(
  id: string,
  data: Partial<Omit<Cast, 'id' | 'updatedAt'>>
): Promise<Cast | null> {
  if (!useDB) {
    const existing = store.casts.get(id)
    if (!existing) return null
    const updated: Cast = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.casts.set(id, updated)
    return updated
  }
  const existing = await getCast(id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const sql = getSQL()
  const rows = await sql`
    UPDATE casts SET name = ${m.name}, ruby = ${m.ruby}, memo = ${m.memo},
      updated_at = ${m.updatedAt}, updated_by = ${m.updatedBy}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toCast(rows[0]) : null
}

export async function deleteCast(id: string): Promise<boolean> {
  if (!useDB) return store.casts.delete(id)
  const sql = getSQL()
  await sql`DELETE FROM casts WHERE id = ${id}`
  return true
}

// ─── VisitRecord CRUD ─────────────────────────────────────────────────────────

export async function getVisitRecords(): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values()).sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    )
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records ORDER BY visit_date DESC`
  return rows.map(toVisitRecord)
}

export async function getVisitRecordsByCustomer(customerId: string): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values())
      .filter((v) => v.customerId === customerId)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records WHERE customer_id = ${customerId} ORDER BY visit_date DESC`
  return rows.map(toVisitRecord)
}

export async function getVisitRecordsByCast(castId: string): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values())
      .filter((v) => v.designatedCastIds.includes(castId))
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records WHERE ${castId} = ANY(designated_cast_ids) ORDER BY visit_date DESC`
  return rows.map(toVisitRecord)
}

export async function getVisitRecordsByInStoreCast(castId: string): Promise<VisitRecord[]> {
  if (!useDB) {
    return Array.from(store.visitRecords.values())
      .filter((v) => v.inStoreCastIds.includes(castId))
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records WHERE ${castId} = ANY(in_store_cast_ids) ORDER BY visit_date DESC`
  return rows.map(toVisitRecord)
}

export async function createVisitRecord(data: Omit<VisitRecord, 'id'>): Promise<VisitRecord> {
  const id = generateId()
  if (!useDB) {
    const record: VisitRecord = { ...data, id }
    store.visitRecords.set(id, record)
    const customer = store.customers.get(data.customerId)
    if (customer) {
      store.customers.set(data.customerId, {
        ...customer,
        lastVisitDate: data.visitDate,
        updatedAt: new Date().toISOString(),
      })
    }
    return record
  }
  const sql = getSQL()
  const snapshotsJson = JSON.stringify(data.bottleSnapshots ?? [])
  const rows = await sql`
    INSERT INTO visit_records (id, customer_id, visit_date, designated_cast_ids, in_store_cast_ids, bottles_opened, bottles_used, memo, is_alert, alert_reason, bottle_snapshots)
    VALUES (${id}, ${data.customerId}, ${data.visitDate}, ${data.designatedCastIds}, ${data.inStoreCastIds}, ${data.bottlesOpened}, ${data.bottlesUsed}, ${data.memo}, ${data.isAlert ?? false}, ${data.alertReason ?? ''}, ${snapshotsJson}::jsonb)
    RETURNING *
  `
  // Update customer lastVisitDate
  await sql`
    UPDATE customers SET last_visit_date = ${data.visitDate}, updated_at = ${new Date().toISOString()}
    WHERE id = ${data.customerId}
  `
  return toVisitRecord(rows[0])
}

export async function getVisitRecord(id: string): Promise<VisitRecord | null> {
  if (!useDB) return store.visitRecords.get(id) ?? null
  const sql = getSQL()
  const rows = await sql`SELECT * FROM visit_records WHERE id = ${id}`
  return rows[0] ? toVisitRecord(rows[0]) : null
}

export async function updateVisitRecord(
  id: string,
  data: Partial<Omit<VisitRecord, 'id'>>
): Promise<VisitRecord | null> {
  if (!useDB) {
    const existing = store.visitRecords.get(id)
    if (!existing) return null
    const updated: VisitRecord = { ...existing, ...data, id }
    store.visitRecords.set(id, updated)
    return updated
  }
  const existing = await getVisitRecord(id)
  if (!existing) return null
  const m = { ...existing, ...data }
  const sql = getSQL()
  const rows = await sql`
    UPDATE visit_records SET
      visit_date = ${m.visitDate}, designated_cast_ids = ${m.designatedCastIds},
      in_store_cast_ids = ${m.inStoreCastIds}, memo = ${m.memo}, is_alert = ${m.isAlert ?? false},
      alert_reason = ${m.alertReason ?? ''}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toVisitRecord(rows[0]) : null
}

export async function deleteVisitRecord(id: string): Promise<boolean> {
  if (!useDB) return store.visitRecords.delete(id)
  const sql = getSQL()
  await sql`DELETE FROM visit_records WHERE id = ${id}`
  return true
}

// ─── Reservation CRUD ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReservation(r: any): Reservation {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    partySize: r.party_size,
    hasDesignation: r.has_designation,
    designatedCastIds: Array.isArray(r.designated_cast_ids) && r.designated_cast_ids.length > 0
      ? r.designated_cast_ids
      : (r.designated_cast_id ? [r.designated_cast_id] : []),
    isAccompanied: r.is_accompanied,
    accompaniedCastIds: Array.isArray(r.accompanied_cast_ids) && r.accompanied_cast_ids.length > 0
      ? r.accompanied_cast_ids
      : (r.accompanied_cast_id ? [r.accompanied_cast_id] : []),
    customerType: r.customer_type,
    customerIds: Array.isArray(r.customer_ids) && r.customer_ids.length > 0
      ? r.customer_ids
      : (r.customer_id ? [r.customer_id] : []),
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

export async function getReservations(): Promise<Reservation[]> {
  if (!useDB) {
    return Array.from(store.reservations.values()).sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    )
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM reservations ORDER BY date, time`
  return rows.map(toReservation)
}

export async function getReservation(id: string): Promise<Reservation | null> {
  if (!useDB) return store.reservations.get(id) ?? null
  const sql = getSQL()
  const rows = await sql`SELECT * FROM reservations WHERE id = ${id}`
  return rows[0] ? toReservation(rows[0]) : null
}

export async function createReservation(data: Omit<Reservation, 'id' | 'updatedAt'>): Promise<Reservation> {
  const id = generateId()
  const updatedAt = new Date().toISOString()
  if (!useDB) {
    const reservation: Reservation = { ...data, id, updatedAt }
    store.reservations.set(id, reservation)
    return reservation
  }
  const sql = getSQL()
  const rows = await sql`
    INSERT INTO reservations (id, date, time, party_size, has_designation, designated_cast_ids, is_accompanied, accompanied_cast_ids, customer_type, customer_ids, guest_name, phone, price_type, party_plan_price, party_plan_minutes, memo, is_visited, updated_at, updated_by)
    VALUES (${id}, ${data.date}, ${data.time}, ${data.partySize}, ${data.hasDesignation}, ${data.designatedCastIds}, ${data.isAccompanied}, ${data.accompaniedCastIds}, ${data.customerType}, ${data.customerIds}, ${data.guestName}, ${data.phone}, ${data.priceType}, ${data.partyPlanPrice}, ${data.partyPlanMinutes}, ${data.memo}, ${data.isVisited}, ${updatedAt}, ${data.updatedBy})
    RETURNING *
  `
  return toReservation(rows[0])
}

export async function updateReservation(id: string, data: Partial<Omit<Reservation, 'id'>>): Promise<Reservation | null> {
  if (!useDB) {
    const existing = store.reservations.get(id)
    if (!existing) return null
    const updated: Reservation = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
    store.reservations.set(id, updated)
    return updated
  }
  const existing = await getReservation(id)
  if (!existing) return null
  const m = { ...existing, ...data, updatedAt: new Date().toISOString() }
  const sql = getSQL()
  const rows = await sql`
    UPDATE reservations SET
      date = ${m.date}, time = ${m.time}, party_size = ${m.partySize},
      has_designation = ${m.hasDesignation}, designated_cast_ids = ${m.designatedCastIds},
      is_accompanied = ${m.isAccompanied}, accompanied_cast_ids = ${m.accompaniedCastIds},
      customer_type = ${m.customerType}, customer_ids = ${m.customerIds},
      guest_name = ${m.guestName}, phone = ${m.phone}, is_visited = ${m.isVisited}, price_type = ${m.priceType}, party_plan_price = ${m.partyPlanPrice},
      party_plan_minutes = ${m.partyPlanMinutes}, memo = ${m.memo},
      updated_at = ${m.updatedAt}, updated_by = ${m.updatedBy}
    WHERE id = ${id} RETURNING *
  `
  return rows[0] ? toReservation(rows[0]) : null
}

export async function getReservationsByCustomer(customerId: string): Promise<Reservation[]> {
  if (!useDB) {
    return Array.from(store.reservations.values())
      .filter((r) => r.customerIds.includes(customerId))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM reservations WHERE ${customerId} = ANY(customer_ids) OR customer_id = ${customerId} ORDER BY date, time`
  return rows.map(toReservation)
}

export async function getReservationsByCast(castId: string): Promise<Reservation[]> {
  if (!useDB) {
    return Array.from(store.reservations.values())
      .filter((r) => r.designatedCastIds.includes(castId) || r.accompaniedCastIds.includes(castId))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  }
  const sql = getSQL()
  const rows = await sql`SELECT * FROM reservations WHERE ${castId} = ANY(designated_cast_ids) OR ${castId} = ANY(accompanied_cast_ids) ORDER BY date, time`
  return rows.map(toReservation)
}

export async function deleteReservation(id: string): Promise<boolean> {
  if (!useDB) return store.reservations.delete(id)
  const sql = getSQL()
  await sql`DELETE FROM reservations WHERE id = ${id}`
  return true
}
