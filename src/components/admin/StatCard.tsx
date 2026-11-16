import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../utils/cn'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  trend?: 'up' | 'down' | 'neutral'
  tone?: 'forest' | 'gold' | 'danger' | 'ink'
}

const TONES = {
  forest: 'bg-forest-soft text-forest',
  gold: 'bg-gold-soft text-gold-dark',
  danger: 'bg-danger-soft text-danger',
  ink: 'bg-ivory text-ink',
}

/** Modern statistic card used across the dashboard and report screens. */
export function StatCard({ label, value, icon: Icon, hint, trend = 'neutral', tone = 'forest' }: StatCardProps) {
  return (
    <div className="group rounded-3xl border border-line bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', TONES[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {trend !== 'neutral' && (
          <span
            className={cn(
              'flex items-center gap-1 text-[11px] font-bold',
              trend === 'up' ? 'text-forest' : 'text-danger',
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            )}
          </span>
        )}
      </div>
      <p className="mt-4 text-[1.75rem] font-bold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-[13px] font-semibold text-ink-soft">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>}
    </div>
  )
}
