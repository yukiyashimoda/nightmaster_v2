import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigate, useRouteError, isRouteErrorResponse, useLocation } from 'react-router'
import type { Route } from './+types/root'
import { RouterProvider } from '@heroui/react'
import { Nav } from '../src/components/nav'
import { isAuthenticated, getSessionUser } from '../src/lib/auth.server'
import '../src/app/globals.css'

export async function loader({ request, context }: Route.LoaderArgs) {
  const loggedIn = isAuthenticated(request)
  const sessionUser = getSessionUser(request)
  const { supabase, userId, storeId } = context ?? {}

  let stores: Array<{ id: string; name: string }> = []
  try {
    if (supabase && userId) {
      const { data } = await supabase.from('user_stores').select('store_id').eq('user_id', userId)
      if (data && data.length > 0) {
        const storeIds = data.map((r: { store_id: string }) => r.store_id)
        for (const sid of storeIds) {
          const { data: s } = await supabase.from('stores').select('id,name').eq('id', sid).maybeSingle()
          if (s) stores.push(s)
        }
      }
    }
  } catch {
    // stores/user_stores未作成など — ナビ表示に影響するだけなので握りつぶす
  }

  return { loggedIn, sessionUser, stores, currentStoreId: storeId ?? null }
}

export function links(): Route.LinkDescriptors {
  return [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@300;400;500;600;700&family=Audiowide&display=swap',
    },
    { rel: 'manifest', href: '/manifest.json' },
  ]
}

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'ナイトワーク顧客管理アプリ' },
    { name: 'description', content: 'ナイトワーク顧客管理アプリ' },
    { name: 'theme-color', content: '#4B3C52' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Night Master v1' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
  ]
}

const AUTH_ONLY_PATHS = ['/login', '/register', '/store-setup', '/auth/callback']

export default function App({ loaderData }: Route.ComponentProps) {
  const { loggedIn, sessionUser, stores, currentStoreId } = loaderData
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hideNav = AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '?'))
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        <style>{`
          body { font-family: 'IBM Plex Sans JP', sans-serif; }
          .font-audiowide { font-family: 'Audiowide', cursive; }
          :root { --font-audiowide: 'Audiowide'; }
        `}</style>
      </head>
      <body className="bg-brand-beige/20 text-brand-plum min-h-screen">
        {/*
          RouterProvider: HeroUI の Link / LinkRoot などが React Router の
          navigate を使って SPA 遷移できるようにコンテキストを提供する。
          navigate をそのまま渡すと型が緩くなるため、href のみを受け取る
          ラッパーで RouterOptions を明示的に無視する。
        */}
        <RouterProvider navigate={(href) => navigate(href)}>
          {!hideNav && <Nav isLoggedIn={loggedIn} sessionUser={sessionUser} stores={stores} currentStoreId={currentStoreId} />}
          <main className={hideNav ? '' : 'pt-16 pb-20 sm:pb-0 sm:ml-60'}>
            <div className="max-w-2xl mx-auto px-0">
              <Outlet />
            </div>
          </main>
          <ScrollRestoration />
          <Scripts />
        </RouterProvider>
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}: ${JSON.stringify(error.data)}`
    : error instanceof Error
    ? `${error.message}\n${error.stack}`
    : JSON.stringify(error)
  return (
    <html lang="ja">
      <head><title>Error</title></head>
      <body style={{ fontFamily: 'monospace', padding: '20px', whiteSpace: 'pre-wrap' }}>
        <h2>Debug Error</h2>
        {message}
      </body>
    </html>
  )
}
