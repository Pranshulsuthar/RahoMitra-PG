import type { ReactNode } from 'react'

/**
 * Consistent header block for every auth card:
 * eyebrow (step context) → title → subtitle.
 */
export function AuthHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-7">
      {eyebrow && (
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold-dark">
          {eyebrow}
        </p>
      )}
      <h1 className="text-[1.75rem] leading-tight sm:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
