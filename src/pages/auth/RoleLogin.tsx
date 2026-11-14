import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Info, Lock, GraduationCap, Building2, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useForm } from '../../hooks/useForm'
import { compose, minLength, required } from '../../utils/validation'
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD, DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD, isEmail, simulateLatency } from '../../utils/authDemo'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthInput } from '../../components/auth/AuthInput'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { AuthError } from '../../components/auth/AuthError'
import { AuthLink } from '../../components/auth/AuthSuccess'
import { FormTransition } from '../../components/auth/FormTransition'
import { cn } from '../../utils/cn'

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

/**
 * Shared premium login screen for all three roles.
 * Frontend-only: validation + loading + an honest demo-mode notice.
 */
export function RoleLogin({ role }: { role: LoginRole }) {
  const config = CONFIG[role]
  const Icon = config.icon
  useDocumentTitle(config.title)
  const navigate = useNavigate()

  const [demoNotice, setDemoNotice] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
    const ok = form.validate()
    if (!ok) return
    setSubmitting(true)
    await simulateLatency(950)
    setSubmitting(false)

    if (role === 'admin') {
      // Frontend-only credential comparison — no API, database or session.
      const emailOk = form.values.email.trim().toLowerCase() === DEMO_ADMIN_EMAIL
      const passwordOk = form.values.password === DEMO_ADMIN_PASSWORD
      if (emailOk && passwordOk) {
        setAuthError(null)
        navigate('/admin/dashboard')
      } else {
        setAuthError(
          'Invalid demo credentials. Use the DEMO MODE credentials shown below (frontend comparison only).',
        )
      }
      return
    }

    if (role === 'owner') {
      // Frontend-only credential comparison — no API, database or session.
      const emailOk = form.values.email.trim().toLowerCase() === DEMO_OWNER_EMAIL
      const passwordOk = form.values.password === DEMO_OWNER_PASSWORD
      if (emailOk && passwordOk) {
        setAuthError(null)
        navigate('/owner/dashboard')
      } else {
        setAuthError(
          'Invalid demo credentials. Use the DEMO MODE credentials shown below (frontend comparison only).',
        )
      }
      return
    }

    if (role === 'student') {
      // Frontend-only credential comparison — no API, database or session.
      const emailOk = form.values.email.trim().toLowerCase() === DEMO_STUDENT_EMAIL
      const passwordOk = form.values.password === DEMO_STUDENT_PASSWORD
      if (emailOk && passwordOk) {
        setAuthError(null)
        navigate('/student/dashboard')
      } else {
        setAuthError(
          'Those demo credentials don’t match. Try the DEMO MODE credentials shown below (frontend comparison only).',
        )
      }
      return
    }

    setDemoNotice(true)
  }

  return (
    <AuthLayout>
      <div className="page-enter">
        <AuthCard>
          <FormTransition key={demoNotice ? 'notice' : 'form'} direction="forward">
            {demoNotice ? (
              <div className="py-3 text-center">
                <div className="ring-pop mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gold-soft">
                  <Info className="h-10 w-10 text-gold-dark" aria-hidden />
                </div>
                <h1 className="fade-scale-in text-[1.5rem] sm:text-2xl">Demo sign-in</h1>
                <p
                  className="fade-scale-in mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft"
                  style={{ animationDelay: '0.15s' }}
                >
                  No authentication request was made — this build is{' '}
                  <strong className="font-semibold text-ink">frontend-only</strong>. You have{' '}
                  <strong className="font-semibold text-ink">not</strong> been signed in, and no
                  dashboard access is granted. Real sign-in arrives with backend integration.
                </p>
                <div className="mt-7 space-y-3">
                  <AuthButton onClick={() => setDemoNotice(false)}>
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back to login form
                  </AuthButton>
                  <AuthLink to="/" className="block text-sm">
                    Back to homepage
                  </AuthLink>
                </div>
              </div>
            ) : (
              <>
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

                {(role === 'admin' || role === 'owner' || role === 'student') && (
                  <div className="mb-6 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3.5">
                    <p className="mb-2 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold-dark">
                      <KeyRound className="h-3.5 w-3.5" aria-hidden />
                      Demo mode — local UI credentials
                    </p>
                    <ul className="space-y-1 text-[13px] text-ink-soft">
                      <li className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">Email:</span>
                        <code className="rounded bg-white px-2 py-0.5 font-mono text-[12.5px] text-forest">
                          {role === 'admin'
                            ? DEMO_ADMIN_EMAIL
                            : role === 'owner'
                              ? DEMO_OWNER_EMAIL
                              : DEMO_STUDENT_EMAIL}
                        </code>
                      </li>
                      <li className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">Password:</span>
                        <code className="rounded bg-white px-2 py-0.5 font-mono text-[12.5px] text-forest">
                          {role === 'admin'
                            ? DEMO_ADMIN_PASSWORD
                            : role === 'owner'
                              ? DEMO_OWNER_PASSWORD
                              : DEMO_STUDENT_PASSWORD}
                        </code>
                      </li>
                    </ul>
                    <p className="mt-2 text-[11px] leading-relaxed text-gold-dark">
                      Frontend-only comparison for local demonstration — never a production
                      credential.
                    </p>
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
              </>
            )}
          </FormTransition>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
