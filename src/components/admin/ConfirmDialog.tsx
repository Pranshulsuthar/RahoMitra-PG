import { useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from '../common/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** When set, the admin must type a reason before confirming (e.g. reject). */
  reasonLabel?: string
  reasonPlaceholder?: string
  requireReason?: boolean
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

/** Confirmation dialog with an optional mandatory reason field. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  reasonLabel,
  reasonPlaceholder,
  requireReason = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (requireReason && reason.trim().length < 5) {
      setError('Please provide a reason (at least 5 characters).')
      return
    }
    onConfirm(reason.trim() || undefined)
    setReason('')
    setError(null)
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="md"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'primary' : 'gold'}
            size="md"
            onClick={handleConfirm}
            className={danger ? 'bg-danger text-white hover:bg-danger/90 hover:text-white shadow-none' : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <span
          className={
            danger
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger-soft text-danger'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold-dark'
          }
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <div className="text-sm leading-relaxed text-ink-soft">{message}</div>
      </div>

      {(reasonLabel || requireReason) && (
        <div className="mt-5">
          <label htmlFor="confirm-reason" className="form-label">
            {reasonLabel ?? 'Reason'}
            {requireReason && <span className="ml-1 text-danger" aria-hidden>*</span>}
          </label>
          <textarea
            id="confirm-reason"
            rows={3}
            maxLength={400}
            value={reason}
            placeholder={reasonPlaceholder ?? 'Enter a short reason…'}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
            aria-invalid={error ? 'true' : undefined}
            className="form-input resize-y"
          />
          {error ? (
            <span className="form-error" role="alert">
              {error}
            </span>
          ) : (
            <span className="mt-1.5 block text-[11px] text-ink-mute">{reason.length}/400 characters</span>
          )}
        </div>
      )}
    </Modal>
  )
}
