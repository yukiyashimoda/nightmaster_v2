import type { Route } from '../+types/routes/casts.$id.edit'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../src/components/ui/button'
import { getDb } from '../lib/db.server'
import { getCast } from '../../src/lib/kv.server'
import { EditCastForm } from '../../src/app/casts/[id]/edit/edit-cast-form'

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = getDb(context)
  const { id } = params
  const cast = await getCast(db, id)
  if (!cast) {
    throw new Response(null, { status: 404 })
  }
  return { id, cast }
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const body = await request.json()
  const { name, ruby, memo } = body
  if (!name?.trim() || !ruby?.trim()) {
    return Response.json({ success: false, error: '名前とふりがなは必須です' })
  }
  const { getSessionUser } = await import('../../src/lib/auth.server')
  const { updateCast } = await import('../../src/lib/kv.server')
  const { getDb: getDbInAction } = await import('../lib/db.server')
  const db = getDbInAction(context)
  const updatedBy = getSessionUser(request) ?? ''
  const result = await updateCast(db, params.id, { name: name.trim(), ruby: ruby.trim(), memo: memo?.trim() ?? '', updatedBy })
  if (!result) return Response.json({ success: false, error: 'キャストが見つかりません' })
  return Response.json({ success: true })
}

export default function EditCastPage({ loaderData }: Route.ComponentProps) {
  const { id, cast } = loaderData

  return (
    <div className="min-h-screen pb-10">
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <Link to={`/casts/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-bold text-gray-900">キャスト編集</h1>
      </div>

      <div className="px-4 py-5">
        <EditCastForm cast={cast} />
      </div>
    </div>
  )
}
