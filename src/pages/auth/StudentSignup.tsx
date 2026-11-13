import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useForm } from '../../hooks/useForm'
import { compose, minLength, required } from '../../utils/validation'
import { isEmail, isMobile, simulateLatency } from '../../utils/authDemo'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthHeader } from '../../components/auth/AuthHeader'
import { AuthButton } from '../../components/auth/AuthButton'
import { AuthInput } from '../../components/auth/AuthInput'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator'
import { AuthError } from '../../components/auth/AuthError'
import { AuthLink } from '../../components/auth/AuthSuccess'
import { FormTransition } from '../../components/auth/FormTransition'
import { StepProgress } from '../../components/auth/StepProgress'
import { EmailOtpStep } from '../../components/auth/EmailOtpStep'

type Step = 'email' | 'otp' | 'details' | 'success'
const STEP_LABELS = ['Email', 'Verify', 'Details', 'Done']

const DETAILS_INITIAL = {
  fullName: '',
  mobile: '',
  college: '',
  city: '',
  password: '',
  confirmPassword: '',
  terms: 'false',
}

export function StudentSignup() {
  useDocumentTitle('Student Sign Up')
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  // ---- Step 1: email
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const goTo = (next: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setStep(next)
  }

  const handleSendOtp = async () => {
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

  // ---- Step 3: personal details
  // Latest form values stay available to the cross-field validators below.
  const valuesRef = useRef(DETAILS_INITIAL)

  const detailsForm = useForm(DETAILS_INITIAL, {
    fullName: compose(required('Full name is required.'), minLength(2, 'Enter your full name.')),
    mobile: (value) =>
      isMobile(value) ? undefined : 'Enter a valid 10-digit mobile number (starts with 6–9).',
    college: required('College / institution name is required.'),
    city: required('City is required.'),
    password: compose(
      required('Create a password.'),
      minLength(8, 'Password must be at least 8 characters.'),
    ),
    // Confirm + terms need access to the other fields — resolved via ref below.
    confirmPassword: (value) =>
      value === valuesRef.current.password ? undefined : 'Passwords do not match.',
    terms: (value) => (value === 'true' ? undefined : 'Please accept the Terms & Conditions.'),
  })

  valuesRef.current = detailsForm.values

  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : step === 'details' ? 2 : 3

  return (
    <AuthLayout>
      <div className="page-enter">
        <StepProgress steps={STEP_LABELS} current={stepIndex} />

        <AuthCard animate={false}>
          {step === 'email' && (
            <FormTransition key="email" direction={direction}>
              <AuthHeader
                eyebrow="Student signup · Step 1"
                title="Create your student account"
                subtitle="Start with your email address — we'll send a verification code next."
              />

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSendOtp()
                }}
                noValidate
              >
                <AuthInput
                  id="signup-email"
                  label="Email Address"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  error={emailError ?? undefined}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
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

              <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-mute">
                Frontend demo — no OTP email will actually be sent.
              </p>

              <p className="mt-6 text-center text-sm text-ink-soft">
                Already have an account?{' '}
                <AuthLink to="/login/student">Login</AuthLink>
              </p>
            </FormTransition>
          )}

          {step === 'otp' && (
            <FormTransition key="otp" direction={direction}>
              <EmailOtpStep
                email={email}
                onChangeEmail={() => goTo('email', 'backward')}
                onVerified={() => goTo('details')}
              />
            </FormTransition>
          )}

          {step === 'details' && (
            <FormTransition key="details" direction={direction}>
              <AuthHeader
                eyebrow="Student signup · Step 3"
                title="Tell us about yourself"
                subtitle="A few final details and your student account setup is complete."
              />

              <form
                onSubmit={detailsForm.handleSubmit(() => goTo('success'))}
                noValidate
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthInput
                    id="fullName"
                    label="Full Name"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    value={detailsForm.values.fullName}
                    error={detailsForm.submitted ? detailsForm.errors.fullName : undefined}
                    onChange={detailsForm.handleChange}
                  />
                  <AuthInput
                    id="mobile"
                    label="Mobile Number"
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    value={detailsForm.values.mobile}
                    error={detailsForm.submitted ? detailsForm.errors.mobile : undefined}
                    onChange={detailsForm.handleChange}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthInput
                    id="college"
                    label="College / Institution Name"
                    required
                    placeholder="e.g. University of Engineering"
                    value={detailsForm.values.college}
                    error={detailsForm.submitted ? detailsForm.errors.college : undefined}
                    onChange={detailsForm.handleChange}
                  />
                  <AuthInput
                    id="city"
                    label="City"
                    required
                    autoComplete="address-level2"
                    placeholder="e.g. Jaipur"
                    value={detailsForm.values.city}
                    error={detailsForm.submitted ? detailsForm.errors.city : undefined}
                    onChange={detailsForm.handleChange}
                  />
                </div>

                <div>
                  <PasswordInput
                    id="password"
                    label="Password"
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={detailsForm.values.password}
                    error={detailsForm.submitted ? detailsForm.errors.password : undefined}
                    onChange={detailsForm.handleChange}
                  />
                  <PasswordStrengthIndicator
                    password={detailsForm.values.password}
                    className="mt-3"
                  />
                </div>

                <PasswordInput
                  id="confirmPassword"
                  label="Confirm Password"
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={detailsForm.values.confirmPassword}
                  error={detailsForm.submitted ? detailsForm.errors.confirmPassword : undefined}
                  onChange={detailsForm.handleChange}
                />

                <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-soft">
                  <input
                    type="checkbox"
                    checked={detailsForm.values.terms === 'true'}
                    onChange={(event) =>
                      detailsForm.setField('terms', event.target.checked ? 'true' : 'false')
                    }
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
                {detailsForm.submitted && detailsForm.errors.terms && (
                  <AuthError message={detailsForm.errors.terms} />
                )}

                <div className="pt-1">
                  <AuthButton type="submit">Create Student Account</AuthButton>
                </div>
              </form>
            </FormTransition>
          )}

          {step === 'success' && (
            <FormTransition key="success" direction={direction}>
              <div className="py-4 text-center">
                <div className="ring-pop relative mx-auto mb-6 h-24 w-24">
                  <div className="absolute inset-0 rounded-full bg-forest-soft" aria-hidden />
                  <svg viewBox="0 0 48 48" className="relative h-24 w-24 text-forest" fill="none" aria-hidden>
                    <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
                    <path
                      d="M15 24.5l6.5 6.5L33 18.5"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="check-draw"
                    />
                  </svg>
                </div>

                <div className="fade-scale-in" style={{ animationDelay: '0.25s' }}>
                  <h1 className="text-[1.6rem] sm:text-3xl">Your account is ready!</h1>
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
                    Welcome to RahoMitra, {detailsForm.values.fullName || 'student'}! You can now
                    sign in and start exploring PG accommodations that fit your budget.
                  </p>
                  <p className="mx-auto mt-4 max-w-sm rounded-xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
                    <strong className="font-bold uppercase tracking-wide">Demo confirmation</strong>{' '}
                    — no account was actually created or saved. This is a frontend simulation.
                  </p>

                  <div className="mt-7 space-y-3">
                    <AuthButton onClick={() => navigate('/login/student')}>
                      Continue to Student Login
                    </AuthButton>
                    <AuthLink to="/" className="block text-sm">
                      Back to homepage
                    </AuthLink>
                  </div>
                </div>
              </div>
            </FormTransition>
          )}
        </AuthCard>
      </div>
    </AuthLayout>
  )
}
