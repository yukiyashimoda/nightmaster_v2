import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigate, useRouteError, isRouteErrorResponse } from 'react-router'
import type { Route } from './+types/root'
import { RouterProvider } from '@heroui/react'
import { Nav } from '../src/components/nav'
import { isAuthenticated, getSessionUser } from '../src/lib/auth.server'
import '../src/app/globals.css'

export async function loader({ request }: Route.LoaderArgs) {
  const loggedIn = isAuthenticated(request)
  const sessionUser = getSessionUser(request)
  return { loggedIn, sessionUser }
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
      href: 'https://fonts.googleapis.com/css2?family=Kiwi+Maru:wght@300;400;500&family=Audiowide&display=swap',
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

export default function App({ loaderData }: Route.ComponentProps) {
  const { loggedIn, sessionUser } = loaderData
  const navigate = useNavigate()
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        <style>{`
          body { font-family: 'Kiwi Maru', sans-serif; }
          .font-audiowide { font-family: 'Audiowide', cursive; }
          :root { --font-kiwi-maru: 'Kiwi Maru'; --font-audiowide: 'Audiowide'; }
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
          <Nav isLoggedIn={loggedIn} sessionUser={sessionUser} />
          <main className="pt-16 pb-20 sm:pb-0 sm:ml-60">
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
