import { useState } from 'react'
import { Link, useFetcher, useLocation } from 'react-router'
import { LogIn, LogOut, Menu, X, User, TrendingUp, CalendarDays, Store, ChevronDown, Check, Settings } from 'lucide-react'
import { FaAddressCard, FaStar } from 'react-icons/fa'
import { GiAmpleDress } from 'react-icons/gi'
import { cn } from '@/lib/utils'

interface NavProps {
  isLoggedIn: boolean
  sessionUser: string | null
  stores?: Array<{ id: string; name: string }>
  currentStoreId?: string | null
}

export function Nav({ isLoggedIn, sessionUser, stores = [], currentStoreId }: NavProps) {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [storeMenuOpen, setStoreMenuOpen] = useState(false)

  const links = [
    { href: '/', label: 'ダッシュボード', Icon: TrendingUp },
    { href: '/customers', label: '顧客', Icon: FaAddressCard },
    { href: '/casts', label: 'キャスト', Icon: GiAmpleDress },
    { href: '/favorites', label: 'お気に入り', Icon: FaStar },
    { href: '/reservations', label: '予約', Icon: CalendarDays },
    { href: '/settings', label: '設定', Icon: Settings },
  ]

  const bottomLinks = links.filter((l) => l.href !== '/favorites')
  const currentStore = stores.find((s) => s.id === currentStoreId)
  const switchFetcher = useFetcher()
  const logoutFetcher = useFetcher()

  const handleLogout = () => {
    setSidebarOpen(false)
    logoutFetcher.submit({}, { method: 'post', action: '/logout' })
  }

  const handleStoreSwitch = (storeId: string) => {
    setStoreMenuOpen(false)
    switchFetcher.submit({ store_id: storeId }, { method: 'post', action: '/api/store-switch' })
  }

  const storeSwitcher = isLoggedIn && stores.length > 0 && (
    <div className="px-3 py-2 border-b border-brand-beige relative">
      <button
        onClick={() => setStoreMenuOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-beige/60 transition-colors text-left"
      >
        <Store className="h-4 w-4 text-brand-plum/50 shrink-0" />
        <span className="flex-1 text-sm font-medium text-brand-plum truncate">
          {currentStore?.name ?? '店舗を選択'}
        </span>
        {stores.length > 1 && <ChevronDown className="h-3.5 w-3.5 text-brand-plum/40 shrink-0" />}
      </button>

      {storeMenuOpen && stores.length > 1 && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white border border-brand-beige rounded-xl shadow-lg py-1">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreSwitch(store.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-plum hover:bg-brand-beige/60 transition-colors"
            >
              <Check className={cn('h-3.5 w-3.5 shrink-0', store.id === currentStoreId ? 'text-brand-plum' : 'opacity-0')} />
              <span className="truncate">{store.name}</span>
            </button>
          ))}
          <div className="border-t border-brand-beige mt-1 pt-1">
            <Link
              to="/store-setup"
              onClick={() => setStoreMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-brand-plum/60 hover:bg-brand-beige/60 transition-colors"
            >
              <Store className="h-3.5 w-3.5" />
              新しい店舗を追加
            </Link>
          </div>
        </div>
      )}
    </div>
  )

  const sidebarLinks = (
    <nav className="flex-1 p-3 space-y-1">
      {links.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            to={href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors',
              active
                ? 'bg-brand-plum text-white'
                : 'text-brand-plum/70 hover:bg-brand-beige/60 hover:text-brand-plum'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  const sidebarBottom = (
    <div className="p-3 border-t border-brand-beige">
      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-brand-plum/70 hover:bg-brand-beige/60 hover:text-brand-plum transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      ) : (
        <Link
          to="/login"
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-brand-plum/70 hover:bg-brand-beige/60 hover:text-brand-plum transition-colors"
        >
          <LogIn className="h-4 w-4" />
          ログイン
        </Link>
      )}
    </div>
  )

  const userCard = (
    <div className="p-4 border-b border-brand-beige">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-plum flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-brand-plum/50">ログイン中</p>
          <p className="text-base font-semibold text-brand-plum truncate">
            {sessionUser ?? 'ゲスト'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ─── トップヘッダー ─── */}
      <header className="fixed top-0 left-0 right-0 sm:left-60 z-30 h-16 bg-white border-b border-brand-beige shadow-sm">
        <div className="px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-brand-plum text-base" style={{ fontFamily: 'var(--font-audiowide)' }}>
              <span style={{ color: '#F1896C' }}>N</span>ight Master
            </span>
          </Link>
          {/* ハンバーガー（スマホのみ） */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sm:hidden p-2 rounded-md text-brand-plum/60 hover:text-brand-plum hover:bg-brand-beige/50 transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ─── モバイル：オーバーレイ ─── */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── モバイル：スライドインサイドバー ─── */}
      <aside
        className={cn(
          'sm:hidden fixed top-0 left-0 h-full w-64 z-50 bg-white border-r border-brand-beige shadow-xl flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ロゴ */}
        <div className="h-16 flex items-center px-4 border-b border-brand-beige shrink-0">
          <span className="text-brand-plum text-base" style={{ fontFamily: 'var(--font-audiowide)' }}>
            <span style={{ color: '#F1896C' }}>N</span>ight Master
          </span>
        </div>
        {userCard}
        {storeSwitcher}
        {sidebarLinks}
        {sidebarBottom}
      </aside>

      {/* ─── スマホ：下部固定ナビ ─── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-beige shadow-lg">
        <div className="flex">
          {bottomLinks.map(({ href, label, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors',
                  active ? 'text-brand-plum' : 'text-brand-plum/50'
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ─── PC：固定サイドバー ─── */}
      <aside className="hidden sm:flex flex-col fixed top-0 left-0 h-full w-60 bg-white border-r border-brand-beige z-40">
        {/* ロゴ */}
        <div className="h-16 flex items-center px-4 border-b border-brand-beige shrink-0">
          <Link to="/">
            <span className="text-brand-plum text-base" style={{ fontFamily: 'var(--font-audiowide)' }}>
              <span style={{ color: '#F1896C' }}>N</span>ight Master
            </span>
          </Link>
        </div>
        {userCard}
        {storeSwitcher}
        {sidebarLinks}
        {sidebarBottom}
      </aside>
    </>
  )
}
