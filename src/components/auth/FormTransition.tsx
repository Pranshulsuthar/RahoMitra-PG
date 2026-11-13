import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface FormTransitionProps {
  children: ReactNode
  /** Slide direction — forward moves content in from the right. */
  direction?: 'forward' | 'backward'
  className?: string
}

/**
 * Step container: horizontal slide + fade.
 * Give it a stable `key` per step so React remounts and replays the motion.
 */
export function FormTransition({
  children,
  direction = 'forward',
  className,
}: FormTransitionProps) {
  return (
    <div
      className={cn(
        direction === 'forward' ? 'slide-in-right' : 'slide-in-left',
        className,
      )}
    >
      {children}
    </div>
  )
}
