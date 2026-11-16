import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { ImageWithFallback } from '../common/ImageWithFallback'
import { cn } from '../../utils/cn'

const AUTO_PLAY_MS = 2000
const FADE_MS = 700

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Image gallery with a soft crossfade that auto-advances every 2 seconds.
 * Autoplay pauses on hover and whenever the user prefers reduced motion.
 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [resumeTick, setResumeTick] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  const total = images.length
  const autoplay = total > 1 && !paused && !reducedMotion

  useEffect(() => {
    if (!autoplay) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total)
    }, AUTO_PLAY_MS)
    return () => window.clearInterval(timer)
  }, [autoplay, total, resumeTick])

  const go = (next: number) => {
    setIndex((next + total) % total)
    setResumeTick((tick) => tick + 1) // restart the 2s countdown
  }

  if (total === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-line bg-ivory">
        <ImageWithFallback src="" alt={`${alt} photograph`} className="h-72 sm:h-[420px]" />
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl border border-line bg-ivory shadow-card">
        <div className="relative h-72 sm:h-[420px]">
          {images.map((image, i) => (
            <div
              key={`${image}-${i}`}
              className={cn(
                'absolute inset-0 transition-opacity ease-in-out',
                i === index ? 'opacity-100' : 'opacity-0',
              )}
              style={{ transitionDuration: `${FADE_MS}ms` }}
              aria-hidden={i !== index}
            >
              <ImageWithFallback
                src={image}
                alt={`${alt} image ${i + 1} of ${total}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="h-full w-full"
              />
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-forest shadow-pop transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-forest shadow-pop transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>

            {/* Autoplay indicator */}
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
              className="absolute left-4 bottom-4 flex h-8 w-8 items-center justify-center rounded-full bg-forest/85 text-ivory transition-colors hover:bg-forest"
              title={paused ? 'Resume slideshow' : 'Pause slideshow'}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>

            {/* Progress dots */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, i) => (
                <button
                  key={`dot-${image}-${i}`}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-gold' : 'w-1.5 bg-white/70 hover:bg-white',
                  )}
                />
              ))}
            </div>

            <div className="absolute right-4 bottom-4 rounded-full bg-forest/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-ivory">
              {index + 1} / {total}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={`${image}-${i}`}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                i === index
                  ? 'border-gold opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <ImageWithFallback src={image} alt={`${alt} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
