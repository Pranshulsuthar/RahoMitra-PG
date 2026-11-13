import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  /** Form field name — defaults to `id`; must match the useForm field key. */
  name?: string
  placeholder?: string
  autoComplete?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

/**
 * Password field with an animated visibility toggle — the icon swaps with a
 * subtle rotate + fade instead of snapping.
 */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  name,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  error,
  hint,
  required,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn('form-input pr-16', error && 'gentle-shake')}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ivory hover:text-forest"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            {visible ? (
              <EyeOff className="icon-swap absolute h-4 w-4" aria-hidden />
            ) : (
              <Eye className="icon-swap absolute h-4 w-4" aria-hidden />
            )}
          </span>
        </button>
      </div>

      {error ? (
        <span id={`${id}-error`} className="form-error fade-scale-in" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-[11px] text-ink-mute">{hint}</span>
      )}
    </div>
  )
}
