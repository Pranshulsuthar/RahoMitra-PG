import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import type { FieldValidator } from '../utils/validation'

export type FormValues = Record<string, string>
export type FormErrors<V extends FormValues> = Partial<Record<keyof V, string>>
export type FormValidators<V extends FormValues> = Partial<Record<keyof V, FieldValidator>>

interface UseFormResult<V extends FormValues> {
  values: V
  errors: FormErrors<V>
  /** True after a submit attempt — used to show errors under every field. */
  submitted: boolean
  setField: (name: keyof V, value: string) => void
  handleChange: (event: { target: { name: string; value: string } }) => void
  /** Validates all fields; returns true when the form is valid. */
  validate: () => boolean
  handleSubmit: (onValid: (values: V) => void) => (event: FormEvent) => void
  reset: () => void
  setErrors: (errors: FormErrors<V>) => void
}

/**
 * Lightweight frontend form state with per-field validation.
 * Nothing is sent anywhere — callers decide what "submitting" means.
 */
export function useForm<V extends FormValues>(
  initialValues: V,
  validators: FormValidators<V>,
): UseFormResult<V> {
  const [values, setValues] = useState<V>(initialValues)
  const [errors, setErrors] = useState<FormErrors<V>>({})
  const [submitted, setSubmitted] = useState(false)

  const setField = useCallback((name: keyof V, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleChange = useCallback(
    (event: { target: { name: string; value: string } }) => {
      const { name, value } = event.target
      setValues((prev) => ({ ...prev, [name]: value } as V))
      setErrors((prev) => {
        if (!prev[name as keyof V]) return prev
        const next = { ...prev }
        delete next[name as keyof V]
        return next
      })
    },
    [],
  )

  const validate = useCallback(() => {
    const nextErrors: FormErrors<V> = {}
    for (const key of Object.keys(validators) as Array<keyof V>) {
      const validator = validators[key]
      if (!validator) continue
      const error = validator(values[key] ?? '')
      if (error) nextErrors[key] = error
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [validators, values])

  const handleSubmit = useCallback(
    (onValid: (values: V) => void) => (event: FormEvent) => {
      event.preventDefault()
      setSubmitted(true)
      if (validate()) onValid(values)
    },
    [validate, values],
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setSubmitted(false)
  }, [initialValues])

  return { values, errors, submitted, setField, handleChange, validate, handleSubmit, reset, setErrors }
}
