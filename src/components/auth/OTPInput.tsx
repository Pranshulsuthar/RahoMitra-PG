import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { cn } from '../../utils/cn'

interface OTPInputProps {
  /** Controlled six-digit value. */
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  onComplete?: (value: string) => void
}

/**
 * Six-box OTP input:
 * • numeric only, auto-advance on type
 * • backspace moves focus back (clears the current box)
 * • pasting a six-digit code fills every box
 * • boxes stagger in with a subtle scale animation
 */
export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  invalid = false,
  autoFocus = true,
  onComplete,
}: OTPInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const digits = value.padEnd(length, ' ').slice(0, length).split('')

  const emit = (next: string) => {
    const clean = next.slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1)
    if (!char && raw !== '') return
    const chars = value.split('')
    chars[index] = char ?? ''
    const next = chars.join('').slice(0, length)
    emit(next)
    if (char && index < length - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const chars = value.split('')
      if (chars[index]) {
        chars[index] = ''
        emit(chars.join(''))
      } else if (index > 0) {
        chars[index - 1] = ''
        emit(chars.join(''))
        refs.current[index - 1]?.focus()
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    emit(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    refs.current[focusIndex]?.focus()
  }

  return (
    <div
      className="flex justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label="One time password"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          autoFocus={autoFocus && index === 0}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          value={digit.trim()}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            'fade-scale-in h-14 w-11 rounded-xl border bg-white text-center font-display text-xl font-semibold text-ink transition-all duration-200',
            'focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/20 focus:-translate-y-0.5',
            'disabled:cursor-not-allowed disabled:bg-ivory/60',
            invalid
              ? 'border-danger text-danger ring-2 ring-danger/20'
              : digit.trim()
                ? 'border-forest/40'
                : 'border-line',
            disabled && 'opacity-70',
          )}
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  )
}
