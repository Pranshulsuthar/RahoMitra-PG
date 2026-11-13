import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

/**
 * Centered success screen: popping ring + hand-drawn check icon,
 * then the content fades in.
 */
export function AuthSuccess({
  title,
  message,
  children,
  badge,
  icon,
}: {
  title: string
  message: ReactNode
  children?: ReactNode
  /** Optional status pill rendered under the title (e.g. PENDING ADMIN APPROVAL). */
  badge?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-6 h-24 w-24">
        <div className="ring-pop absolute inset-0 rounded-full bg-forest-soft" aria-hidden />
        <svg
          viewBox="0 0 48 48"
          className="ring-pop relative h-24 w-24 text-forest"
          fill="none"
          aria-hidden
        >
          <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
          <path
            d="M15 24.5l6.5 6.5L33 18.5"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-draw"
          />
          {icon}
        </svg>
      </div>

      <div className="fade-scale-in" style={{ animationDelay: '0.25s' }}>
        <h1 className="text-[1.6rem] leading-tight sm:text-3xl">{title}</h1>
        {badge && <div className="mt-4 flex justify-center">{badge}</div>}
        <div className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
          {message}
        </div>
        {children && <div className="mt-7 space-y-3">{children}</div>}
      </div>
    </div>
  )
}

/** Gold status pill with a pulsing dot — used for PENDING ADMIN APPROVAL. */
export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold-soft px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-dark">
      <span className="soft-pulse h-2 w-2 rounded-full bg-gold" aria-hidden />
      {children}
    </span>
  )
}

/** Simple text link used inside auth screens. */
export function AuthLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'font-semibold text-forest underline-offset-4 transition-colors hover:text-gold-dark hover:underline',
        className,
      )}
    >
      {children}
    </Link>
  )
}
