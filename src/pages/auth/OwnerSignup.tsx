import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Home, LogIn } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { isEmail, isMobile, simulateLatency } from '../../utils/authDemo'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthHeader } from '../../components/auth/AuthHeader'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthInput } from '../../components/auth/AuthInput'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator'
import { AuthError } from '../../components/auth/AuthError'
import { AuthLink, AuthSuccess, StatusPill } from '../../components/auth/AuthSuccess'
import { FormTransition } from '../../components/auth/FormTransition'
import { StepProgress } from '../../components/auth/StepProgress'
import { EmailOtpStep } from '../../components/auth/EmailOtpStep'

type Step = 'email' | 'otp' | 'owner' | 'pg' | 'security' | 'submitted'
const STEP_LABELS = ['Email', 'Verify', 'Owner', 'PG', 'Security', 'Submitted']

const OWNER_INITIAL = { fullName: '', mobile: '' }
const PG_INITIAL = { name: '', type: '', city: '', address: '', count: '1' }
const CRED_INITIAL = { password: '', confirm: '', terms: 'false' }

type ErrorMap = Record<string, string>

export function OwnerSignup() {
  useDocumentTitle('Owner Sign Up')
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [errors, setErrors] = useState<ErrorMap>({})

  // Step 1 — email
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Step 3a — owner details
  const [owner, setOwner] = useState(OWNER_INITIAL)

  // Step 3b — PG details
  const [pg, setPg] = useState(PG_INITIAL)

  // Step 3c — account security
  const [cred, setCred] = useState(CRED_INITIAL)
  const [submitting, setSubmitting] = useState(false)

  const goTo = (next: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setErrors({})
    setStep(next)
  }

  const stepIndex = (['email', 'otp', 'owner', 'pg', 'security', 'submitted'] as Step[]).indexOf(step)

  // ------------------------------------------------------------ step 1
  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault()
    if (!isEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError(null)
    setSending(true)
    await simulateLatency(900)
    setSending(false)
    goTo('otp')
  }

  // ---------------------------------------------------------- step 3a
  const submitOwner = (event: FormEvent) => {
    event.preventDefault()
    const next: ErrorMap = {}
    if (owner.fullName.trim().length < 2) next.fullName = 'Owner full name is required.'
    if (!isMobile(owner.mobile)) next.mobile = 'Enter a valid 10-digit mobile number.'
    setErrors(next)
    if (Object.keys(next).length === 0) goTo('pg')
  }

  // ---------------------------------------------------------- step 3b
  const submitPg = (event: FormEvent) => {
    event.preventDefault()
    const next: ErrorMap = {}
    if (pg.name.trim().length < 3) next.name = 'PG / business name is required.'
    if (!pg.type) next.type = 'Select a PG type.'
    if (pg.city.trim().length < 2) next.city = 'City is required.'
    if (pg.address.trim().length < 10) next.address = 'Enter the complete address (10+ characters).'
    const count = Number(pg.count)
    if (!Number.isInteger(count) || count < 1 || count > 999) {
      next.count = 'Enter a number between 1 and 999.'
    }
    setErrors(next)
    if (Object.keys(next).length === 0) goTo('security')
  }

  // ---------------------------------------------------------- step 3c
  const submitSecurity = async (event: FormEvent) => {
    event.preventDefault()
    const next: ErrorMap = {}
    if (cred.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (cred.confirm !== cred.password) next.confirm = 'Passwords do not match.'
    if (cred.terms !== 'true') next.terms = 'Please accept the Terms & Conditions.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    await simulateLatency(1100)
    setSubmitting(false)
    goTo('submitted')
  }

  const onOwnerChange =
    (key: keyof typeof OWNER_INITIAL) => (event: ChangeEvent<HTMLInputElement>) => {
      setOwner((prev) => ({ ...prev, [key]: event.target.value }))
      setErrors((prev) => ({ ...prev, [key]: '' }))
    }

  const onPgChange = (key: keyof typeof PG_INITIAL) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setPg((prev) => ({ ...prev, [key]: event.target.value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  return (
    <AuthLayout>
      <div className="page-enter">
        <StepProgress steps={STEP_LABELS} current={stepIndex} />

        <AuthCard animate={false}>
          {/* --------------------------------------------------- EMAIL */}
          {step === 'email' && (
            <FormTransition key="email" direction={direction}>
              <AuthHeader
                eyebrow="Owner signup · Step 1"
                title="Bring your PG online"
                subtitle="Start with your email address — verification comes next."
              />
              <form onSubmit={handleSendOtp} noValidate>
                <AuthInput
                  id="owner-email"
                  label="Email Address"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  error={emailError ?? undefined}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setEmailError(null)
                  }}
                />
                <div className="mt-6">
                  <AuthButton type="submit" loading={sending} busyLabel="Sending OTP…">
                    Continue — Send OTP
                  </AuthButton>
                </div>
              </form>
              <p className="mt-4 text-center text-[11px] text-ink-mute">
                Frontend demo — no OTP email will actually be sent.
              </p>
              <p className="mt-6 text-center text-sm text-ink-soft">
                Already an approved owner? <AuthLink to="/login/owner">Login</AuthLink>
              </p>
            </FormTransition>
          )}

          {/* ------------------------------------------------------ OTP */}
          {step === 'otp' && (
            <FormTransition key="otp" direction={direction}>
              <EmailOtpStep
                email={email}
                onChangeEmail={() => goTo('email', 'backward')}
                onVerified={() => goTo('owner')}
              />
            </FormTransition>
          )}

          {/* ---------------------------------------------- OWNER DETAILS */}
          {step === 'owner' && (
            <FormTransition key="owner" direction={direction}>
              <AuthHeader
                eyebrow="Owner signup · Step 3 of 6"
                title="Owner details"
                subtitle="Basic contact information for the property owner."
              />
              <form onSubmit={submitOwner} noValidate className="space-y-5">
                <AuthInput
                  id="ownerName"
                  label="Owner Full Name"
                  required
                  autoComplete="name"
                  placeholder="Full name of the owner"
                  value={owner.fullName}
                  error={errors.fullName || undefined}
                  onChange={onOwnerChange('fullName')}
                />
                <AuthInput
                  id="ownerMobile"
                  label="Mobile Number"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={owner.mobile}
                  error={errors.mobile || undefined}
                  onChange={onOwnerChange('mobile')}
                  hint="Used to reach you about your application."
                />
                <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
                  <AuthButton type="submit">Continue to PG Details</AuthButton>
                  <AuthButton
                    type="button"
                    variant="outline"
                    fullWidth={false}
                    onClick={() => goTo('otp', 'backward')}
                    className="sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back
                  </AuthButton>
                </div>
              </form>
            </FormTransition>
          )}

          {/* ------------------------------------------------ PG DETAILS */}
          {step === 'pg' && (
            <FormTransition key="pg" direction={direction}>
              <AuthHeader
                eyebrow="Owner signup · Step 4 of 6"
                title="PG details"
                subtitle="Tell students what and where your property is."
              />
              <form onSubmit={submitPg} noValidate className="space-y-5">
                <AuthInput
                  id="pgName"
                  label="PG / Business Name"
                  required
                  placeholder="e.g. Shree Shyam Boys PG"
                  value={pg.name}
                  error={errors.name || undefined}
                  onChange={onPgChange('name')}
                />

                <div>
                  <label htmlFor="pgType" className="form-label">
                    PG Type<span className="ml-1 text-danger" aria-hidden>*</span>
                  </label>
                  <select
                    id="pgType"
                    value={pg.type}
                    onChange={onPgChange('type')}
                    aria-invalid={errors.type ? 'true' : undefined}
                    className="form-input"
                  >
                    <option value="">Select PG type</option>
                    <option value="Boys">Boys PG</option>
                    <option value="Girls">Girls PG</option>
                    <option value="Co-living">Co-living</option>
                  </select>
                  {errors.type && (
                    <span className="form-error fade-scale-in" role="alert">
                      {errors.type}
                    </span>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthInput
                    id="pgCity"
                    label="City"
                    required
                    placeholder="e.g. Jaipur"
                    value={pg.city}
                    error={errors.city || undefined}
                    onChange={onPgChange('city')}
                  />
                  <AuthInput
                    id="pgCount"
                    label="Number of PG Properties"
                    type="number"
                    required
                    inputMode="numeric"
                    min={1}
                    placeholder="e.g. 1"
                    value={pg.count}
                    error={errors.count || undefined}
                    onChange={onPgChange('count')}
                  />
                </div>

                <div>
                  <label htmlFor="pgAddress" className="form-label">
                    Complete Address<span className="ml-1 text-danger" aria-hidden>*</span>
                  </label>
                  <textarea
                    id="pgAddress"
                    rows={3}
                    maxLength={300}
                    placeholder="Full address with landmark and pin code"
                    value={pg.address}
                    onChange={onPgChange('address')}
                    aria-invalid={errors.address ? 'true' : undefined}
                    className="form-input resize-y"
                  />
                  {errors.address ? (
                    <span className="form-error fade-scale-in" role="alert">
                      {errors.address}
                    </span>
                  ) : (
                    <span className="mt-1.5 block text-[11px] text-ink-mute">
                      {pg.address.length}/300 characters
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
                  <AuthButton type="submit">Continue to Security</AuthButton>
                  <AuthButton
                    type="button"
                    variant="outline"
                    fullWidth={false}
                    onClick={() => goTo('owner', 'backward')}
                    className="sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back
                  </AuthButton>
                </div>
              </form>
            </FormTransition>
          )}

          {/* -------------------------------------------------- SECURITY */}
          {step === 'security' && (
            <FormTransition key="security" direction={direction}>
              <AuthHeader
                eyebrow="Owner signup · Step 5 of 6"
                title="Account security"
                subtitle="Create a password to secure your owner account."
              />
              <form onSubmit={submitSecurity} noValidate className="space-y-5">
                <div>
                  <PasswordInput
                    id="ownerPassword"
                    label="Password"
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={cred.password}
                    error={errors.password || undefined}
                    onChange={(event) => {
                      setCred((prev) => ({ ...prev, password: event.target.value }))
                      setErrors((prev) => ({ ...prev, password: '' }))
                    }}
                  />
                  <PasswordStrengthIndicator password={cred.password} className="mt-3" />
                </div>

                <PasswordInput
                  id="ownerConfirm"
                  label="Confirm Password"
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={cred.confirm}
                  error={errors.confirm || undefined}
                  onChange={(event) => {
                    setCred((prev) => ({ ...prev, confirm: event.target.value }))
                    setErrors((prev) => ({ ...prev, confirm: '' }))
                  }}
                />

                <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-soft">
                  <input
                    type="checkbox"
                    checked={cred.terms === 'true'}
                    onChange={(event) => {
                      setCred((prev) => ({ ...prev, terms: event.target.checked ? 'true' : 'false' }))
                      setErrors((prev) => ({ ...prev, terms: '' }))
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#173D32]"
                  />
                  <span>
                    I agree to the{' '}
                    <AuthLink to="/terms" className="text-[13px]">
                      Terms & Conditions
                    </AuthLink>{' '}
                    and{' '}
                    <AuthLink to="/privacy" className="text-[13px]">
                      Privacy Policy
                    </AuthLink>
                    .
                  </span>
                </label>
                {errors.terms && <AuthError message={errors.terms} />}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
                  <AuthButton type="submit" loading={submitting} busyLabel="Submitting…">
                    Submit Application
                  </AuthButton>
                  <AuthButton
                    type="button"
                    variant="outline"
                    fullWidth={false}
                    onClick={() => goTo('pg', 'backward')}
                    className="sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back
                  </AuthButton>
                </div>
              </form>
            </FormTransition>
          )}

          {/* ------------------------------------------------ SUBMITTED */}
          {step === 'submitted' && (
            <FormTransition key="submitted" direction={direction}>
              <AuthSuccess
                title="Your application has been submitted!"
                badge={<StatusPill>Pending Admin Approval</StatusPill>}
                message={
                  <>
                    Your PG owner application will be reviewed by the RahoMitra Super Admin. You
                    will be able to manage and publish your PG after approval.
                    <span className="mt-3 block rounded-xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-2.5 text-[12px] font-normal text-gold-dark">
                      <strong className="font-bold uppercase tracking-wide">Demo</strong> — no
                      application was actually stored; this is a frontend simulation.
                    </span>
                  </>
                }
              >
                <AuthButton onClick={() => navigate('/')}>
                  <Home className="h-4 w-4" aria-hidden />
                  Back to Home
                </AuthButton>
                <AuthButton variant="outline" onClick={() => navigate('/login/owner')}>
                  <LogIn className="h-4 w-4" aria-hidden />
                  Login
                </AuthButton>
                <p className="flex items-center justify-center gap-2 pt-1 text-[12px] text-ink-mute">
                  <Building2 className="h-3.5 w-3.5" aria-hidden />
                  One application can cover multiple PG properties.
                </p>
              </AuthSuccess>
            </FormTransition>
          )}
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
