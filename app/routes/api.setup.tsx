import { getDb } from '../lib/db.server'
import { mockCustomers, mockBottles, mockCasts, mockVisitRecords } from '../../src/lib/mock-data'
import type { Route } from '../+types/routes/api.setup'

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const db = getDb(context)
    if (!db) return Response.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })

    const { count } = await db.from('customers').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) return Response.json({ ok: true, message: 'Already seeded' })

    for (const c of mockCustomers) {
      await db.from('customers').upsert({
        id: c.id, name: c.name, ruby: c.ruby, nickname: c.nickname,
        designated_cast_ids: c.designatedCastIds, is_alert: c.isAlert,
        alert_reason: c.alertReason, memo: c.memo,
        linked_customer_ids: c.linkedCustomerIds, last_visit_date: c.lastVisitDate,
        updated_at: c.updatedAt, updated_by: c.updatedBy,
      })
    }
    for (const b of mockBottles) {
      await db.from('bottles').upsert({ id: b.id, customer_id: b.customerId, name: b.name, remaining: b.remaining, opened_date: b.openedDate })
    }
    for (const c of mockCasts) {
      await db.from('casts').upsert({ id: c.id, name: c.name, ruby: c.ruby, memo: c.memo, updated_at: c.updatedAt, updated_by: c.updatedBy })
    }
    for (const v of mockVisitRecords) {
      await db.from('visit_records').upsert({ id: v.id, customer_id: v.customerId, visit_date: v.visitDate, designated_cast_ids: v.designatedCastIds, in_store_cast_ids: v.inStoreCastIds, bottles_opened: v.bottlesOpened, bottles_used: v.bottlesUsed, memo: v.memo })
    }
    return Response.json({ ok: true, message: 'Setup complete' })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
