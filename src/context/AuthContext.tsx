import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { api, tokenStore } from '@/lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'staff'
  active: boolean
  lastLoginAt?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => tokenStore.get())
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setToken(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>('/api/auth/me', { silent401: true })
      setUser(me)
    } catch {
      logout()
    }
  }, [logout])

  // Bootstrap: if token exists, validate via /me
  useEffect(() => {
    let cancelled = false
    const t = tokenStore.get()
    if (!t) {
      setLoading(false)
      return
    }
    api
      .get<AuthUser>('/api/auth/me', { silent401: true })
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [logout])

  // Listen for 401 events from api client
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password,
    })
    tokenStore.set(res.token)
    setToken(res.token)
    setUser(res.user)
    return res.user
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
