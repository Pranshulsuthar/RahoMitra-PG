import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Info, ArrowLeft, KeyRound } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { isEmail, simulateLatency } from '../../utils/authDemo'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthHeader } from '../../components/auth/AuthHeader'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthInput } from '../../components/auth/AuthInput'
import { AuthLink } from '../../components/auth/AuthSuccess'
import { FormTransition } from '../../components/auth/FormTransition'
import { StepProgress } from '../../components/auth/StepProgress'

/**
 * Password recovery (frontend simulation only).
 * Step 2 never claims that a recovery email was sent.
 */
export function ForgotPassword() {
  useDocumentTitle('Forgot Password')

  const [step, setStep] = useState<'email' | 'confirm'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isEmail(email)) {
      setError('Enter a valid registered email address.')
      return
    }
    setError(null)
    setLoading(true)
    await simulateLatency(850)
    setLoading(false)
    setStep('confirm')
  }

  return (
    <AuthLayout>
      <div className="page-enter">
        <StepProgress
          steps={['Enter email', 'Confirmation']}
          current={step === 'email' ? 0 : 1}
        />

        <AuthCard animate={false}>
          {step === 'email' ? (
            <FormTransition key="email">
              <AuthHeader
                eyebrow="Account recovery"
                title="Forgot your password?"
                subtitle="Enter the email registered with your RahoMitra account."
              />
              <form onSubmit={handleSubmit} noValidate>
                <AuthInput
                  id="recovery-email"
                  label="Registered Email Address"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  error={error ?? undefined}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setEmail(event.target.value)
                    setError(null)
                  }}
                />
                <div className="mt-6">
                  <AuthButton type="submit" loading={loading} busyLabel="Checking…">
                    Continue
                  </AuthButton>
                </div>
              </form>
              <p className="mt-6 text-center text-sm text-ink-soft">
                Remembered it? <AuthLink to="/auth">Back to sign in</AuthLink>
              </p>
            </FormTransition>
          ) : (
            <FormTransition key="confirm" direction="forward">
              <div className="py-3 text-center">
                <div className="ring-pop mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-soft">
                  <KeyRound className="h-10 w-10 text-forest" aria-hidden />
                </div>

                <h1 className="fade-scale-in text-[1.5rem] sm:text-2xl">
                  Recovery simulation complete
                </h1>

                <div
                  className="fade-scale-in mx-auto mt-4 max-w-sm space-y-4 text-sm leading-relaxed text-ink-soft"
                  style={{ animationDelay: '0.15s' }}
                >
                  <p>
                    This is a <strong className="font-semibold text-ink">frontend demo</strong> — no
                    recovery email was sent and no request left your browser. In the live product, a
                    secure reset link would be emailed to{' '}
                    <strong className="font-semibold text-ink">{email}</strong>.
                  </p>

                  <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-left text-[12px] text-gold-dark">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      Nothing was sent — you can still explore the reset screen below to see the
                      interface.
                    </span>
                  </div>
                </div>

                <div className="fade-scale-in mt-7 space-y-3" style={{ animationDelay: '0.25s' }}>
                  <AuthButton onClick={() => setStep('email')} variant="outline">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Try another email
                  </AuthButton>
                  <AuthLink to="/reset-password" className="block text-sm">
                    Open Reset Password screen (demo)
                  </AuthLink>
                </div>
              </div>
            </FormTransition>
          )}
        </AuthCard>

        <p className="mt-6 flex items-center justify-center gap-2 text-[12px] text-ink-mute">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          <Link to="/" className="transition-colors hover:text-forest">
            Back to homepage
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
