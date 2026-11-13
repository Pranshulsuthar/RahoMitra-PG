import { useMemo } from 'react'
import { cn } from '../../utils/cn'

export type PasswordScore = 0 | 1 | 2 | 3 | 4

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = [
  'bg-danger/30',
  'bg-danger',
  'bg-gold',
  'bg-gold-dark',
  'bg-forest',
]

/** 0–4 password strength score based on length and character variety. */
export function passwordScore(password: string): PasswordScore {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^\w\s]/.test(password)) score++
  if (password.length < 8) score = Math.min(score, 1)
  return Math.min(4, score) as PasswordScore
}

export function PasswordStrengthIndicator({
  password,
  className,
}: {
  password: string
  className?: string
}) {
  const score = useMemo(() => passwordScore(password), [password])
  const visible = password.length > 0

  return (
    <div
      className={cn('transition-opacity duration-300', visible ? 'opacity-100' : 'opacity-0', className)}
      aria-live="polite"
    >
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              score >= step ? COLORS[score] : 'bg-line',
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-ink-soft">
        Password strength:{' '}
        <span
          className={cn(
            'font-semibold',
            score <= 1 ? 'text-danger' : score === 2 ? 'text-gold-dark' : 'text-forest',
          )}
        >
          {LABELS[score]}
        </span>
        <span className="text-ink-mute"> · use 8+ characters with a mix of letters & numbers</span>
      </p>
    </div>
  )
}
