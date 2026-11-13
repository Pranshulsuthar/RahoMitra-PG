import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'gold' | 'outline' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-forest text-ivory hover:bg-forest-light shadow-[0_14px_30px_-18px_rgba(23,61,50,0.9)]',
  gold: 'bg-gold text-forest-dark hover:bg-gold-dark hover:text-ivory shadow-[0_14px_30px_-18px_rgba(196,154,82,0.9)]',
  outline:
    'border border-forest/25 bg-white text-forest hover:border-forest hover:bg-forest hover:text-ivory',
  ghost: 'text-forest hover:bg-forest-soft',
}

interface AuthButtonProps {
  children: ReactNode
  type?: 'button' | 'submit'
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
  busyLabel?: string
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Auth CTA with hover lift, press feedback and a built-in loading state.
 */
export function AuthButton({
  children,
  type = 'submit',
  variant = 'gold',
  fullWidth = true,
  loading = false,
  busyLabel,
  disabled = false,
  onClick,
  className,
}: AuthButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold tracking-tight transition-all duration-200',
        'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
        'disabled:pointer-events-none disabled:opacity-70',
        fullWidth && 'w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {loading && busyLabel ? busyLabel : children}
    </button>
  )
}
