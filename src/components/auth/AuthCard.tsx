import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/**
 * White auth card: rounded corners, soft shadow, optional entrance animation.
 * `key` + `className` let FormTransition animate step changes.
 */
export function AuthCard({
  children,
  className,
  animate = true,
}: {
  children: ReactNode
  className?: string
  animate?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-line bg-white p-6 shadow-[0_24px_60px_-40px_rgba(23,61,50,0.45)] sm:p-8',
        animate && 'page-enter',
        className,
      )}
    >
      {children}
    </div>
  )
}
