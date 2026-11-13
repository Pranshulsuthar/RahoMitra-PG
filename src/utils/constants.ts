import type { LocalityOption } from '../types'

export const SITE = {
  name: 'RahoMitra',
  tagline: 'Aapke Rehne Ka Digital Saathi.',
  description:
    'RahoMitra helps students discover PG accommodations, explore facilities, compare rental options and contact PG owners directly.',
} as const

export interface NavLink {
  label: string
  to: string
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Explore PGs', to: '/explore' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export const BUDGET_OPTIONS: { label: string; min: number | ''; max: number | '' }[] = [
  { label: 'Any budget', min: '', max: '' },
  { label: 'Under ₹8,000', min: '', max: 8000 },
  { label: '₹8,000 – ₹12,000', min: 8000, max: 12000 },
  { label: '₹12,000 – ₹15,000', min: 12000, max: 15000 },
  { label: 'Above ₹15,000', min: 15000, max: '' },
]

/** Demo city / locality suggestions for the hero search. */
export const LOCALITY_OPTIONS: LocalityOption[] = [
  { city: 'Jaipur', locality: 'Malviya Nagar' },
  { city: 'Jaipur', locality: 'Vaishali Nagar' },
  { city: 'Jaipur', locality: 'Gopalpura' },
  { city: 'Jaipur', locality: 'C-Scheme' },
  { city: 'Jaipur', locality: 'Mansarovar' },
  { city: 'Jaipur', locality: 'Tonk Road' },
]

/**
 * Contact placeholders — intentionally non-routable (.example TLD).
 * Replace with verified details before launch; never invent real contacts.
 */
export const CONTACT_PLACEHOLDERS = {
  email: 'hello@rahomitra.example',
  address: 'Registered office address — to be added before launch',
  phone: 'Phone number not published yet',
  responseTime: 'Typical reply within 1–2 working days (placeholder)',
} as const

export const DEMO_NOTICE =
  'Demo build — every listing, price, address and availability shown here is illustrative sample data.'
