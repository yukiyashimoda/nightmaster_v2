import { redirect } from 'react-router'
import type { Route } from '../+types/routes/auth.callback'
import { parseAuthCookies, makeAuthCookies, clearPkceCookie } from '../../src/lib/auth.server'
import { exchangeCode } from '../lib/supabase-auth.server'

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabaseUrl, anonKey, supabase } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const { pkceVerifier } = parseAuthCookies(request)

  if (!code || !pkceVerifier || !supabaseUrl || !anonKey) {
    throw redirect('/login')
  }

  try {
    const tokens = await exchangeCode(supabaseUrl, anonKey, code, pkceVerifier)
    let storeId: string | null = null

    if (supabase) {
      const { data: userStores } = await supabase.from('user_stores').select('*').eq('user_id', tokens.user.id)
      if (userStores && userStores.length > 0) {
        storeId = userStores[0].store_id
      }
    }

    const cookies = makeAuthCookies(tokens.access_token, tokens.refresh_token, storeId ?? '')
    const clearPkce = clearPkceCookie()

    const headers = new Headers()
    for (const c of cookies) headers.append('Set-Cookie', c)
    headers.append('Set-Cookie', clearPkce)

    if (!storeId) {
      headers.set('Location', '/store-setup')
      return new Response(null, { status: 302, headers })
    }
    headers.set('Location', '/')
    return new Response(null, { status: 302, headers })
  } catch {
    throw redirect('/login?error=oauth_failed')
  }
}
