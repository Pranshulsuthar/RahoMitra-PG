import { useState } from 'react'
import type { AnimationEvent } from 'react'
import logo from '../../assets/RahoMitra_logo.png'

/**
 * True once the intro has played in this browser tab session.
 * Full page loads reset it (module state), SPA navigation does not replay it.
 */
let introPlayed = false

export function isIntroPlayed(): boolean {
  return introPlayed
}

/**
 * Full-screen intro: the RahoMitra logo zooms in, holds, then the whole
 * overlay zooms forward and dissolves into the homepage.
 */
export function IntroSplash() {
  const [finished, setFinished] = useState(introPlayed)

  if (finished) return null

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Ignore bubbled animations from the logo / wordmark children.
    if (event.target !== event.currentTarget) return
    introPlayed = true
    setFinished(true)
  }

  return (
    <div
      className="intro-splash pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-forest-dark"
      onAnimationEnd={handleAnimationEnd}
      aria-hidden="true"
    >
      <img
        src={logo}
        alt=""
        className="intro-logo h-24 w-24 rounded-3xl object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] sm:h-28 sm:w-28"
      />
      <p className="intro-wordmark mt-6 font-display text-3xl font-semibold tracking-tight text-ivory sm:text-4xl">
        RahoMitra
      </p>
      <p className="intro-wordmark mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
        Aapke Rehne Ka Digital Saathi
      </p>
    </div>
  )
}
