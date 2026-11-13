import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, LogIn, Building2 } from 'lucide-react'
import logo from '../../assets/RahoMitra_logo.png'
import { NAV_LINKS } from '../../utils/constants'
import { cn } from '../../utils/cn'
import { ButtonLink } from '../common/Button'

/** Brand mark: the RahoMitra logo used as a dark rounded badge tile. */
export function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: 'h-9 w-9 rounded-lg',
    md: 'h-11 w-11 rounded-xl',
    lg: 'h-14 w-14 rounded-2xl',
  }[size]
  return (
    <img
      src={logo}
      alt="RahoMitra logo"
      className={cn('shrink-0 bg-white object-cover shadow-sm ring-1 ring-black/5', dims)}
      width={56}
      height={56}
    />
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname, location.search])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="page-container flex h-[72px] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" aria-label="RahoMitra home">
          <BrandLogo />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold tracking-tight text-forest">
              RahoMitra
            </span>
            <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-gold-dark sm:block">
              Aapke Rehne Ka Digital Saathi
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-forest-soft text-forest'
                    : 'text-ink-soft hover:bg-ivory hover:text-forest',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-ivory"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Login
          </Link>
          <ButtonLink to="/signup/owner" variant="gold" size="md">
            <Building2 className="h-4 w-4" aria-hidden />
            List Your PG
          </ButtonLink>
        </div>

        {/* Mobile / tablet: login lives directly in the top bar */}
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 px-3.5 py-2 text-[13px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory sm:px-4 sm:text-sm lg:hidden"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Login
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-forest transition-colors hover:bg-ivory lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          'overflow-hidden border-t border-line bg-white transition-[max-height,opacity] duration-300 lg:hidden',
          open ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="page-container flex flex-col gap-1 py-4" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'bg-forest-soft text-forest' : 'text-ink-soft hover:bg-ivory',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
            <ButtonLink to="/signup/owner" variant="gold" size="md" fullWidth>
              <Building2 className="h-4 w-4" aria-hidden />
              List Your PG
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  )
}
