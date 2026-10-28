import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Store, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useI18n } from '@/context/I18nContext'
import { ApiError } from '@/lib/api'

export function Login() {
  const { user, login, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname?: string } } }

  const [email, setEmail] = useState('admin@dokanpro.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (authLoading) return null
  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      console.log("Email :", email, "Password :", password)
      toast.success('Welcome back!')
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed'
      toast.error('Sign-in failed', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-bg to-secondary/10" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
            <Store className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-h1 text-text">DokanPro</h1>
            <p className="mt-1 text-body-sm text-text-muted">{t('auth.welcomeSub')}</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <div>
            <h2 className="text-h3 text-text">{t('auth.welcome')}</h2>
            <p className="mt-1 text-body-sm text-text-muted">{t('auth.signin')}</p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                {t('auth.email')}
              </span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="admin@dokanpro.com"
                size="lg"
                required
                autoComplete="email"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-caption font-semibold uppercase text-text-muted">
                {t('auth.password')}
              </span>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-text"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                placeholder="••••••••"
                size="lg"
                required
                autoComplete="current-password"
              />
            </label>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {t('auth.signin')}
          </Button>

          <div className="rounded-sm border border-dashed border-border bg-surface-2/40 p-3 text-caption text-text-muted">
            <p className="font-semibold text-text">Demo accounts</p>
            <p className="mt-1">
              admin@dokanpro.com / admin123
              <br />
              staff@dokanpro.com / staff123
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
