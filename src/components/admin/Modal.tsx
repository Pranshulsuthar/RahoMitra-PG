import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const SIZES = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/** Accessible dialog used for detail drawers, forms and confirmations. */
export function Modal({ open, title, subtitle, onClose, children, footer, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  // Portalled to <body> so page-level transform/animation ancestors
  // (e.g. `.page-enter` on <main>) can't break `position: fixed`.
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fade-scale-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop sm:rounded-3xl',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg sm:text-xl">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-ink-mute">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:bg-ivory hover:text-forest"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-line bg-ivory/60 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
