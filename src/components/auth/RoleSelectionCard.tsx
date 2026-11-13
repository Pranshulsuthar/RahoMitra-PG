import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Check, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

interface RoleSelectionCardProps {
  icon: LucideIcon
  title: string
  description: string
  /** Small capability chips shown under the description. */
  features?: string[]
  cta: string
  to: string
  tone?: 'forest' | 'gold' | 'ink'
  /** Renders the dark "restricted access" variant (Super Admin). */
  restricted?: boolean
}

const ICON_TONES = {
  forest: 'bg-forest text-gold',
  gold: 'bg-gold-soft text-gold-dark ring-1 ring-gold/25',
  ink: 'bg-ink text-gold',
} as const

/**
 * Role gateway row for the /auth landing page.
 * The entire row is one link — icon, summary, capability chips and CTA.
 */
export function RoleSelectionCard({
  icon: Icon,
  title,
  description,
  features,
  cta,
  to,
  tone = 'forest',
  restricted = false,
}: RoleSelectionCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative flex items-start gap-4 rounded-3xl border p-5 transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2',
        'hover:-translate-y-0.5 sm:items-center sm:gap-5 sm:p-6',
        restricted
          ? 'border-forest/50 bg-forest text-ivory shadow-[0_26px_55px_-36px_rgba(23,61,50,0.9)] hover:border-gold/60 hover:shadow-[0_34px_64px_-32px_rgba(23,61,50,0.95)]'
          : 'border-line bg-white shadow-[0_20px_50px_-38px_rgba(23,61,50,0.5)] hover:border-gold/55 hover:shadow-[0_34px_60px_-34px_rgba(23,61,50,0.55)]',
      )}
    >
      {/* Icon tile */}
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-14 sm:w-14',
          restricted ? 'bg-white/10 text-gold ring-1 ring-white/15' : ICON_TONES[tone],
        )}
        aria-hidden
      >
        <Icon className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
      </span>

      {/* Copy */}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2.5">
          <span
            className={cn(
              'font-display text-lg sm:text-xl',
              restricted ? 'text-white' : 'text-ink',
            )}
          >
            {title}
          </span>
          {restricted && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-gold/15 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-gold">
              <Lock className="h-3 w-3" aria-hidden />
              Restricted access
            </span>
          )}
        </span>
        <span
          className={cn(
            'mt-1 block text-sm leading-relaxed',
            restricted ? 'text-ivory/70' : 'text-ink-soft',
          )}
        >
          {description}
        </span>
        {features && features.length > 0 && (
          <span className="mt-3 hidden flex-wrap gap-2 sm:flex">
            {features.map((feature) => (
              <span
                key={feature}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-semibold',
                  restricted
                    ? 'border-white/15 bg-white/[0.08] text-ivory/80'
                    : 'border-line bg-ivory/70 text-ink-soft',
                )}
              >
                <Check
                  className={cn('h-3 w-3', restricted ? 'text-gold' : 'text-gold-dark')}
                  aria-hidden
                />
                {feature}
              </span>
            ))}
          </span>
        )}
      </span>

      {/* CTA */}
      <span
        className={cn(
          'mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-bold transition-colors duration-200 sm:mt-0 sm:px-5',
          restricted
            ? 'border-gold/45 bg-gold/15 text-gold group-hover:bg-gold group-hover:text-forest-dark'
            : 'border-line bg-white text-forest group-hover:border-forest group-hover:bg-forest group-hover:text-ivory',
        )}
      >
        <span className="hidden sm:inline">{cta}</span>
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </Link>
  )
}
