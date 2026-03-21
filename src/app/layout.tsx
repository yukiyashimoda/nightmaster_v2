import type { Metadata, Viewport } from 'next'
import { Kiwi_Maru, Audiowide } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { isAuthenticated, getSessionUser } from '@/lib/auth'
import { SwRegister } from '@/components/sw-register'

const kiwiMaru = Kiwi_Maru({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-kiwi-maru' })
const audiowide = Audiowide({ subsets: ['latin'], weight: '400', variable: '--font-audiowide' })

export const metadata: Metadata = {
  title: 'ナイトワーク顧客管理アプリ',
  description: 'ナイトワーク顧客管理アプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Night Master v1',
  },
  openGraph: {
    title: 'ナイトワーク顧客管理アプリ',
    description: 'ナイトワーク顧客管理アプリ',
    type: 'website',
    locale: 'ja_JP',
  },
}

export const viewport: Viewport = {
  themeColor: '#4B3C52',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loggedIn, sessionUser] = await Promise.all([isAuthenticated(), getSessionUser()])

  return (
    <html lang="ja">
      <body className={`${kiwiMaru.className} ${kiwiMaru.variable} ${audiowide.variable} bg-brand-beige/20 text-brand-plum min-h-screen`}>
        <SwRegister />
        <Nav isLoggedIn={loggedIn} sessionUser={sessionUser} />
        <main className="pt-16 pb-20 sm:pb-0 sm:ml-60">
          <div className="max-w-2xl mx-auto px-0">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
