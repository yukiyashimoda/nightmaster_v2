import type { Route } from '../+types/routes/api.reservation.$id'
import { updateReservation, deleteReservation } from '../../src/lib/kv.server'
import { VALID_PASS } from '../../src/lib/auth.server'

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const body = await request.json()

  if (body._intent === 'delete') {
    if (body.password !== VALID_PASS) {
      return Response.json({ success: false, error: 'パスワードが違います' })
    }
    await deleteReservation(id)
    return Response.json({ success: true })
  }

  // update
  await updateReservation(id, body)
  return Response.json({ success: true })
}
