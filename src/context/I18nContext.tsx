import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'bn'

const dict = {
  en: {
    'nav.main': 'Main',
    'nav.catalog': 'Catalog',
    'nav.insights': 'Insights',
    'nav.system': 'System',
    'nav.dashboard': 'Dashboard',
    'nav.pos': 'POS Sale',
    'nav.products': 'Products',
    'nav.inventory': 'Inventory',
    'nav.customers': 'Customers',
    'nav.orders': 'Orders',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.subscription': 'Subscription',
    'nav.admin': 'Admin',
    'nav.adminSubscriptions': 'Subscriptions',
    'topbar.search': 'Search products, orders, customers...',
    'topbar.logout': 'Sign out',
    'auth.signin': 'Sign in',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.welcome': 'Welcome back',
    'auth.welcomeSub': 'Sign in to continue to DokanPro',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.saving': 'Saving...',
  },
  bn: {
    'nav.main': 'প্রধান',
    'nav.catalog': 'ক্যাটালগ',
    'nav.insights': 'রিপোর্ট',
    'nav.system': 'সিস্টেম',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.pos': 'বিক্রি',
    'nav.products': 'পণ্য',
    'nav.inventory': 'স্টক',
    'nav.customers': 'কাস্টমার',
    'nav.orders': 'অর্ডার',
    'nav.reports': 'রিপোর্ট',
    'nav.settings': 'সেটিংস',
    'nav.subscription': 'সাবস্ক্রিপশন',
    'nav.admin': 'অ্যাডমিন',
    'nav.adminSubscriptions': 'সাবস্ক্রিপশন',
    'topbar.search': 'পণ্য, অর্ডার, কাস্টমার খুঁজুন...',
    'topbar.logout': 'বের হোন',
    'auth.signin': 'লগইন করুন',
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.welcome': 'স্বাগতম',
    'auth.welcomeSub': 'DokanPro এ চালিয়ে যেতে লগইন করুন',
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.loading': 'লোড হচ্ছে...',
    'common.saving': 'সংরক্ষণ হচ্ছে...',
  },
} as const

type Key = keyof (typeof dict)['en']

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Key) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = 'dokanpro-lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem(STORAGE_KEY) as Lang) || 'en'
  })

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const t = useCallback((key: Key) => dict[lang][key] ?? key, [lang])

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be inside I18nProvider')
  return ctx
}
