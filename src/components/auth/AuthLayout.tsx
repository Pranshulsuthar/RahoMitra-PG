import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import logo from '../../assets/RahoMitra_logo.png'
import { SITE } from '../../utils/constants'

const HIGHLIGHTS = [
  'Explore verified-style PG listings across localities',
  'Compare rent, sharing options and facilities in one view',
  'Contact property owners directly — no brokerage chain',
]

interface AuthLayoutProps {
  children: ReactNode
  /** Rendered in the right column header (e.g. a back link). */
  headerAction?: ReactNode
  /** Width of the form column content. */
  size?: 'md' | 'lg'
}

/**
 * Full-screen authentication shell: dark brand panel on the left,
 * form column on the right. Stacks cleanly on mobile.
 */
export function AuthLayout({ children, headerAction, size = 'md' }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-ivory lg:grid-cols-[1.05fr_1fr]">
      {/* -------------------------------------------------- Brand panel */}
      <aside className="relative hidden overflow-hidden bg-forest lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-gold/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-gold/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(196,154,82,0.14),transparent_55%)]"
          aria-hidden
        />

        <Link to="/" className="relative flex items-center gap-3" aria-label="RahoMitra home">
          <img
            src={logo}
            alt=""
            className="h-12 w-12 rounded-xl bg-white object-cover ring-1 ring-black/5"
            width={48}
            height={48}
          />
          <span className="leading-none">
            <span className="block font-display text-xl font-semibold text-ivory">
              {SITE.name}
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Premium auth experience
          </span>
          <h2 className="mt-6 text-3xl leading-snug text-ivory xl:text-4xl">
            Aapke Rehne Ka <span className="italic text-gold">Digital Saathi.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ivory/60">
            One account, every side of better living — discover, list and manage PGs across the
            city.
          </p>
          <div className="my-7 h-px bg-gradient-to-r from-gold/40 via-gold/15 to-transparent" aria-hidden />
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3.5">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40"
                  aria-hidden
                >
                  <Check className="h-3 w-3 text-gold" />
                </span>
                <span className="text-sm leading-relaxed text-ivory/75">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between gap-4 text-[12px] text-ivory/50">
          <Link to="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-gold">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to home
          </Link>
          <span>Frontend demo — no data leaves your browser</span>
        </div>
      </aside>

      {/* --------------------------------------------------- Form column */}
      <div className="flex min-h-screen flex-col bg-white">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden" aria-label="RahoMitra home">
            <img
              src={logo}
              alt=""
              className="h-9 w-9 rounded-lg bg-white object-cover ring-1 ring-black/5"
              width={36}
              height={36}
            />
            <span className="font-display text-lg font-semibold text-forest">RahoMitra</span>
          </Link>
          <div className="flex items-center gap-3">
            {headerAction ?? (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest transition-colors hover:text-gold-dark sm:text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Home
              </Link>
            )}
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
          <div className={size === 'lg' ? 'w-full max-w-4xl' : 'w-full max-w-md'}>{children}</div>
        </main>

        <footer className="border-t border-line px-5 py-4 text-center text-[11px] text-ink-mute sm:px-8">
          &copy; {new Date().getFullYear()} RahoMitra. Secure authentication portal.
        </footer>
      </div>
    </div>
  )
}
