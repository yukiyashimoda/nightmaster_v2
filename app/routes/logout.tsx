import { redirect } from 'react-router'
import type { Route } from '../+types/routes/logout'
import { clearSessionCookie } from '../../src/lib/auth.server'

export async function action(_: Route.ActionArgs) {
  throw redirect('/', {
    headers: { 'Set-Cookie': clearSessionCookie() },
  })
}

export async function loader() {
  throw redirect('/')
}
