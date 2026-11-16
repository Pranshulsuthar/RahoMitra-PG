import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Home, LogIn } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthHeader } from '../../components/auth/AuthHeader'
import { AuthButton } from '../../components/auth/AuthButton'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator'
import { AuthError } from '../../components/auth/AuthError'
import { FormTransition } from '../../components/auth/FormTransition'
import { apiClient, ApiError } from '../../api/client'
import { AuthLink } from '../../components/auth/AuthSuccess'

export function ResetPassword() {
  useDocumentTitle('Reset Password')
  const navigate = useNavigate()

  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // 1. Read token from URL query parameter, then strip it from address bar for security
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlToken = searchParams.get('token')

    if (urlToken) {
      setToken(urlToken)
      // Strip token parameter from the browser history and address bar immediately
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      setSubmitError('Invalid or missing password reset token. Please request a new reset link.')
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)

    if (!token) {
      setSubmitError('Password reset link is invalid or expired. Please request a new one.')
      return
    }

    const next: typeof errors = {}
    if (password.length < 8) next.password = 'Password must be at least 8 characters long.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password,
      })
      setDone(true)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Failed to reset password. The link may have expired.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="page-enter">
        <AuthCard>
          <FormTransition key={done ? 'done' : 'form'}>
            {done ? (
              <div className="py-3 text-center">
                <div className="ring-pop mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-soft">
                  <CheckCircle2 className="h-10 w-10 text-forest" aria-hidden />
                </div>

                <h1 className="fade-scale-in text-[1.5rem] sm:text-2xl">Password updated!</h1>

                <div
                  className="fade-scale-in mx-auto mt-4 max-w-sm space-y-4 text-sm leading-relaxed text-ink-soft"
                  style={{ animationDelay: '0.15s' }}
                >
                  <p>
                    Your RahoMitra account password has been successfully reset. Any other active
                    sessions have been logged out for security.
                  </p>
                </div>

                <div className="mt-7 space-y-3">
                  <AuthButton onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4" aria-hidden />
                    Sign in with new password
                  </AuthButton>
                  <AuthButton variant="outline" onClick={() => navigate('/')}>
                    <Home className="h-4 w-4" aria-hidden />
                    Back to Home
                  </AuthButton>
                </div>
              </div>
            ) : (
              <>
                <AuthHeader
                  eyebrow="Account recovery · Step 2"
                  title="Set a new password"
                  subtitle="Choose a strong password for your RahoMitra account."
                />

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <PasswordInput
                      id="new-password"
                      label="New Password"
                      required
                      autoComplete="new-password"
                      placeholder="Create a new password (min 8 chars)"
                      value={password}
                      error={errors.password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setErrors((prev) => ({ ...prev, password: undefined }))
                      }}
                    />
                    <PasswordStrengthIndicator password={password} className="mt-3" />
                  </div>

                  <PasswordInput
                    id="confirm-new-password"
                    label="Confirm New Password"
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter the new password"
                    value={confirm}
                    error={errors.confirm}
                    onChange={(event) => {
                      setConfirm(event.target.value)
                      setErrors((prev) => ({ ...prev, confirm: undefined }))
                    }}
                  />

                  {submitError && <AuthError message={submitError} />}

                  <AuthButton type="submit" loading={loading} busyLabel="Updating…">
                    Update Password
                  </AuthButton>
                </form>

                <p className="mt-6 text-center text-sm text-ink-soft">
                  Remember your password? <AuthLink to="/auth">Sign in</AuthLink>
                </p>
              </>
            )}
          </FormTransition>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
