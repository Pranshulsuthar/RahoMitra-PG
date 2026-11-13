import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { OTPInput } from './OTPInput'
import { AuthHeader } from './AuthHeader'
import { AuthButton } from './AuthButton'
import { AuthError } from './AuthError'
import { useCountdown } from '../../hooks/useCountdown'
import { DEMO_OTP, OTP_RESEND_SECONDS, simulateLatency } from '../../utils/authDemo'

interface EmailOtpStepProps {
  email: string
  onChangeEmail: () => void
  onVerified: () => void
}

/**
 * Reusable simulated OTP verification step (student + owner signup).
 * Nothing is sent anywhere: the demo code is 123456.
 */
export function EmailOtpStep({ email, onChangeEmail, onVerified }: EmailOtpStepProps) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const { remaining, isRunning, start } = useCountdown(OTP_RESEND_SECONDS)

  const handleVerify = async () => {
    setError(null)
    if (otp.length !== 6) {
      setError('Enter all six digits of the OTP.')
      return
    }
    setVerifying(true)
    await simulateLatency(750)
    setVerifying(false)

    if (otp === DEMO_OTP) {
      setVerified(true)
      await simulateLatency(950)
      onVerified()
    } else {
      setError(`Incorrect demo OTP. Use ${DEMO_OTP} to continue.`)
      setOtp('')
    }
  }

  const handleResend = () => {
    start()
    setNotice(`Demo mode — no email was sent. The OTP remains ${DEMO_OTP}.`)
    setError(null)
  }

  if (verified) {
    return (
      <div className="py-6 text-center">
        <div className="ring-pop mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-forest-soft">
          <CheckCircle2 className="h-10 w-10 text-forest" aria-hidden />
        </div>
        <p className="fade-scale-in font-display text-2xl text-forest">Email verified</p>
        <p className="fade-scale-in mt-2 text-sm text-ink-soft" style={{ animationDelay: '0.15s' }}>
          Verifying your details…
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
            We&apos;d normally email a six-digit code to{' '}
            <strong className="font-semibold text-ink">{email}</strong>. This build simulates
            verification — no email is actually sent.
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

      {/* Demo indicator */}
      <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-bold uppercase tracking-wide">Demo mode</strong> — use OTP{' '}
          <strong className="font-mono text-[13px] tracking-widest">{DEMO_OTP}</strong> to simulate
          verification.
        </span>
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
            className="inline-flex items-center gap-1.5 font-semibold text-forest transition-colors hover:text-gold-dark"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Resend OTP
          </button>
        )}
      </div>
    </div>
  )
}
