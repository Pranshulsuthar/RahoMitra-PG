import { useEffect, useState } from 'react'
import { IMAGE_FALLBACK } from '../../data/pgData'
import { cn } from '../../utils/cn'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/**
 * <img> with a guaranteed local placeholder fallback so a broken or
 * offline remote image never shows a broken-image icon.
 */
export function ImageWithFallback({ src, alt, className, loading = 'lazy' }: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => setCurrentSrc(src), [src])

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
      onError={() => {
        if (currentSrc !== IMAGE_FALLBACK) setCurrentSrc(IMAGE_FALLBACK)
      }}
    />
  )
}
