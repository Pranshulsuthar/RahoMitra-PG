import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: string
  align?: 'center' | 'left'
  tone?: 'dark' | 'light'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const light = tone === 'light'
  return (
    <div
      className={cn(
        'mb-10 max-w-3xl sm:mb-12',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-3 text-[11px] font-bold uppercase tracking-[0.28em]',
            light ? 'text-gold' : 'text-gold-dark',
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'text-[1.75rem] leading-[1.2] sm:text-4xl',
          light ? 'text-ivory' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-[15px] leading-relaxed', light ? 'text-ivory/70' : 'text-ink-soft')}>
          {description}
        </p>
      )}
    </div>
  )
}
