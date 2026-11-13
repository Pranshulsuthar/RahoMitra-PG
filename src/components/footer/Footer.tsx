import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { BrandLogo } from '../navbar/Navbar'
import { CONTACT_PLACEHOLDERS, NAV_LINKS, SITE } from '../../utils/constants'

/* ---------------------------------------------------------------
   Social placeholder glyphs (inline SVG — no brand icons in lucide).
   They are intentionally NOT links: socials are added before launch.
---------------------------------------------------------------- */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-4 w-4',
  'aria-hidden': true,
}

function InstagramGlyph() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M15.2 8.2h-1.4c-.7 0-1.1.4-1.1 1.1v1.4h2.4l-.35 2.4H12.7V21" />
    </svg>
  )
}

function YoutubeGlyph() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.4 9.6v4.8l4.3-2.4z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function XGlyph() {
  return (
    <svg {...iconProps}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

const QUICK_LINKS = [
  ...NAV_LINKS,
  { label: 'List Your PG', to: '/signup/owner' },
  { label: 'Login', to: '/auth' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
]

const SOCIALS = [
  { label: 'Instagram', glyph: InstagramGlyph },
  { label: 'Facebook', glyph: FacebookGlyph },
  { label: 'YouTube', glyph: YoutubeGlyph },
  { label: 'X (Twitter)', glyph: XGlyph },
]

export function Footer() {
  return (
    <footer className="bg-forest text-ivory">
      <div className="page-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div className="leading-none">
              <p className="font-display text-xl font-semibold text-ivory">{SITE.name}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                {SITE.tagline}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/70">
            A centralized platform where students discover PG accommodations, compare facilities and
            rent, and connect directly with owners — no middlemen, no hidden details.
          </p>
          <p className="mt-4 rounded-xl border border-gold/30 bg-forest-dark/60 px-4 py-3 text-[11px] leading-relaxed text-ivory/60">
            All listings on this demo build are illustrative sample data and are not verified
            real-world properties.
          </p>
        </div>

        {/* Quick links */}
        <nav aria-label="Footer quick links">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Quick Links
          </h3>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-sm text-ivory/70 transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Contact
          </h3>
          <ul className="space-y-3.5 text-sm text-ivory/70">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span>
                {CONTACT_PLACEHOLDERS.email}
                <span className="block text-[11px] text-ivory/45">placeholder address</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span>{CONTACT_PLACEHOLDERS.phone}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span>{CONTACT_PLACEHOLDERS.address}</span>
            </li>
          </ul>

          {/* Social placeholders — intentionally not linked to anywhere. */}
          <div className="mt-5">
            <div className="flex gap-2.5">
              {SOCIALS.map(({ label, glyph: Glyph }) => (
                <span
                  key={label}
                  title="Social link placeholder — to be added before launch"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 text-ivory/45"
                  aria-label={`${label} (placeholder, link not added yet)`}
                  role="img"
                >
                  <Glyph />
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-ivory/45">Social links coming soon.</p>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Legal
          </h3>
          <ul className="space-y-2.5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-ivory/70 transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11px] leading-relaxed text-ivory/45">
            RahoMitra does not handle bookings or payments. Admission is finalised directly with the
            PG owner, offline.
          </p>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="page-container flex flex-col items-center justify-between gap-3 py-5 text-[12px] text-ivory/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
