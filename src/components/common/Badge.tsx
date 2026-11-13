import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'

/** Prominent marker used on every fictional listing / price. */
export function DemoBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-forest-dark shadow-sm',
        compact && 'px-2 py-0.5 text-[9px]',
        className,
      )}
      title="Illustrative demo data — not a verified real-world listing"
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      Demo Listing
    </span>
  )
}

type Tone = 'forest' | 'ivory' | 'outline' | 'gold'

const tones: Record<Tone, string> = {
  forest: 'bg-forest text-ivory',
  ivory: 'bg-ivory text-forest',
  outline: 'border border-line bg-white text-ink-soft',
  gold: 'border border-gold/40 bg-gold-soft text-gold-dark',
}

export function Badge({
  children,
  tone = 'outline',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
