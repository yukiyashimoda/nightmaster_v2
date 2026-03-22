import { redirect } from 'react-router'
import type { Route } from '../+types/routes/api.store-switch'
import { parseAuthCookies, decodeJWT, makeStoreCookie } from '../../src/lib/auth.server'

export async function action({ request, context }: Route.ActionArgs) {
  const { supabase } = context
  const { accessToken } = parseAuthCookies(request)
  if (!accessToken) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const payload = decodeJWT(accessToken)
  if (!payload?.sub) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const storeId = formData.get('store_id') as string
  if (!storeId) return Response.json({ ok: false, error: 'store_id required' }, { status: 400 })

  if (supabase) {
    // Verify user has access to this store
    const { data } = await supabase.from('user_stores').select('*').eq('user_id', payload.sub).eq('store_id', storeId)
    if (!data || data.length === 0) {
      return Response.json({ ok: false, error: 'Access denied' }, { status: 403 })
    }
  }

  const redirectTo = (request.headers.get('Referer') ?? '/').replace(/^https?:\/\/[^/]+/, '')
  return redirect(redirectTo, {
    headers: { 'Set-Cookie': makeStoreCookie(storeId) },
  })
}

export async function loader() {
  throw redirect('/')
}
