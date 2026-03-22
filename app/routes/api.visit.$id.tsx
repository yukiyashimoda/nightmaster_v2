import type { Route } from '../+types/routes/api.visit.$id'
import { getDb } from '../lib/db.server'
import { updateVisitRecord, deleteVisitRecord } from '../../src/lib/kv.server'
import { isAuthenticated } from '../../src/lib/auth.server'

export async function action({ request, params, context }: Route.ActionArgs) {
  const db = getDb(context)
  const { id } = params
  const body = await request.json()

  if (body._intent === 'delete') {
    if (!isAuthenticated(request)) {
      return Response.json({ success: false, error: '認証が必要です' }, { status: 401 })
    }
    await deleteVisitRecord(db, id)
    return Response.json({ success: true })
  }

  // update
  const result = await updateVisitRecord(db, id, body)
  if (!result) return Response.json({ success: false, error: '来店記録が見つかりません' })
  return Response.json({ success: true })
}
