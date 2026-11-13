import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

const TONES = {
  success: { icon: CheckCircle2, classes: 'border-forest/30 bg-forest text-ivory' },
  error: { icon: XCircle, classes: 'border-danger/40 bg-danger text-white' },
  info: { icon: Info, classes: 'border-gold/50 bg-gold-soft text-gold-dark' },
} as const

/**
 * Presentational stacked toast viewport (bottom-right, auto-dismiss handled
 * by the caller). Shared by the Super Admin and PG Owner dashboards.
 */
export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2.5"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const tone = TONES[toast.tone]
        const Icon = tone.icon
        return (
          <div
            key={toast.id}
            className={cn(
              'fade-scale-in pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-pop',
              tone.classes,
            )}
          >
            <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-xs font-bold uppercase tracking-wide opacity-70 transition-opacity hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
