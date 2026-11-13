import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface StepProgressProps {
  steps: string[]
  /** Zero-based index of the active step. */
  current: number
  className?: string
}

/**
 * Multi-step progress indicator: numbered dots with a gold connector that
 * fills as the user advances. Labels collapse to the active step on mobile.
 */
export function StepProgress({ steps, current, className }: StepProgressProps) {
  const safeCurrent = Math.min(current, steps.length - 1)

  return (
    <div className={cn('mb-7', className)} aria-label={`Step ${safeCurrent + 1} of ${steps.length}`}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isDone = index < safeCurrent
          const isActive = index === safeCurrent
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300',
                    isDone && 'border-forest bg-forest text-ivory',
                    isActive && 'scale-110 border-gold bg-gold text-forest-dark shadow-[0_8px_20px_-10px_rgba(196,154,82,0.9)]',
                    !isDone && !isActive && 'border-line bg-white text-ink-mute',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden max-w-[86px] text-center text-[10px] font-semibold uppercase tracking-wider sm:block',
                    isActive ? 'text-forest' : isDone ? 'text-ink-soft' : 'text-ink-mute',
                  )}
                >
                  {step}
                </span>
              </div>

              {index < steps.length - 1 && (
                <span className="relative mx-1.5 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-line sm:mb-6">
                  <span
                    className={cn(
                      'absolute inset-0 origin-left rounded-full transition-transform duration-500',
                      index < safeCurrent ? 'scale-x-100 bg-forest' : 'scale-x-0 bg-gold',
                    )}
                  />
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: current step label */}
      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark sm:hidden">
        Step {safeCurrent + 1} of {steps.length} · {steps[safeCurrent]}
      </p>
    </div>
  )
}
