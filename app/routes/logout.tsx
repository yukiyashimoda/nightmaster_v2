import { redirect } from 'react-router'
import type { Route } from '../+types/routes/logout'
import { clearAuthCookies, parseAuthCookies } from '../../src/lib/auth.server'
import { signOut } from '../lib/supabase-auth.server'

export async function action({ request, context }: Route.ActionArgs) {
  const { accessToken } = parseAuthCookies(request)
  const { supabaseUrl, anonKey } = context

  if (accessToken && supabaseUrl && anonKey) {
    await signOut(supabaseUrl, anonKey, accessToken).catch(() => {})
  }

  const cookies = clearAuthCookies()
  return redirect('/', {
    headers: cookies.map((c) => ['Set-Cookie', c] as [string, string]),
  })
}

export async function loader() {
  throw redirect('/')
}
