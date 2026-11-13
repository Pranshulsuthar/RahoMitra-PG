/** Frontend-only validation helpers. No server involved. */

export type FieldValidator = (value: string) => string | undefined

export const required =
  (message = 'This field is required.'): FieldValidator =>
  (value) =>
    value.trim() ? undefined : message

export const email: FieldValidator = (value) => {
  if (!value.trim()) return 'Email address is required.'
  // Pragmatic pattern: local@domain.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    ? undefined
    : 'Enter a valid email address.'
}

/** Indian mobile number: 10 digits starting with 6-9. */
export const mobile: FieldValidator = (value) => {
  if (!value.trim()) return 'Mobile number is required.'
  const digits = value.replace(/[\s-]/g, '')
  return /^[6-9]\d{9}$/.test(digits)
    ? undefined
    : 'Enter a valid 10-digit mobile number.'
}

export const minLength =
  (limit: number, message?: string): FieldValidator =>
  (value) =>
    value.trim().length >= limit
      ? undefined
      : message ?? `Must be at least ${limit} characters.`

export const maxLength =
  (limit: number, message?: string): FieldValidator =>
  (value) =>
    value.trim().length <= limit
      ? undefined
      : message ?? `Must be ${limit} characters or fewer.`

export const numberBetween =
  (min: number, max: number, message: string): FieldValidator =>
  (value) => {
    if (!value.trim()) return undefined // optional numeric fields
    const n = Number(value)
    return Number.isFinite(n) && n >= min && n <= max ? undefined : message
  }

/** Run a validator only when the field has a value (for optional fields). */
export const optional =
  (validator: FieldValidator): FieldValidator =>
  (value) =>
    value.trim() ? validator(value) : undefined

/** Combine several validators; returns the first error found. */
export function compose(...validators: FieldValidator[]): FieldValidator {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return undefined
  }
}
