import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { mockReservations } from '@/lib/mock-data'

export async function POST(req: Request) {
  const secret = req.headers.get('x-seed-secret')
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  let inserted = 0

  for (const r of mockReservations) {
    await sql`
      INSERT INTO reservations (
        id, date, time, party_size, has_designation, designated_cast_ids,
        is_accompanied, accompanied_cast_ids, customer_type, customer_ids, guest_name,
        price_type, party_plan_price, party_plan_minutes, memo, updated_at, updated_by
      ) VALUES (
        ${r.id}, ${r.date}, ${r.time}, ${r.partySize}, ${r.hasDesignation}, ${r.designatedCastIds},
        ${r.isAccompanied}, ${r.accompaniedCastIds}, ${r.customerType}, ${r.customerIds}, ${r.guestName},
        ${r.priceType}, ${r.partyPlanPrice}, ${r.partyPlanMinutes}, ${r.memo}, ${r.updatedAt}, ${r.updatedBy}
      )
      ON CONFLICT (id) DO NOTHING
    `
    inserted++
  }

  return NextResponse.json({ ok: true, inserted })
}
