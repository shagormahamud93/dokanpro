import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Store,
  ChevronsLeft,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/context/I18nContext'
import { useAuth } from '@/context/AuthContext'

type LabelKey =
  | 'nav.dashboard'
  | 'nav.pos'
  | 'nav.products'
  | 'nav.inventory'
  | 'nav.customers'
  | 'nav.orders'
  | 'nav.reports'
  | 'nav.settings'
  | 'nav.subscription'
  | 'nav.adminSubscriptions'

type SectionKey = 'nav.main' | 'nav.catalog' | 'nav.insights' | 'nav.system' | 'nav.admin'

interface NavItem {
  to: string
  labelKey: LabelKey
  icon: typeof LayoutDashboard
  badge?: string
}

interface NavSection {
  labelKey: SectionKey
  items: NavItem[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const sections: NavSection[] = useMemo(() => {
    const base: NavSection[] = [
      {
        labelKey: 'nav.main',
        items: [
          { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
          { to: '/pos', labelKey: 'nav.pos', icon: ShoppingCart },
        ],
      },
      {
        labelKey: 'nav.catalog',
        items: [
          { to: '/products', labelKey: 'nav.products', icon: Package },
          { to: '/inventory', labelKey: 'nav.inventory', icon: Boxes, badge: '4' },
          { to: '/customers', labelKey: 'nav.customers', icon: Users },
        ],
      },
      {
        labelKey: 'nav.insights',
        items: [
          { to: '/orders', labelKey: 'nav.orders', icon: Receipt },
          { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
        ],
      },
    ]

    if (isAdmin) {
      base.push({
        labelKey: 'nav.admin',
        items: [
          { to: '/admin/subscriptions', labelKey: 'nav.adminSubscriptions', icon: ShieldCheck },
        ],
      })
    }

    const systemItems: NavItem[] = [
      { to: '/settings', labelKey: 'nav.settings', icon: Settings },
    ]
    if (!isAdmin) {
      systemItems.unshift({
        to: '/subscription',
        labelKey: 'nav.subscription',
        icon: CreditCard,
      })
    }
    base.push({ labelKey: 'nav.system', items: systemItems })

    return base
  }, [isAdmin])

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface',
        'transition-[width] duration-200 ease-out-expo',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
          <Store className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-1 items-center justify-between overflow-hidden">
            <div>
              <p className="text-body font-semibold text-text">DokanPro</p>
              <p className="truncate text-caption text-text-muted">
                {isAdmin ? 'Platform' : user?.name ? user.name.split(' ')[0] + "'s shop" : 'Shop'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.labelKey} className="mb-6 last:mb-0">
            {!collapsed && (
              <p className="mb-2 px-3 text-overline uppercase text-text-faint">
                {t(section.labelKey)}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex h-10 items-center gap-3 rounded-sm px-3 text-body-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-primary-soft text-primary'
                          : 'text-text-muted hover:bg-surface-2 hover:text-text',
                      )
                    }
                    title={collapsed ? t(item.labelKey) : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                        )}
                        <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                        {!collapsed && <span className="flex-1 truncate">{t(item.labelKey)}</span>}
                        {!collapsed && item.badge && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-caption font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'flex h-12 items-center gap-3 border-t border-border px-5 text-body-sm text-text-muted',
          'transition-colors hover:bg-surface-2 hover:text-text',
        )}
      >
        <ChevronsLeft
          className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')}
        />
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  )
}
