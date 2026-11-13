import type { PG } from '../types'

/**
 * ---------------------------------------------------------------------------
 * DEMO DATA
 * ---------------------------------------------------------------------------
 * Every listing below is ILLUSTRATIVE SAMPLE DATA created for interface
 * demonstration. Prices, addresses, localities, availability, facilities and
 * images are fictional. No real owner identities, phone numbers, reviews or
 * ratings are published here.
 *
 * Images are royalty-free photographs served from Unsplash; a local
 * placeholder is shown automatically if an image fails to load.
 * ---------------------------------------------------------------------------
 */

const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`

const IMAGES = {
  livingWarm: photo('1522708323590-d24dbb6b0267'),
  apartment: photo('1560448204-e02f11c3d0e2'),
  brightInterior: photo('1502672260266-1c1ef2d93688'),
  chairCorner: photo('1493809842364-78817add7ffb'),
  bedroomGreen: photo('1522771739844-6a9f6d5f14af'),
  hotelBed: photo('1555854877-bab0e564b8d5'),
  sofaHall: photo('1586023492125-27b2c045efd7'),
  livingModern: photo('1600585154340-be6161a56a0c'),
  interiorNeutral: photo('1600607687939-ce8a6c25118c'),
  bedroomNeutral: photo('1600566753190-17f0baa2a6c3'),
  bedroomCozy: photo('1505693416388-ac5ce068fe85'),
  bedroomSoft: photo('1540518614846-7eded433c457'),
  lounge: photo('1524758631624-e2822e304c36'),
  kitchen: photo('1484154218962-a197022b5858'),
  houseExterior: photo('1616486338812-3dadae4b4ace'),
} as const

/** Hero background for the home page (premium accommodation photograph). */
export const HERO_IMAGE = IMAGES.houseExterior

/** Local placeholder used when a remote image cannot be loaded. */
export const IMAGE_FALLBACK = '/image-placeholder.svg'

const COMMON_RULES = [
  'Visitors are allowed up to 8:00 PM (demo rule).',
  'Smoking and alcohol are strictly prohibited inside the property.',
  'Monthly rent is payable by the 5th of every month (demo rule).',
  'Please keep noise low after 10:00 PM out of respect for other residents.',
]

export const PG_LISTINGS: PG[] = [
  {
    id: 'pg-001',
    slug: 'shree-shyam-boys-pg',
    name: 'Shree Shyam Boys PG',
    category: 'Boys',
    locality: 'Malviya Nagar',
    city: 'Jaipur',
    rent: 9500,
    securityDeposit: 10000,
    description:
      'A quiet, study-friendly boys PG (demo listing) with furnished rooms, shared kitchen access and daily housekeeping. Sample details are shown to demonstrate how a property page appears on RahoMitra.',
    coverImage: IMAGES.bedroomGreen,
    gallery: [IMAGES.bedroomGreen, IMAGES.livingWarm, IMAGES.kitchen, IMAGES.sofaHall],
    facilities: {
      ac: true,
      wifi: true,
      food: true,
      laundry: true,
      housekeeping: true,
      powerBackup: true,
      cctv: true,
      parking: false,
      studyTable: true,
      attachedBathroom: false,
    },
    sharingOptions: ['Double', 'Triple'],
    roomTypes: [
      { label: 'Double Sharing', sharing: 'Double', rent: 9500 },
      { label: 'Triple Sharing', sharing: 'Triple', rent: 7800 },
    ],
    foodAvailability: 'Included in rent',
    rules: COMMON_RULES,
    availabilityNote:
      'Demo status — 2 double-sharing rooms shown as available for illustration only.',
    isDemo: true,
    ownerContact: null,
  },
  {
    id: 'pg-002',
    slug: 'ashiana-pg',
    name: 'Ashiana PG',
    category: 'Girls',
    locality: 'Vaishali Nagar',
    city: 'Jaipur',
    rent: 11000,
    securityDeposit: 15000,
    description:
      'A girls PG (demo assumption) with furnished rooms, 24×7 security and housekeeping. The details below are sample data used to demonstrate the RahoMitra property experience.',
    coverImage: IMAGES.bedroomSoft,
    gallery: [IMAGES.bedroomSoft, IMAGES.brightInterior, IMAGES.lounge, IMAGES.chairCorner],
    facilities: {
      ac: true,
      wifi: true,
      food: true,
      laundry: true,
      housekeeping: true,
      powerBackup: true,
      cctv: true,
      parking: true,
      studyTable: true,
      attachedBathroom: true,
    },
    sharingOptions: ['Single', 'Double'],
    roomTypes: [
      { label: 'Single Sharing (Attached Bath)', sharing: 'Single', rent: 13500 },
      { label: 'Double Sharing', sharing: 'Double', rent: 11000 },
    ],
    foodAvailability: 'Included in rent',
    rules: COMMON_RULES,
    availabilityNote:
      'Demo status — 1 single-sharing and 1 double-sharing room shown as available for illustration only.',
    isDemo: true,
    ownerContact: null,
  },
  {
    id: 'pg-003',
    slug: 'greenleaf-boys-pg',
    name: 'GreenLeaf Boys PG',
    category: 'Boys',
    locality: 'Gopalpura',
    city: 'Jaipur',
    rent: 7500,
    securityDeposit: 5000,
    description:
      'A budget-friendly boys PG (demo listing) with non-AC rooms, WiFi and flexible meal plans. Included to demonstrate filtering and comparison on the Explore page.',
    coverImage: IMAGES.bedroomCozy,
    gallery: [IMAGES.bedroomCozy, IMAGES.apartment, IMAGES.kitchen, IMAGES.interiorNeutral],
    facilities: {
      ac: false,
      wifi: true,
      food: true,
      laundry: true,
      housekeeping: true,
      powerBackup: false,
      cctv: true,
      parking: false,
      studyTable: true,
      attachedBathroom: false,
    },
    sharingOptions: ['Double', 'Triple'],
    roomTypes: [
      { label: 'Double Sharing', sharing: 'Double', rent: 7500 },
      { label: 'Triple Sharing', sharing: 'Triple', rent: 6200 },
    ],
    foodAvailability: 'Available at extra cost',
    rules: COMMON_RULES,
    availabilityNote: 'Demo status — rooms shown as available for illustration only.',
    isDemo: true,
    ownerContact: null,
  },
  {
    id: 'pg-004',
    slug: 'sunrise-girls-pg',
    name: 'Sunrise Girls PG',
    category: 'Girls',
    locality: 'C-Scheme',
    city: 'Jaipur',
    rent: 12500,
    securityDeposit: 15000,
    description:
      'A centrally located girls PG (demo listing) with AC rooms, housekeeping and no in-house mess. Sample data for demonstrating facility filters and rent comparison.',
    coverImage: IMAGES.bedroomNeutral,
    gallery: [IMAGES.bedroomNeutral, IMAGES.livingModern, IMAGES.sofaHall, IMAGES.brightInterior],
    facilities: {
      ac: true,
      wifi: true,
      food: false,
      laundry: true,
      housekeeping: true,
      powerBackup: true,
      cctv: true,
      parking: true,
      studyTable: true,
      attachedBathroom: true,
    },
    sharingOptions: ['Single', 'Double'],
    roomTypes: [
      { label: 'Single Sharing', sharing: 'Single', rent: 12500 },
      { label: 'Double Sharing', sharing: 'Double', rent: 9800 },
    ],
    foodAvailability: 'Not available',
    rules: COMMON_RULES,
    availabilityNote: 'Demo status — rooms shown as available for illustration only.',
    isDemo: true,
    ownerContact: null,
  },
  {
    id: 'pg-005',
    slug: 'nest-co-living',
    name: 'Nest Co-living',
    category: 'Co-living',
    locality: 'Mansarovar',
    city: 'Jaipur',
    rent: 14000,
    securityDeposit: 20000,
    description:
      'A co-living style residence (demo listing) with private and shared rooms, a common lounge and included meals. Shown to demonstrate the Co-living category on RahoMitra.',
    coverImage: IMAGES.livingModern,
    gallery: [IMAGES.livingModern, IMAGES.lounge, IMAGES.hotelBed, IMAGES.kitchen],
    facilities: {
      ac: true,
      wifi: true,
      food: true,
      laundry: true,
      housekeeping: true,
      powerBackup: true,
      cctv: true,
      parking: true,
      studyTable: true,
      attachedBathroom: true,
    },
    sharingOptions: ['Single', 'Double', 'Triple'],
    roomTypes: [
      { label: 'Private Studio Room', sharing: 'Single', rent: 16500 },
      { label: 'Double Sharing', sharing: 'Double', rent: 14000 },
      { label: 'Triple Sharing', sharing: 'Triple', rent: 11500 },
    ],
    foodAvailability: 'Included in rent',
    rules: COMMON_RULES,
    availabilityNote: 'Demo status — rooms shown as available for illustration only.',
    isDemo: true,
    ownerContact: null,
  },
  {
    id: 'pg-006',
    slug: 'amber-boys-pg',
    name: 'Amber Boys PG',
    category: 'Boys',
    locality: 'Tonk Road',
    city: 'Jaipur',
    rent: 8500,
    securityDeposit: 8000,
    description:
      'A no-frills boys PG (demo listing) with non-AC rooms, parking and laundry access. Included as sample data for sorting and price-range filtering.',
    coverImage: IMAGES.apartment,
    gallery: [IMAGES.apartment, IMAGES.chairCorner, IMAGES.interiorNeutral, IMAGES.bedroomCozy],
    facilities: {
      ac: false,
      wifi: true,
      food: false,
      laundry: true,
      housekeeping: false,
      powerBackup: true,
      cctv: true,
      parking: true,
      studyTable: false,
      attachedBathroom: false,
    },
    sharingOptions: ['Double', 'Triple'],
    roomTypes: [
      { label: 'Double Sharing', sharing: 'Double', rent: 8500 },
      { label: 'Triple Sharing', sharing: 'Triple', rent: 6800 },
    ],
    foodAvailability: 'Available at extra cost',
    rules: COMMON_RULES,
    availabilityNote: 'Demo status — rooms shown as available for illustration only.',
    isDemo: true,
    ownerContact: null,
  },
]

/** The two headline demo properties featured on the home page. */
export const FEATURED_PG_SLUGS = ['shree-shyam-boys-pg', 'ashiana-pg'] as const

export const FEATURED_PG_LISTINGS: PG[] = FEATURED_PG_SLUGS.map(
  (slug) => PG_LISTINGS.find((pg) => pg.slug === slug)!,
)

export function getPGBySlug(slug: string): PG | undefined {
  return PG_LISTINGS.find((pg) => pg.slug === slug)
}
