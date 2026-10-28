import { useState, type FormEvent } from 'react'
import { Sun, Moon, Monitor, Languages, User, Lock, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useI18n, type Lang } from '@/context/I18nContext'
import type { Theme } from '@/types'
import { cn } from '@/lib/utils'

export function Settings() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useI18n()
  const toast = useToast()

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  const onChangePassword = (e: FormEvent) => {
    e.preventDefault()
    if (newPwd.length < 6) {
      toast.error('Password too short', 'Use at least 6 characters')
      return
    }
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match')
      return
    }
    if (!currentPwd) {
      toast.error('Enter your current password')
      return
    }
    setPwdSaving(true)
    // Backend endpoint not yet exposed — UI-only stub
    window.setTimeout(() => {
      setPwdSaving(false)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      toast.info('Coming soon', 'Password change endpoint not yet exposed by backend')
    }, 600)
  }

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const languages: { value: Lang; label: string; native: string }[] = [
    { value: 'en', label: 'English', native: 'English' },
    { value: 'bn', label: 'Bangla', native: 'বাংলা' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <header>
        <h1 className="text-h1 text-text">Settings</h1>
        <p className="mt-1 text-body text-text-muted">
          Manage your profile, security, and preferences
        </p>
      </header>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-soft text-primary">
              <User className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Account information from your sign-in</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-text">{user.name}</p>
                <p className="truncate text-body-sm text-text-muted">{user.email}</p>
                {user.phone && (
                  <p className="text-body-sm text-text-muted">{user.phone}</p>
                )}
              </div>
              <Badge tone={user.role === 'admin' ? 'primary' : 'neutral'} dot>
                {user.role === 'admin' ? 'Admin' : 'Staff'}
              </Badge>
            </div>
          ) : (
            <p className="text-body-sm text-text-muted">Not signed in</p>
          )}
          <div className="mt-5 flex justify-end border-t border-border pt-4">
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-soft text-primary">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Use a strong password unique to this account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                Current password
              </span>
              <Input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                New password
              </span>
              <Input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                Confirm new password
              </span>
              <Input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={pwdSaving} leftIcon={<ShieldCheck className="h-4 w-4" />}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-soft text-primary">
              <Sun className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Theme preference for this device</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => {
              const active = theme === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTheme(t.value)
                    toast.success(`Theme: ${t.label}`)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-sm border px-4 py-4 transition-all duration-150',
                    active
                      ? 'border-primary bg-primary-soft text-primary shadow-sm'
                      : 'border-border bg-surface text-text-muted hover:border-text-faint hover:text-text',
                  )}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="text-body-sm font-medium">{t.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary-soft text-primary">
              <Languages className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Language</CardTitle>
              <CardDescription>Interface language for navigation and labels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((l) => {
              const active = lang === l.value
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => {
                    setLang(l.value)
                    toast.success(`Language: ${l.label}`)
                  }}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-sm border px-4 py-3 transition-all duration-150',
                    active
                      ? 'border-primary bg-primary-soft text-primary shadow-sm'
                      : 'border-border bg-surface text-text-muted hover:border-text-faint hover:text-text',
                  )}
                >
                  <span className="text-body-sm font-semibold">{l.label}</span>
                  <span className="text-caption">{l.native}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
