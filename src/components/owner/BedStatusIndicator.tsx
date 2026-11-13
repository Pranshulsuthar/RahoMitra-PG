import { cn } from '../../utils/cn'
import type { BedStatus } from '../../types/owner'
import { BED_STATUS_LABELS } from '../../types/owner'

export const BED_STATUS_STYLES: Record<BedStatus, string> = {
  AVAILABLE: 'border-forest/30 bg-forest-soft text-forest',
  OCCUPIED: 'border-line bg-ivory-deep/70 text-ink-soft',
  MAINTENANCE: 'border-gold/50 bg-gold-soft text-gold-dark',
}

export const BED_DOT_STYLES: Record<BedStatus, string> = {
  AVAILABLE: 'bg-forest',
  OCCUPIED: 'bg-ink-mute',
  MAINTENANCE: 'bg-gold',
}

/** Small status chip for a single bed. */
export function BedStatusIndicator({
  status,
  label,
  className,
}: {
  status: BedStatus
  /** Overrides the default status label (e.g. bed letter). */
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
        BED_STATUS_STYLES[status],
        className,
      )}
      title={BED_STATUS_LABELS[status]}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', BED_DOT_STYLES[status])} aria-hidden />
      {label ?? BED_STATUS_LABELS[status]}
    </span>
  )
}

/** Shared legend explaining the three bed states. */
export function BedLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] as const).map((status) => (
        <span key={status} className="flex items-center gap-2 text-[11.5px] font-semibold text-ink-soft">
          <span className={cn('h-2.5 w-2.5 rounded-full', BED_DOT_STYLES[status])} aria-hidden />
          {BED_STATUS_LABELS[status]}
        </span>
      ))}
    </div>
  )
}
