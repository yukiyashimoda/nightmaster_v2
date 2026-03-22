import { getDb } from '../lib/db.server'
import { mockReservations } from '../../src/lib/mock-data'
import type { Route } from '../+types/routes/api.seed-reservations'

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const db = getDb(context)
    if (!db) return Response.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
    await db.from('reservations').upsert(mockReservations.map((r) => ({
      id: r.id, date: r.date, time: r.time, party_size: r.partySize,
      has_designation: r.hasDesignation, designated_cast_ids: r.designatedCastIds,
      is_accompanied: r.isAccompanied, accompanied_cast_ids: r.accompaniedCastIds,
      customer_type: r.customerType, customer_ids: r.customerIds,
      guest_name: r.guestName, price_type: r.priceType,
      party_plan_price: r.partyPlanPrice, party_plan_minutes: r.partyPlanMinutes,
      memo: r.memo, updated_at: r.updatedAt, updated_by: r.updatedBy,
    })))
    return Response.json({ ok: true, inserted: mockReservations.length })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
