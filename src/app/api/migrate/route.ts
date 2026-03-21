import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS is_alert BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS alert_reason TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_glass BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS glass_memo TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS receipt_names TEXT[] NOT NULL DEFAULT '{}'`
  await sql`ALTER TABLE visit_records ADD COLUMN IF NOT EXISTS bottle_snapshots JSONB NOT NULL DEFAULT '[]'`
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS accompanied_cast_id TEXT`
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS designated_cast_ids TEXT[] NOT NULL DEFAULT '{}'`
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS accompanied_cast_ids TEXT[] NOT NULL DEFAULT '{}'`
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_visited BOOLEAN NOT NULL DEFAULT false`
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS customer_ids TEXT[] NOT NULL DEFAULT '{}'`
  return Response.json({ ok: true, message: 'Migration complete' })
}
