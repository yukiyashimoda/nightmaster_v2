import { getDB } from '../lib/db.server'
import { mockCustomers, mockBottles, mockCasts, mockVisitRecords } from '../../src/lib/mock-data'

export async function loader() {
  try {
    return await runSetup()
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

async function runSetup() {
  const sql = getDB()

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ruby TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      designated_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      is_alert BOOLEAN NOT NULL DEFAULT false,
      alert_reason TEXT NOT NULL DEFAULT '',
      memo TEXT NOT NULL DEFAULT '',
      linked_customer_ids TEXT[] NOT NULL DEFAULT '{}',
      last_visit_date TEXT,
      updated_at TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS bottles (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      remaining TEXT NOT NULL,
      opened_date TEXT NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS casts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ruby TEXT NOT NULL,
      memo TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      designated_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      in_store_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      bottles_opened TEXT[] NOT NULL DEFAULT '{}',
      bottles_used TEXT[] NOT NULL DEFAULT '{}',
      memo TEXT NOT NULL DEFAULT ''
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      party_size INTEGER NOT NULL DEFAULT 1,
      has_designation BOOLEAN NOT NULL DEFAULT false,
      designated_cast_id TEXT,
      designated_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      is_accompanied BOOLEAN NOT NULL DEFAULT false,
      accompanied_cast_id TEXT,
      accompanied_cast_ids TEXT[] NOT NULL DEFAULT '{}',
      customer_type TEXT NOT NULL DEFAULT 'existing',
      customer_id TEXT,
      customer_ids TEXT[] NOT NULL DEFAULT '{}',
      guest_name TEXT NOT NULL DEFAULT '',
      price_type TEXT NOT NULL DEFAULT 'normal',
      party_plan_price INTEGER,
      party_plan_minutes INTEGER,
      phone TEXT NOT NULL DEFAULT '',
      memo TEXT NOT NULL DEFAULT '',
      is_visited BOOLEAN NOT NULL DEFAULT false,
      updated_at TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `

  const existing = await sql`SELECT COUNT(*) as count FROM customers`
  if (Number(existing[0].count) > 0) {
    return Response.json({ ok: true, message: 'Already seeded' })
  }

  for (const c of mockCustomers) {
    await sql`
      INSERT INTO customers (id, name, ruby, nickname, designated_cast_ids, is_alert, alert_reason, memo, linked_customer_ids, last_visit_date, updated_at, updated_by)
      VALUES (${c.id}, ${c.name}, ${c.ruby}, ${c.nickname}, ${c.designatedCastIds}, ${c.isAlert}, ${c.alertReason}, ${c.memo}, ${c.linkedCustomerIds}, ${c.lastVisitDate}, ${c.updatedAt}, ${c.updatedBy})
      ON CONFLICT (id) DO NOTHING
    `
  }
  for (const b of mockBottles) {
    await sql`
      INSERT INTO bottles (id, customer_id, name, remaining, opened_date)
      VALUES (${b.id}, ${b.customerId}, ${b.name}, ${b.remaining}, ${b.openedDate})
      ON CONFLICT (id) DO NOTHING
    `
  }
  for (const c of mockCasts) {
    await sql`
      INSERT INTO casts (id, name, ruby, memo, updated_at, updated_by)
      VALUES (${c.id}, ${c.name}, ${c.ruby}, ${c.memo}, ${c.updatedAt}, ${c.updatedBy})
      ON CONFLICT (id) DO NOTHING
    `
  }
  for (const v of mockVisitRecords) {
    await sql`
      INSERT INTO visit_records (id, customer_id, visit_date, designated_cast_ids, in_store_cast_ids, bottles_opened, bottles_used, memo)
      VALUES (${v.id}, ${v.customerId}, ${v.visitDate}, ${v.designatedCastIds}, ${v.inStoreCastIds}, ${v.bottlesOpened}, ${v.bottlesUsed}, ${v.memo})
      ON CONFLICT (id) DO NOTHING
    `
  }

  return Response.json({ ok: true, message: 'Setup complete' })
}
