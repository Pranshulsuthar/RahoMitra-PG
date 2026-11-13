import type { ChangeEvent } from 'react'
import { cn } from '../../utils/cn'

interface AuthInputProps {
  id: string
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  /** Form field name — defaults to `id`; must match the useForm field key. */
  name?: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password'
  placeholder?: string
  autoComplete?: string
  error?: string
  hint?: string
  required?: boolean
  inputMode?: 'text' | 'email' | 'numeric' | 'tel'
  maxLength?: number
  min?: number
  autoFocus?: boolean
  className?: string
}

/** Labeled input with animated inline error used across all auth screens. */
export function AuthInput({
  id,
  label,
  value,
  onChange,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  error,
  hint,
  required,
  inputMode,
  maxLength,
  min,
  autoFocus,
  className,
}: AuthInputProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        autoFocus={autoFocus}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn('form-input', error && 'gentle-shake')}
      />
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
