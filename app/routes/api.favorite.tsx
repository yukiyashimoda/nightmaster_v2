import type { Route } from '../+types/routes/api.favorite'
import { getDb } from '../lib/db.server'
import { updateCustomer } from '../../src/lib/kv.server'

export async function action({ request, context }: Route.ActionArgs) {
  const db = getDb(context)
  const { customerId, isFavorite } = await request.json()
  await updateCustomer(db, customerId, { isFavorite })
  return Response.json({ ok: true })
}
