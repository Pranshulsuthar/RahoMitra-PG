import type { ChangeEvent } from 'react'

interface BaseFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
}

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="form-label">
      {label}
      {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
    </label>
  )
}

function ErrorText({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return (
      <span className="form-error" role="alert">
        {error}
      </span>
    )
  }
  if (hint) {
    return <span className="mt-1.5 block text-[11px] text-ink-mute">{hint}</span>
  }
  return null
}

/** Standard labelled text field used across every owner form. */
export function FormInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  error,
  hint,
  disabled,
  className,
  min,
  max,
  step,
}: BaseFieldProps & {
  type?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        className="form-input"
      />
      <ErrorText error={error} hint={hint} />
    </div>
  )
}

/** Standard labelled select used across every owner form. */
export function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  required,
  error,
  hint,
  disabled,
  className,
}: BaseFieldProps & {
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        className="form-input"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ErrorText error={error} hint={hint} />
    </div>
  )
}

/** Standard labelled textarea used across every owner form. */
export function FormTextarea({
  id,
  label,
  value,
  onChange,
  rows = 3,
  maxLength,
  required,
  placeholder,
  error,
  hint,
  disabled,
  className,
}: BaseFieldProps & {
  rows?: number
  maxLength?: number
}) {
  return (
    <div className={className}>
      <Label id={id} label={label} required={required} />
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        className="form-input resize-y"
      />
      <ErrorText error={error} hint={hint ?? (maxLength ? `${value.length}/${maxLength} characters` : undefined)} />
    </div>
  )
}
