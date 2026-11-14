import { cn } from '../../utils/cn'

/** Every status label used across the admin panel with its colour tone. */
const STATUS_STYLES: Record<string, string> = {
  // PG / application / owner
  APPROVED: 'bg-forest-soft text-forest border-forest/25',
  PENDING: 'bg-gold-soft text-gold-dark border-gold/40',
  REJECTED: 'bg-danger-soft text-danger border-danger/30',
  SUSPENDED: 'bg-danger-soft text-danger border-danger/30',
  ACTIVE: 'bg-forest-soft text-forest border-forest/25',
  // membership
  INACTIVE: 'bg-ivory-deep/60 text-ink-soft border-line',
  // subscriptions
  EXPIRING_SOON: 'bg-gold-soft text-gold-dark border-gold/40',
  EXPIRED: 'bg-ivory-deep/60 text-ink-soft border-line',
  CANCELLED: 'bg-danger-soft text-danger border-danger/30',
  // payments
  SUCCESS: 'bg-forest-soft text-forest border-forest/25',
  FAILED: 'bg-danger-soft text-danger border-danger/30',
  REFUNDED: 'bg-ivory-deep/60 text-ink-soft border-line',
  // tickets
  OPEN: 'bg-danger-soft text-danger border-danger/30',
  IN_PROGRESS: 'bg-gold-soft text-gold-dark border-gold/40',
  RESOLVED: 'bg-forest-soft text-forest border-forest/25',
  CLOSED: 'bg-ivory-deep/60 text-ink-soft border-line',
  // plans
  ENABLED: 'bg-forest-soft text-forest border-forest/25',
  DISABLED: 'bg-ivory-deep/60 text-ink-soft border-line',
  // priority
  LOW: 'bg-ivory-deep/60 text-ink-soft border-line',
  MEDIUM: 'bg-gold-soft text-gold-dark border-gold/40',
  HIGH: 'bg-danger-soft text-danger border-danger/30',
  URGENT: 'bg-danger text-white border-danger',
  // owner dashboard (Section 04)
  DRAFT: 'bg-ivory-deep/60 text-ink-soft border-line',
  PAUSED: 'bg-danger-soft text-danger border-danger/30',
  REVOKED: 'bg-danger-soft text-danger border-danger/30',
  AVAILABLE: 'bg-forest-soft text-forest border-forest/25',
  OCCUPIED: 'bg-ivory-deep/60 text-ink-soft border-line',
  MAINTENANCE: 'bg-gold-soft text-gold-dark border-gold/40',
  VACANT: 'bg-forest-soft text-forest border-forest/25',
  PARTIAL: 'bg-gold-soft text-gold-dark border-gold/40',
  FULL: 'bg-danger-soft text-danger border-danger/30',
  // billing & payments (Section 06)
  PAID: 'bg-forest-soft text-forest border-forest/25',
  UNPAID: 'bg-danger-soft text-danger border-danger/30',
  PARTIALLY_PAID: 'bg-gold-soft text-gold-dark border-gold/40',
  OVERDUE: 'bg-danger text-white border-danger',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
        STATUS_STYLES[status] ?? 'border-line bg-ivory text-ink-soft',
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
