import { Sparkles } from 'lucide-react'

/**
 * Prominent honesty strip shown on admin screens so sample statistics are
 * never mistaken for live platform data.
 */
export function DemoBanner({ message }: { message?: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/60 px-4 py-3 text-[12.5px] leading-relaxed text-gold-dark">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-bold uppercase tracking-wide">Demo data</strong> —{' '}
        {message ??
          'every statistic, record and status on this screen is an illustrative sample for interface demonstration only.'}
      </p>
    </div>
  )
}
