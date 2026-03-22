import type { Route } from '../+types/routes/api.visit.$id'
import { getSupabase } from '../lib/db.server'
import { updateVisitRecord, deleteVisitRecord } from '../../src/lib/kv.server'
import { VALID_PASS } from '../../src/lib/auth.server'

export async function action({ request, params, context }: Route.ActionArgs) {
  const db = getSupabase(context)
  const { id } = params
  const body = await request.json()

  if (body._intent === 'delete') {
    if (body.password !== VALID_PASS) {
      return Response.json({ success: false, error: 'パスワードが違います' })
    }
    await deleteVisitRecord(db, id)
    return Response.json({ success: true })
  }

  // update
  const result = await updateVisitRecord(db, id, body)
  if (!result) return Response.json({ success: false, error: '来店記録が見つかりません' })
  return Response.json({ success: true })
}
