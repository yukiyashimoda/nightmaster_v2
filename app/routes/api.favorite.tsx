import type { Route } from '../+types/routes/api.favorite'
import { getSupabase } from '../lib/db.server'
import { updateCustomer } from '../../src/lib/kv.server'

export async function action({ request, context }: Route.ActionArgs) {
  const db = getSupabase(context)
  const { customerId, isFavorite } = await request.json()
  await updateCustomer(db, customerId, { isFavorite })
  return Response.json({ ok: true })
}
