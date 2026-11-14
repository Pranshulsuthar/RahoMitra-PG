import { cn } from '../../utils/cn'

/**
 * SECTION 07 — initials avatar used in chat lists and chat headers.
 * Purely decorative demo UI (no image upload, no gravatar, no network).
 */
interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES: Record<string, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[12.5px]',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-forest/15 bg-forest-soft font-semibold text-forest',
        SIZES[size],
        className,
      )}
    >
      {initials || '?'}
    </span>
  )
}
