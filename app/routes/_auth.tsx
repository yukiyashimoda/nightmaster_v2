import { Outlet, redirect } from 'react-router'
import type { Route } from '../+types/routes/_auth'
import { isAuthenticated } from '../../src/lib/auth.server'

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAuthenticated(request)) {
    throw redirect('/login')
  }
  return null
}

export default function AuthLayout() {
  return <Outlet />
}
