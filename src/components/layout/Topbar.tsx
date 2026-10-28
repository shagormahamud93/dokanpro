import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Search, Sun, Moon, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/IconButton'
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useSocket, useSocketEvent } from '@/context/SocketContext'
import { useToast } from '@/context/ToastContext'
import { useI18n } from '@/context/I18nContext'
import { cn } from '@/lib/utils'

interface StockUpdate {
  productId: string
  stock: number
  name?: string
}

export function Topbar() {
  const { resolvedTheme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const { t } = useI18n()
  const toast = useToast()

  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Listen for low-stock alerts → toast + bump notification dot
  useSocketEvent<{ name: string; stock: number }>('low-stock:alert', (payload) => {
    setUnread((n) => n + 1)
    toast.warning('Low stock alert', `${payload.name} has only ${payload.stock} left`)
  })

  // Listen for any stock change as a quiet notification dot
  useSocketEvent<StockUpdate>('stock:updated', () => {
    setUnread((n) => n + 1)
  })

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface/80 px-6 backdrop-blur-md">
      {/* Search */}
      <div className="flex max-w-xl flex-1 items-center">
        <div className="group relative flex h-10 w-full items-center rounded-sm border border-border bg-surface-2/50 transition-colors focus-within:border-primary focus-within:bg-surface focus-within:shadow-focus">
          <Search className="ml-3 h-4 w-4 text-text-muted group-focus-within:text-primary" />
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="flex-1 border-0 bg-transparent px-3 text-body text-text placeholder:text-text-faint focus:outline-none focus:ring-0"
          />
          <kbd className="mr-2 hidden h-6 select-none items-center gap-1 rounded-xs border border-border bg-surface px-1.5 font-mono text-caption text-text-muted md:inline-flex">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Subscription badge */}
      <SubscriptionBadge />

      {/* Live status pill */}
      <div
        className={cn(
          'hidden items-center gap-2 rounded-full px-3 py-1.5 text-caption font-medium lg:inline-flex',
          connected
            ? 'bg-success-soft text-success dark:bg-success/15'
            : 'bg-surface-2 text-text-muted',
        )}
      >
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full',
              connected ? 'bg-success' : 'bg-text-faint',
            )}
          />
        </span>
        {connected ? 'Live' : 'Offline'}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <IconButton label="Toggle theme" onClick={toggle}>
          {resolvedTheme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </IconButton>

        <IconButton
          label="Notifications"
          className="relative"
          onClick={() => setUnread(0)}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </IconButton>

        {/* Profile menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-2 inline-flex items-center gap-2 rounded-sm px-2 py-1.5 transition-colors hover:bg-surface-2 focus-ring"
          >
            <Avatar name={user?.name ?? 'Guest'} size="sm" />
            <div className="hidden text-left md:block">
              <p className="text-body-sm font-medium text-text">{user?.name ?? 'Guest'}</p>
              <p className="text-caption text-text-muted">
                {user?.role === 'admin' ? 'Admin' : user?.role === 'staff' ? 'Staff' : '—'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-text-muted transition-transform duration-150',
                menuOpen && 'rotate-180',
              )}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-56 animate-slide-up overflow-hidden rounded-md border border-border bg-surface shadow-lg">
              {user && (
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-body-sm font-semibold text-text">{user.name}</p>
                  <p className="truncate text-caption text-text-muted">{user.email}</p>
                </div>
              )}
              <ul className="p-1">
                <li>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-sm px-3 py-2 text-body-sm text-text hover:bg-surface-2"
                  >
                    <SettingsIcon className="h-4 w-4 text-text-muted" />
                    Settings
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                      toast.info('Signed out')
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-body-sm text-danger hover:bg-danger-soft"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('topbar.logout')}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
