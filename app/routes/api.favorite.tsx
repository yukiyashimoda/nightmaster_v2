import type { Route } from '../+types/routes/api.favorite'
import { updateCustomer } from '../../src/lib/kv.server'

export async function action({ request }: Route.ActionArgs) {
  const { customerId, isFavorite } = await request.json()
  await updateCustomer(customerId, { isFavorite })
  return Response.json({ ok: true })
}
