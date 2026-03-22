import type { Route } from '../+types/routes/api.reservation.$id'
import { getSupabase } from '../lib/db.server'
import { updateReservation, deleteReservation } from '../../src/lib/kv.server'
import { VALID_PASS } from '../../src/lib/auth.server'

export async function action({ request, params, context }: Route.ActionArgs) {
  const db = getSupabase(context)
  const { id } = params
  const body = await request.json()

  if (body._intent === 'delete') {
    if (body.password !== VALID_PASS) {
      return Response.json({ success: false, error: 'パスワードが違います' })
    }
    await deleteReservation(db, id)
    return Response.json({ success: true })
  }

  // update
  await updateReservation(db, id, body)
  return Response.json({ success: true })
}
