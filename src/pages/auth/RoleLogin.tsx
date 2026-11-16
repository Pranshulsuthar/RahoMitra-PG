import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, GraduationCap, Building2, ShieldCheck } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useForm } from '../../hooks/useForm'
import { compose, minLength, required } from '../../utils/validation'
import { isEmail } from '../../utils/authValidation'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthInput } from '../../components/auth/AuthInput'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { AuthError } from '../../components/auth/AuthError'
import { AuthLink } from '../../components/auth/AuthSuccess'
import { cn } from '../../utils/cn'
import { useAuth, type AuthRole } from '../../context/AuthContext'
import { ApiError } from '../../api/client'
import { getSafeReturnUrl } from '../../components/auth/ProtectedRoute'

export type LoginRole = 'student' | 'owner' | 'admin'

interface RoleConfig {
  eyebrow: string
  title: string
  subtitle: string
  notice?: string
  rememberMe: boolean
  forgotPassword: boolean
  signupPrompt?: { prefix: string; linkLabel: string; to: string }
  icon: typeof GraduationCap
}

const CONFIG: Record<LoginRole, RoleConfig> = {
  student: {
    eyebrow: 'Student access',
    title: 'Student Login',
    subtitle: 'Welcome back — sign in to view your PG dashboard, room and notices.',
    rememberMe: true,
    forgotPassword: true,
    signupPrompt: {
      prefix: "Don't have an account?",
      linkLabel: 'Sign Up',
      to: '/signup/student',
    },
    icon: GraduationCap,
  },
  owner: {
    eyebrow: 'PG owner access',
    title: 'PG Owner Login',
    subtitle: 'Sign in to manage your properties and enquiries.',
    notice: 'Only approved PG owners can access the owner dashboard.',
    rememberMe: true,
    forgotPassword: true,
    signupPrompt: {
      prefix: 'New here?',
      linkLabel: 'Register your PG',
      to: '/signup/owner',
    },
    icon: Building2,
  },
  admin: {
    eyebrow: 'Restricted area',
    title: 'Admin Login',
    subtitle: 'Sign in to the RahoMitra administration console.',
    notice: 'Restricted platform administration area.',
    rememberMe: false,
    forgotPassword: false,
    icon: ShieldCheck,
  },
}

const INITIAL = { email: '', password: '' }

export function RoleLogin({ role }: { role: LoginRole }) {
  const config = CONFIG[role]
  const Icon = config.icon
  useDocumentTitle(config.title)

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const form = useForm(INITIAL, {
    email: compose(required('Email address is required.'), (value) =>
      isEmail(value) ? undefined : 'Enter a valid email address.',
    ),
    password: compose(
      required('Password is required.'),
      minLength(6, 'Password must be at least 6 characters.'),
    ),
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    // Prevent double submissions
    if (submitting) return

    const ok = form.validate()
    if (!ok) return

    setSubmitting(true)
    setAuthError(null)

    try {
      await login({
        email: form.values.email.trim(),
        password: form.values.password,
        role: role as AuthRole,
        rememberMe,
      })

      // Safe return-URL validation
      const stateFrom = (location.state as { from?: { pathname?: string } })?.from?.pathname
      const safeReturn = getSafeReturnUrl(stateFrom)

      if (safeReturn) {
        navigate(safeReturn, { replace: true })
        return
      }

      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'owner') navigate('/owner/dashboard', { replace: true })
      else navigate('/student/dashboard', { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setAuthError('Invalid email or password.')
        } else if (err.code === 'ACCOUNT_LOCKED') {
          setAuthError(err.message || 'Account locked due to multiple failed attempts. Please try again later.')
        } else if (err.code === 'OWNER_PENDING_APPROVAL') {
          setAuthError('Your PG Owner application is currently under review by admin.')
        } else if (err.code === 'OWNER_REJECTED') {
          setAuthError('Your PG Owner application was rejected. Please contact platform support.')
        } else if (err.code === 'ACCOUNT_SUSPENDED') {
          setAuthError('Your account has been suspended. Please contact platform support.')
        } else if (err.code === 'NETWORK_ERROR' || err.code === 'REQUEST_TIMEOUT') {
          setAuthError(err.message)
        } else {
          setAuthError(err.message || 'An error occurred during login.')
        }
      } else {
        setAuthError('Unable to log in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="page-enter">
        <AuthCard>
          <div className="mb-6 flex items-center gap-3.5">
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl',
                role === 'admin' ? 'bg-ink text-gold' : 'bg-forest-soft text-forest',
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                {config.eyebrow}
              </p>
              <h1 className="mt-0.5 text-2xl">{config.title}</h1>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-ink-soft">{config.subtitle}</p>

          {config.notice && (
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-line bg-ivory/70 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <span>{config.notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <AuthInput
              id={`${role}-email`}
              name="email"
              label={role === 'admin' ? 'Admin Email' : 'Registered Email Address'}
              type="email"
              required
              autoComplete="username"
              placeholder="you@example.com"
              value={form.values.email}
              error={form.submitted ? form.errors.email : undefined}
              onChange={(event) => {
                setAuthError(null)
                form.handleChange(event)
              }}
            />

            <PasswordInput
              id={`${role}-password`}
              name="password"
              label="Password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.values.password}
              error={form.submitted ? form.errors.password : undefined}
              onChange={(event) => {
                setAuthError(null)
                form.handleChange(event)
              }}
            />

            {authError && <AuthError message={authError} />}

            {(config.rememberMe || config.forgotPassword) && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                {config.rememberMe ? (
                  <label className="flex cursor-pointer items-center gap-2.5 text-ink-soft">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-[#173D32]"
                    />
                    Remember me
                  </label>
                ) : (
                  <span />
                )}
                {config.forgotPassword && (
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-forest transition-colors hover:text-gold-dark"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
            )}

            <AuthButton type="submit" loading={submitting} busyLabel="Signing in…">
              Login
            </AuthButton>
          </form>

          {config.signupPrompt && (
            <p className="mt-6 text-center text-sm text-ink-soft">
              {config.signupPrompt.prefix}{' '}
              <AuthLink to={config.signupPrompt.to}>{config.signupPrompt.linkLabel}</AuthLink>
            </p>
          )}
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
