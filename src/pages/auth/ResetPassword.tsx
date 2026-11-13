import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, ArrowLeft, Home, LogIn } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { simulateLatency } from '../../utils/authDemo'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthHeader } from '../../components/auth/AuthHeader'
import { AuthButton } from '../../components/auth/AuthButton'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator'
import { AuthError } from '../../components/auth/AuthError'
import { FormTransition } from '../../components/auth/FormTransition'

/**
 * Reset password screen (frontend simulation only).
 * The success state explicitly states that no password was changed.
 */
export function ResetPassword() {
  useDocumentTitle('Reset Password')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    await simulateLatency(900)
    setLoading(false)
    setDone(true)
  }

  return (
    <AuthLayout>
      <div className="page-enter">
        <AuthCard>
          <FormTransition key={done ? 'done' : 'form'}>
            {done ? (
              <div className="py-3 text-center">
                <div className="ring-pop mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-soft">
                  <Info className="h-10 w-10 text-forest" aria-hidden />
                </div>

                <h1 className="fade-scale-in text-[1.5rem] sm:text-2xl">Update simulated</h1>

                <div
                  className="fade-scale-in mx-auto mt-4 max-w-sm space-y-4 text-sm leading-relaxed text-ink-soft"
                  style={{ animationDelay: '0.15s' }}
                >
                  <p>
                    The form passed validation, but this is a{' '}
                    <strong className="font-semibold text-ink">frontend-only demo</strong> — no
                    actual account password was updated anywhere.
                  </p>
                  <div className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-left text-[12px] text-gold-dark">
                    Real password resets will be enabled once backend integration is complete.
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  <AuthButton onClick={() => navigate('/auth')}>
                    <LogIn className="h-4 w-4" aria-hidden />
                    Back to sign in
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
                      placeholder="Create a new password"
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

                  {Object.values(errors).some(Boolean) && (
                    <AuthError message="Please fix the highlighted fields to continue." />
                  )}

                  <AuthButton type="submit" loading={loading} busyLabel="Updating…">
                    Update Password
                  </AuthButton>
                </form>

                <p className="mt-6 text-center text-[12px] text-ink-mute">
                  <ArrowLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  Frontend demo — no password is stored or changed.
                </p>
              </>
            )}
          </FormTransition>
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
