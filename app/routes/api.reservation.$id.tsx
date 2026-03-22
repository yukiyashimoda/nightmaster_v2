import type { Route } from '../+types/routes/api.reservation.$id'
import { getDb } from '../lib/db.server'
import { updateReservation, deleteReservation } from '../../src/lib/kv.server'
import { isAuthenticated } from '../../src/lib/auth.server'

export async function action({ request, params, context }: Route.ActionArgs) {
  const db = getDb(context)
  const { id } = params
  const body = await request.json()

  if (body._intent === 'delete') {
    if (!isAuthenticated(request)) {
      return Response.json({ success: false, error: '認証が必要です' }, { status: 401 })
    }
    await deleteReservation(db, id)
    return Response.json({ success: true })
  }

  // update
  await updateReservation(db, id, body)
  return Response.json({ success: true })
}
