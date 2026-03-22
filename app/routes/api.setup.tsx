import { getDb } from '../lib/db.server'
import { mockCustomers, mockBottles, mockCasts, mockVisitRecords } from '../../src/lib/mock-data'
import type { Route } from '../+types/routes/api.setup'

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const db = getDb(context)
    if (!db) return Response.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })

    const url = new URL(request.url)
    const forceCasts = url.searchParams.get('force') === 'casts'

    if (forceCasts) {
      // キャストのみ一括upsert
      await db.from('casts').upsert(mockCasts.map((c) => ({
        id: c.id, name: c.name, ruby: c.ruby, memo: c.memo,
        updated_at: c.updatedAt, updated_by: c.updatedBy,
      })))
      return Response.json({ ok: true, message: `Casts upserted: ${mockCasts.length}` })
    }

    const { count } = await db.from('customers').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) return Response.json({ ok: true, message: 'Already seeded' })

    // visit_recordsから各顧客の最終来店日を計算
    const lastVisitMap = new Map<string, string>()
    for (const v of mockVisitRecords) {
      const current = lastVisitMap.get(v.customerId)
      if (!current || v.visitDate > current) lastVisitMap.set(v.customerId, v.visitDate)
    }

    // 全テーブル一括upsert
    await db.from('customers').upsert(mockCustomers.map((c) => ({
      id: c.id, name: c.name, ruby: c.ruby, nickname: c.nickname,
      designated_cast_ids: c.designatedCastIds, is_alert: c.isAlert,
      alert_reason: c.alertReason, memo: c.memo,
      linked_customer_ids: c.linkedCustomerIds,
      last_visit_date: lastVisitMap.get(c.id) ?? c.lastVisitDate,
      updated_at: c.updatedAt, updated_by: c.updatedBy,
    })))
    await db.from('bottles').upsert(mockBottles.map((b) => ({
      id: b.id, customer_id: b.customerId, name: b.name, remaining: b.remaining, opened_date: b.openedDate,
    })))
    await db.from('casts').upsert(mockCasts.map((c) => ({
      id: c.id, name: c.name, ruby: c.ruby, memo: c.memo,
      updated_at: c.updatedAt, updated_by: c.updatedBy,
    })))
    await db.from('visit_records').upsert(mockVisitRecords.map((v) => ({
      id: v.id, customer_id: v.customerId, visit_date: v.visitDate,
      designated_cast_ids: v.designatedCastIds, in_store_cast_ids: v.inStoreCastIds,
      bottles_opened: v.bottlesOpened, bottles_used: v.bottlesUsed, memo: v.memo,
    })))
    return Response.json({ ok: true, message: 'Setup complete' })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
