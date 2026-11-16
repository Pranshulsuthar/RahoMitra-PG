import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import { OTPInput } from './OTPInput'
import { AuthHeader } from './AuthHeader'
import { AuthButton } from './AuthButton'
import { AuthError } from './AuthError'
import { useCountdown } from '../../hooks/useCountdown'
import { OTP_RESEND_SECONDS } from '../../utils/authValidation'
import { apiClient, ApiError } from '../../api/client'

interface EmailOtpStepProps {
  email: string
  role?: 'student' | 'owner'
  onChangeEmail: () => void
  onVerified: (signupToken: string) => void
}

export function EmailOtpStep({ email, role = 'student', onChangeEmail, onVerified }: EmailOtpStepProps) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const { remaining, isRunning, start } = useCountdown(OTP_RESEND_SECONDS)

  const handleVerify = async () => {
    setError(null)
    setNotice(null)

    if (otp.length !== 6) {
      setError('Enter all six digits of the verification code.')
      return
    }

    setVerifying(true)
    try {
      const res = await apiClient.post<{ signupToken: string; message: string }>(
        '/auth/signup/verify-otp',
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }
      )

      setVerified(true)
      setTimeout(() => {
        onVerified(res.signupToken)
      }, 700)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to verify OTP. Please try again.')
      }
      setOtp('')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resending || isRunning) return
    setError(null)
    setNotice(null)
    setResending(true)

    try {
      await apiClient.post('/auth/signup/request-otp', {
        email: email.trim().toLowerCase(),
        role: role.toUpperCase(),
      })
      start()
      setNotice('A new verification code has been sent to your email.')
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to resend code. Please try again.')
      }
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div className="py-6 text-center">
        <div className="ring-pop mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-forest-soft">
          <CheckCircle2 className="h-10 w-10 text-forest" aria-hidden />
        </div>
        <p className="fade-scale-in font-display text-2xl text-forest">Email verified</p>
        <p className="fade-scale-in mt-2 text-sm text-ink-soft" style={{ animationDelay: '0.15s' }}>
          Proceeding to account details…
        </p>
      </div>
    )
  }

  return (
    <div>
      <AuthHeader
        eyebrow="Verification"
        title="Check your inbox"
        subtitle={
          <>
            We have sent a six-digit verification code to{' '}
            <strong className="font-semibold text-ink">{email}</strong>. Enter the code below to continue.
          </>
        }
      />

      {/* Email chip + change email */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory/70 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink-soft">
          <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
          <span className="truncate font-medium text-ink">{email}</span>
        </span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-forest transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Change
        </button>
      </div>

      <div className="fade-scale-in">
        <OTPInput
          value={otp}
          onChange={(value) => {
            setOtp(value)
            setError(null)
          }}
          invalid={Boolean(error)}
          disabled={verifying}
          onComplete={() => setError(null)}
        />
      </div>

      {error && <AuthError message={error} className="mt-4" />}
      {notice && !error && <AuthError message={notice} tone="info" className="mt-4" />}

      <div className="mt-6">
        <AuthButton onClick={handleVerify} loading={verifying} busyLabel="Verifying…">
          Verify Email
        </AuthButton>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-soft">
        <button
          type="button"
          onClick={onChangeEmail}
          className="inline-flex items-center gap-1.5 font-semibold text-forest transition-colors hover:text-gold-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Change email
        </button>

        {isRunning ? (
          <span className="tabular-nums text-ink-mute">
            Resend OTP in{' '}
            <span className="font-semibold text-forest">0:{String(remaining).padStart(2, '0')}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 font-semibold text-forest transition-colors hover:text-gold-dark disabled:opacity-50"
          >
            <RefreshCw className={resending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden />
            {resending ? 'Sending…' : 'Resend OTP'}
          </button>
        )}
      </div>
    </div>
  )
}
