import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../utils/cn'

type Tone = 'error' | 'info'

/** Inline banner for validation / demo notices with a soft entrance. */
export function AuthError({
  message,
  tone = 'error',
  className,
}: {
  message: string
  tone?: Tone
  className?: string
}) {
  const isError = tone === 'error'
  const Icon = isError ? AlertCircle : Info
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'fade-scale-in flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
        isError
          ? 'bg-danger-soft text-danger'
          : 'border border-gold/40 bg-gold-soft/50 text-gold-dark',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  )
}

/** Success variant used for verified / completed states. */
export function AuthSuccessBanner({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        'fade-scale-in flex items-start gap-2.5 rounded-2xl bg-forest-soft px-4 py-3 text-[13px] leading-relaxed text-forest',
        className,
      )}
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  )
}
