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

/** Default popular localities suggestions for search autocomplete */
export const LOCALITY_OPTIONS: LocalityOption[] = [
  { city: 'Jaipur', locality: 'Malviya Nagar' },
  { city: 'Jaipur', locality: 'Vaishali Nagar' },
  { city: 'Jaipur', locality: 'Gopalpura' },
  { city: 'Jaipur', locality: 'C-Scheme' },
  { city: 'Jaipur', locality: 'Mansarovar' },
  { city: 'Jaipur', locality: 'Tonk Road' },
]

/** Hero background image for home page */
export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80'

/** Local placeholder used when an image fails to load */
export const IMAGE_FALLBACK = '/image-placeholder.svg'

/** Platform contact details */
export const CONTACT_DETAILS = {
  email: 'support@rahomitra.com',
  phone: '+91 80000 12345',
  address: 'Jaipur, Rajasthan, India',
  responseTime: 'Typical reply within 24–48 hours',
} as const

/** Product FAQs for students */
export const STUDENT_FAQS = [
  {
    id: 'faq-1',
    question: 'How do I pay my monthly rent?',
    answer:
      'RahoMitra records offline rent payments. You can pay your PG owner directly via UPI, cash, or bank transfer, and the owner will record the receipt on your portal.',
  },
  {
    id: 'faq-2',
    question: 'How do I request a room or bed change?',
    answer:
      'Room allocation is managed by your PG owner. You can contact your owner directly or submit a request via the Messages or Complaints tab.',
  },
  {
    id: 'faq-3',
    question: 'Where can I see official PG notices and announcements?',
    answer:
      'The Notices screen is your digital notice board. All announcements published by your PG owner appear there in real time.',
  },
  {
    id: 'faq-4',
    question: 'Is my profile editable?',
    answer:
      'Yes, visit My Profile to update your personal details, emergency contact, college, and city.',
  },
  {
    id: 'faq-5',
    question: 'How do I join a PG on RahoMitra?',
    answer:
      'Obtain an admission code from your PG owner and click "Join PG with Code" on your dashboard to submit your admission request.',
  },
]

/** Standard room facilities list */
export const ROOM_FACILITIES = [
  'Study Table',
  'Wi-Fi',
  'Attached Bathroom',
  'Power Backup',
  'Housekeeping',
  'Fan & LED',
]
