import type { ChangeEvent, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface BaseFieldProps {
  id: string
  label: string
  value: string
  error?: string
  hint?: ReactNode
  placeholder?: string
  required?: boolean
  autoComplete?: string
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'search'
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  min?: number | string
}

export function TextField({
  id,
  label,
  value,
  error,
  hint,
  placeholder,
  required,
  autoComplete,
  type = 'text',
  onChange,
  min,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="form-input"
      />
      {error ? (
        <span id={`${id}-error`} className="form-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-[11px] text-ink-mute">{hint}</span>
      )}
    </div>
  )
}

interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number
  maxLength?: number
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

export function TextAreaField({
  id,
  label,
  value,
  error,
  hint,
  placeholder,
  required,
  autoComplete,
  rows = 5,
  maxLength,
  onChange,
}: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="form-input resize-y"
      />
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <span id={`${id}-error`} className="form-error" role="alert">
            {error}
          </span>
        ) : (
          hint && <span className="mt-1.5 block text-[11px] text-ink-mute">{hint}</span>
        )}
        {maxLength && (
          <span className="mt-1.5 ml-auto shrink-0 text-[11px] text-ink-mute">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[]
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}

export function SelectField({
  id,
  label,
  value,
  error,
  hint,
  required,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn('form-input')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={`${id}-error`} className="form-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-[11px] text-ink-mute">{hint}</span>
      )}
    </div>
  )
}
