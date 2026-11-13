import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary:
    'bg-forest text-ivory hover:bg-forest-light active:translate-y-px shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)]',
  gold: 'bg-gold text-forest-dark hover:bg-gold-dark hover:text-ivory active:translate-y-px shadow-[0_10px_24px_-14px_rgba(196,154,82,0.9)]',
  outline:
    'border border-forest/25 bg-white text-forest hover:border-forest hover:bg-forest hover:text-ivory',
  ghost: 'text-forest hover:bg-forest-soft',
  light: 'bg-ivory text-forest hover:bg-white',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs sm:text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-sm sm:text-base',
}

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  className?: string
  disabled?: boolean
  onClick?: () => void
}

/** Renders a react-router Link when `to` is provided, otherwise a <button>. */
interface ButtonLinkProps extends Omit<ButtonProps, 'type' | 'onClick'> {
  to: string
}

function classes(variant: Variant, size: Size, fullWidth: boolean, className?: string) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  className,
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, fullWidth, className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  to,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
}: ButtonLinkProps) {
  const content = <span className="inline-flex items-center gap-2">{children}</span>
  if (disabled) {
    return (
      <span className={cn(classes(variant, size, fullWidth, className), 'pointer-events-none opacity-60')}>
        {content}
      </span>
    )
  }
  return (
    <Link to={to} className={classes(variant, size, fullWidth, className)}>
      {content}
    </Link>
  )
}
