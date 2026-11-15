/**
 * ---------------------------------------------------------------------------
 * SECTION 03 — CENTRALISED SUPER ADMIN DEMO DATA
 * ---------------------------------------------------------------------------
 * Every record below is ILLUSTRATIVE SAMPLE DATA for interface demonstration.
 * Names are fictional, emails use the non-routable "@rahomitra.demo" domain,
 * no real phone numbers or payment transactions exist anywhere in this file.
 * The two headline properties (Shree Shyam Boys PG, Ashiana PG) mirror the
 * public site listings and are NOT verified real-world properties.
 * ---------------------------------------------------------------------------
 */
import type {
  ActivityItem,
  AdminPg,
  Advertisement,
  FeaturedRequest,
  OwnerApplication,
  OwnerRecord,
  PaymentRecord,
  PlanRecord,
  PlatformSettings,
  PlatformTicket,
  PlatformNotification,
  StudentRecord,
  SubscriptionRecord,
  SupportTicket,
} from '../types/admin'
import { PG_LISTINGS } from './pgData'

/* -------------------------------------------------------------- helpers */

const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`

const facilityList = (flags: object) =>
  (Object.entries(flags) as [string, boolean][])
    .filter(([, on]) => on)
    .map(([key]) => FACILITY_LABELS[key] ?? key)

const FACILITY_LABELS: Record<string, string> = {
  ac: 'Air Conditioning',
  wifi: 'High-speed WiFi',
  food: 'Mess / Meals',
  laundry: 'Laundry Service',
  housekeeping: 'Daily Housekeeping',
  powerBackup: 'Power Backup',
  cctv: 'CCTV Security',
  parking: 'Parking',
  studyTable: 'Study Table',
  attachedBathroom: 'Attached Bathroom',
}

/* ------------------------------------------------------------------ PGs */

type Seed = {
  ownerId: string
  ownerName: string
  status: AdminPg['status']
  statusNote?: string
  address: string
}

const PG_SEEDS: Record<string, Seed> = {
  'pg-001': {
    ownerId: 'own-001',
    ownerName: 'Rakesh Sharma (demo)',
    status: 'APPROVED',
    address: 'B-14, Malviya Nagar, Near College Gate, Jaipur 302017 (demo address)',
  },
  'pg-002': {
    ownerId: 'own-002',
    ownerName: 'Sunita Verma (demo)',
    status: 'APPROVED',
    address: 'C-7, Vaishali Nagar, Opp. Park, Jaipur 302021 (demo address)',
  },
  'pg-003': {
    ownerId: 'own-003',
    ownerName: 'Mahesh Gupta (demo)',
    status: 'PENDING',
    statusNote: 'Awaiting document review — demo state.',
    address: 'D-22, Gopalpura, Near Market Road, Jaipur 302019 (demo address)',
  },
  'pg-004': {
    ownerId: 'own-004',
    ownerName: 'Kavita Joshi (demo)',
    status: 'APPROVED',
    address: 'A-3, C-Scheme, Behind Bus Stand, Jaipur 302001 (demo address)',
  },
  'pg-005': {
    ownerId: 'own-005',
    ownerName: 'Aman Trivedi (demo)',
    status: 'SUSPENDED',
    statusNote: 'Suspended for listing rule violations — demo state.',
    address: 'E-9, Mansarovar, Main Boulevard, Jaipur 302020 (demo address)',
  },
  'pg-006': {
    ownerId: 'own-006',
    ownerName: 'Deepak Rathore (demo)',
    status: 'REJECTED',
    statusNote: 'Incomplete address proof — demo state.',
    address: 'F-5, Tonk Road, Near Metro Pillar, Jaipur 302018 (demo address)',
  },
}

/** The six public demo listings, enriched with admin-only fields. */
const ADMIN_PG_LIST: AdminPg[] = PG_LISTINGS.map((pg) => {
  const seed = PG_SEEDS[pg.id]
  return {
    id: pg.id,
    name: pg.name,
    ownerId: seed.ownerId,
    ownerName: seed.ownerName,
    city: pg.city,
    locality: pg.locality,
    category: pg.category,
    registeredOn: pg.id === 'pg-001' ? '2026-01-18' : pg.id === 'pg-002' ? '2026-02-04' : '2026-03-12',
    status: seed.status,
    statusNote: seed.statusNote,
    rent: pg.rent,
    address: seed.address,
    description: pg.description,
    facilities: facilityList(pg.facilities),
    roomCategories: pg.roomTypes.map((r) => ({ label: r.label, sharing: r.sharing, rent: r.rent })),
    coverImage: pg.coverImage,
    gallery: pg.gallery,
  }
})

/** Two additional fictional admin records so the table has richer variety. */
const EXTRA_ADMIN_PG: AdminPg[] = [
  {
    id: 'pg-007',
    name: 'Nirvana Girls PG',
    ownerId: 'own-007',
    ownerName: 'Pooja Mehta (demo)',
    city: 'Jaipur',
    locality: 'Jagatpura',
    category: 'Girls',
    registeredOn: '2026-04-02',
    status: 'APPROVED',
    rent: 8800,
    address: 'G-11, Jagatpura, Near University Road, Jaipur 302017 (demo address)',
    description:
      'A calm girls PG (demo listing) with furnished rooms, Wi-Fi and evening meals. Sample record used to demonstrate admin moderation tools.',
    facilities: ['Air Conditioning', 'High-speed WiFi', 'Mess / Meals', 'Daily Housekeeping', 'CCTV Security'],
    roomCategories: [
      { label: 'Double Sharing', sharing: 'Double', rent: 8800 },
      { label: 'Triple Sharing', sharing: 'Triple', rent: 7200 },
    ],
    coverImage: photo('1522771739844-6a9f6d5f14af'),
    gallery: [
      photo('1522771739844-6a9f6d5f14af'),
      photo('1540518614846-7eded433c457'),
      photo('1484154218962-a197022b5858'),
    ],
  },
  {
    id: 'pg-008',
    name: 'Maple Stay Boys PG',
    ownerId: 'own-003',
    ownerName: 'Mahesh Gupta (demo)',
    city: 'Jaipur',
    locality: 'Sodala',
    category: 'Boys',
    registeredOn: '2026-04-21',
    status: 'PENDING',
    statusNote: 'New submission — demo state.',
    rent: 7900,
    address: 'H-2, Sodala, Near Hawa Sadak, Jaipur 302019 (demo address)',
    description:
      'A budget boys PG (demo listing) with shared rooms and laundry access. Included as a second pending record for the moderation queue.',
    facilities: ['High-speed WiFi', 'Laundry Service', 'Power Backup', 'Parking'],
    roomCategories: [
      { label: 'Double Sharing', sharing: 'Double', rent: 7900 },
      { label: 'Triple Sharing', sharing: 'Triple', rent: 6500 },
    ],
    coverImage: photo('1560448204-e02f11c3d0e2'),
    gallery: [
      photo('1560448204-e02f11c3d0e2'),
      photo('1493809842364-78817add7ffb'),
      photo('1600607687939-ce8a6c25118c'),
    ],
  },
]

export const ADMIN_PGS: AdminPg[] = [...ADMIN_PG_LIST, ...EXTRA_ADMIN_PG]

/* -------------------------------------------------------------- owners */

export const OWNERS: OwnerRecord[] = [
  {
    id: 'own-001',
    name: 'Rakesh Sharma (demo)',
    email: 'owner1@rahomitra.demo',
    city: 'Jaipur',
    status: 'ACTIVE',
    joinedOn: '2026-01-15',
    planId: 'professional',
    subscriptionStatus: 'ACTIVE',
    pgIds: ['pg-001'],
  },
  {
    id: 'own-002',
    name: 'Sunita Verma (demo)',
    email: 'owner2@rahomitra.demo',
    city: 'Jaipur',
    status: 'ACTIVE',
    joinedOn: '2026-02-01',
    planId: 'starter',
    subscriptionStatus: 'ACTIVE',
    pgIds: ['pg-002'],
  },
  {
    id: 'own-003',
    name: 'Mahesh Gupta (demo)',
    email: 'owner3@rahomitra.demo',
    city: 'Jaipur',
    status: 'ACTIVE',
    joinedOn: '2026-03-08',
    planId: 'starter',
    subscriptionStatus: 'EXPIRING_SOON',
    pgIds: ['pg-003', 'pg-008'],
  },
  {
    id: 'own-004',
    name: 'Kavita Joshi (demo)',
    email: 'owner4@rahomitra.demo',
    city: 'Jaipur',
    status: 'ACTIVE',
    joinedOn: '2026-03-20',
    planId: 'professional',
    subscriptionStatus: 'ACTIVE',
    pgIds: ['pg-004'],
  },
  {
    id: 'own-005',
    name: 'Aman Trivedi (demo)',
    email: 'owner5@rahomitra.demo',
    city: 'Jaipur',
    status: 'SUSPENDED',
    joinedOn: '2026-02-18',
    planId: 'starter',
    subscriptionStatus: 'EXPIRED',
    pgIds: ['pg-005'],
  },
  {
    id: 'own-006',
    name: 'Deepak Rathore (demo)',
    email: 'owner6@rahomitra.demo',
    city: 'Jaipur',
    status: 'ACTIVE',
    joinedOn: '2026-03-30',
    planId: 'starter',
    subscriptionStatus: 'CANCELLED',
    pgIds: ['pg-006'],
  },
  {
    id: 'own-007',
    name: 'Pooja Mehta (demo)',
    email: 'owner7@rahomitra.demo',
    city: 'Jaipur',
    status: 'ACTIVE',
    joinedOn: '2026-04-02',
    planId: 'professional',
    subscriptionStatus: 'ACTIVE',
    pgIds: ['pg-007'],
  },
]

/* ---------------------------------------------------------- students */

export const STUDENTS: StudentRecord[] = [
  {
    id: 'stu-001',
    name: 'Aarav Kapoor (demo)',
    email: 'student1@rahomitra.demo',
    pgId: 'pg-001',
    pgName: 'Shree Shyam Boys PG',
    city: 'Jaipur',
    membership: 'ACTIVE',
    registeredOn: '2026-01-22',
  },
  {
    id: 'stu-002',
    name: 'Diya Malhotra (demo)',
    email: 'student2@rahomitra.demo',
    pgId: 'pg-002',
    pgName: 'Ashiana PG',
    city: 'Jaipur',
    membership: 'ACTIVE',
    registeredOn: '2026-02-11',
  },
  {
    id: 'stu-003',
    name: 'Kabir Singh (demo)',
    email: 'student3@rahomitra.demo',
    pgId: 'pg-003',
    pgName: 'GreenLeaf Boys PG',
    city: 'Jaipur',
    membership: 'INACTIVE',
    registeredOn: '2026-02-25',
  },
  {
    id: 'stu-004',
    name: 'Ishita Rao (demo)',
    email: 'student4@rahomitra.demo',
    pgId: 'pg-004',
    pgName: 'Sunrise Girls PG',
    city: 'Jaipur',
    membership: 'ACTIVE',
    registeredOn: '2026-03-05',
  },
  {
    id: 'stu-005',
    name: 'Rohan Das (demo)',
    email: 'student5@rahomitra.demo',
    pgId: 'pg-005',
    pgName: 'Nest Co-living',
    city: 'Jaipur',
    membership: 'ACTIVE',
    registeredOn: '2026-03-19',
  },
  {
    id: 'stu-006',
    name: 'Meera Nair (demo)',
    email: 'student6@rahomitra.demo',
    pgId: null,
    pgName: '—',
    city: 'Jaipur',
    membership: 'INACTIVE',
    registeredOn: '2026-04-06',
  },
  {
    id: 'stu-007',
    name: 'Vikram Chouhan (demo)',
    email: 'student7@rahomitra.demo',
    pgId: 'pg-007',
    pgName: 'Nirvana Girls PG',
    city: 'Jaipur',
    membership: 'ACTIVE',
    registeredOn: '2026-04-14',
  },
  {
    id: 'stu-008',
    name: 'Sara Khan (demo)',
    email: 'student8@rahomitra.demo',
    pgId: null,
    pgName: '—',
    city: 'Jaipur',
    membership: 'INACTIVE',
    registeredOn: '2026-04-27',
  },
]

/* ------------------------------------------------------- applications */

export const APPLICATIONS: OwnerApplication[] = [
  {
    id: 'app-001',
    ownerName: 'Mahesh Gupta (demo)',
    email: 'owner3@rahomitra.demo',
    pgName: 'GreenLeaf Boys PG',
    city: 'Jaipur',
    category: 'Boys',
    submittedOn: '2026-03-08',
    status: 'APPROVED',
    note: 'Submitted via the owner signup flow (demo).',
  },
  {
    id: 'app-002',
    ownerName: 'Kavita Joshi (demo)',
    email: 'owner4@rahomitra.demo',
    pgName: 'Sunrise Girls PG',
    city: 'Jaipur',
    category: 'Girls',
    submittedOn: '2026-03-20',
    status: 'APPROVED',
    note: 'Submitted via the owner signup flow (demo).',
  },
  {
    id: 'app-003',
    ownerName: 'Aman Trivedi (demo)',
    email: 'owner5@rahomitra.demo',
    pgName: 'Nest Co-living',
    city: 'Jaipur',
    category: 'Co-living',
    submittedOn: '2026-02-18',
    status: 'APPROVED',
    note: 'Later suspended in the PG moderation queue (demo).',
  },
  {
    id: 'app-004',
    ownerName: 'Deepak Rathore (demo)',
    email: 'owner6@rahomitra.demo',
    pgName: 'Amber Boys PG',
    city: 'Jaipur',
    category: 'Boys',
    submittedOn: '2026-03-30',
    status: 'REJECTED',
    rejectionReason: 'Address proof document unreadable — please re-upload (demo reason).',
    note: 'Rejected during document review (demo).',
  },
  {
    id: 'app-005',
    ownerName: 'Harish Pant (demo)',
    email: 'owner8@rahomitra.demo',
    pgName: 'Maple Stay Boys PG',
    city: 'Jaipur',
    category: 'Boys',
    submittedOn: '2026-04-21',
    status: 'PENDING',
    note: 'New application awaiting first review (demo).',
  },
  {
    id: 'app-006',
    ownerName: 'Neelam Arya (demo)',
    email: 'owner9@rahomitra.demo',
    pgName: 'Lotus Girls Hostel',
    city: 'Jaipur',
    category: 'Girls',
    submittedOn: '2026-05-02',
    status: 'PENDING',
    note: 'New application awaiting first review (demo).',
  },
  {
    id: 'app-007',
    ownerName: 'Farhan Qureshi (demo)',
    email: 'owner10@rahomitra.demo',
    pgName: 'Urban Nest Co-living',
    city: 'Jaipur',
    category: 'Co-living',
    submittedOn: '2026-05-09',
    status: 'PENDING',
    note: 'New application awaiting first review (demo).',
  },
]

/* --------------------------------------------------------------- plans */

/** Default SaaS plans — three tiers per the Section 08 spec (demo pricing). */
export const PLANS: PlanRecord[] = [
  {
    id: 'starter',
    name: 'STARTER',
    tagline: 'Manage up to 1 PG property with everything you need to get started.',
    features: [
      'Manage up to 1 PG property',
      'Basic room and bed management',
      'Student management',
      'Monthly billing management',
      'Basic reports',
      'Standard support',
    ],
    priceMonthly: 299,
    priceYearly: 2990,
    status: 'ENABLED',
    propertyLimit: 1,
    billing: 'MONTHLY',
    featureToggles: [
      { key: 'pg_limit_1', label: 'Manage up to 1 PG property', enabled: true },
      { key: 'rooms', label: 'Basic room and bed management', enabled: true },
      { key: 'students', label: 'Student management', enabled: true },
      { key: 'billing', label: 'Monthly billing management', enabled: true },
      { key: 'reports_basic', label: 'Basic reports', enabled: true },
      { key: 'support_standard', label: 'Standard support', enabled: true },
      { key: 'staff', label: 'Staff management', enabled: false },
      { key: 'analytics', label: 'Advanced analytics', enabled: false },
      { key: 'featured_eligibility', label: 'Featured listing eligibility', enabled: false },
    ],
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    tagline: 'All Starter features plus advanced billing, staff and occupancy reports.',
    features: [
      'Manage up to 3 PG properties',
      'All Starter features',
      'Advanced billing management',
      'Staff management',
      'Announcements and complaints',
      'Occupancy reports',
      'Priority support',
    ],
    priceMonthly: 599,
    priceYearly: 5990,
    status: 'ENABLED',
    propertyLimit: 3,
    billing: 'MONTHLY',
    featureToggles: [
      { key: 'pg_limit_3', label: 'Manage up to 3 PG properties', enabled: true },
      { key: 'rooms', label: 'Basic room and bed management', enabled: true },
      { key: 'students', label: 'Student management', enabled: true },
      { key: 'billing', label: 'Monthly billing management', enabled: true },
      { key: 'reports_basic', label: 'Basic reports', enabled: true },
      { key: 'support_priority', label: 'Priority support', enabled: true },
      { key: 'billing_advanced', label: 'Advanced billing management', enabled: true },
      { key: 'staff', label: 'Staff management', enabled: true },
      { key: 'comms', label: 'Announcements and complaints', enabled: true },
      { key: 'occupancy', label: 'Occupancy reports', enabled: true },
      { key: 'analytics', label: 'Advanced analytics', enabled: false },
      { key: 'featured_eligibility', label: 'Featured listing eligibility', enabled: false },
    ],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    tagline: 'All Professional features plus advanced analytics and featured listing eligibility.',
    features: [
      'Manage up to 10 PG properties',
      'All Professional features',
      'Advanced analytics',
      'Detailed revenue reports',
      'Featured listing eligibility',
      'Advanced platform tools',
      'Premium support',
    ],
    priceMonthly: 999,
    priceYearly: 9990,
    status: 'ENABLED',
    propertyLimit: 10,
    billing: 'MONTHLY',
    featureToggles: [
      { key: 'pg_limit_10', label: 'Manage up to 10 PG properties', enabled: true },
      { key: 'rooms', label: 'Basic room and bed management', enabled: true },
      { key: 'students', label: 'Student management', enabled: true },
      { key: 'billing', label: 'Monthly billing management', enabled: true },
      { key: 'reports_basic', label: 'Basic reports', enabled: true },
      { key: 'support_priority', label: 'Priority support', enabled: true },
      { key: 'billing_advanced', label: 'Advanced billing management', enabled: true },
      { key: 'staff', label: 'Staff management', enabled: true },
      { key: 'comms', label: 'Announcements and complaints', enabled: true },
      { key: 'occupancy', label: 'Occupancy reports', enabled: true },
      { key: 'analytics', label: 'Advanced analytics', enabled: true },
      { key: 'revenue', label: 'Detailed revenue reports', enabled: true },
      { key: 'featured_eligibility', label: 'Featured listing eligibility', enabled: true },
      { key: 'tools', label: 'Advanced platform tools', enabled: true },
      { key: 'support_premium', label: 'Premium support', enabled: true },
    ],
  },
]

/* ------------------------------------------------------ subscriptions */

const subEvent = (id: string, on: string, text: string) => ({ id, on, text })

export const SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: 'sub-001',
    pgName: 'Shree Shyam Boys PG',
    ownerName: 'Rakesh Sharma (demo)',
    planId: 'professional',
    cycle: 'MONTHLY',
    startOn: '2026-05-01',
    expiryOn: '2026-06-01',
    status: 'ACTIVE',
    amount: 599,
    events: [
      subEvent('evt-1', '2026-05-01', 'Subscription renewed on PROFESSIONAL (demo).'),
      subEvent('evt-2', '2026-04-01', 'Subscription renewed on PROFESSIONAL (demo).'),
    ],
  },
  {
    id: 'sub-002',
    pgName: 'Ashiana PG',
    ownerName: 'Sunita Verma (demo)',
    planId: 'starter',
    cycle: 'YEARLY',
    startOn: '2025-11-20',
    expiryOn: '2026-11-20',
    status: 'ACTIVE',
    amount: 2990,
    events: [
      subEvent('evt-3', '2025-11-20', 'Yearly STARTER subscription purchased (demo).'),
    ],
  },
  {
    id: 'sub-003',
    pgName: 'GreenLeaf Boys PG',
    ownerName: 'Mahesh Gupta (demo)',
    planId: 'starter',
    cycle: 'MONTHLY',
    startOn: '2026-04-10',
    expiryOn: '2026-05-10',
    status: 'EXPIRING_SOON',
    amount: 299,
    events: [
      subEvent('evt-4', '2026-04-10', 'Monthly STARTER subscription started (demo).'),
    ],
  },
  {
    id: 'sub-004',
    pgName: 'Sunrise Girls PG',
    ownerName: 'Kavita Joshi (demo)',
    planId: 'premium',
    cycle: 'YEARLY',
    startOn: '2026-03-20',
    expiryOn: '2027-03-20',
    status: 'ACTIVE',
    amount: 9990,
    events: [
      subEvent('evt-5', '2026-03-20', 'Upgraded to PREMIUM yearly (demo).'),
      subEvent('evt-6', '2025-09-20', 'Started on STARTER yearly (demo).'),
    ],
  },
  {
    id: 'sub-005',
    pgName: 'Nest Co-living',
    ownerName: 'Aman Trivedi (demo)',
    planId: 'starter',
    cycle: 'MONTHLY',
    startOn: '2026-02-18',
    expiryOn: '2026-03-18',
    status: 'EXPIRED',
    amount: 299,
    events: [
      subEvent('evt-7', '2026-03-18', 'Subscription expired — not renewed (demo).'),
      subEvent('evt-8', '2026-02-18', 'Monthly STARTER subscription started (demo).'),
    ],
  },
  {
    id: 'sub-006',
    pgName: 'Amber Boys PG',
    ownerName: 'Deepak Rathore (demo)',
    planId: 'starter',
    cycle: 'MONTHLY',
    startOn: '2026-03-30',
    expiryOn: '2026-04-30',
    status: 'CANCELLED',
    amount: 299,
    events: [
      subEvent('evt-9', '2026-04-05', 'Subscription cancelled by owner (demo).'),
      subEvent('evt-10', '2026-03-30', 'Monthly STARTER subscription started (demo).'),
    ],
  },
  {
    id: 'sub-007',
    pgName: 'Nirvana Girls PG',
    ownerName: 'Pooja Mehta (demo)',
    planId: 'professional',
    cycle: 'MONTHLY',
    startOn: '2026-04-02',
    expiryOn: '2026-06-02',
    status: 'ACTIVE',
    amount: 599,
    events: [
      subEvent('evt-11', '2026-05-02', 'Subscription extended by 30 days (demo).'),
      subEvent('evt-12', '2026-04-02', 'Monthly PROFESSIONAL subscription started (demo).'),
    ],
  },
  {
    id: 'sub-008',
    pgName: 'Maple Stay Boys PG',
    ownerName: 'Mahesh Gupta (demo)',
    planId: 'starter',
    cycle: 'MONTHLY',
    startOn: '2026-04-21',
    expiryOn: '2026-05-21',
    status: 'EXPIRING_SOON',
    amount: 299,
    events: [
      subEvent('evt-13', '2026-04-21', 'Monthly STARTER subscription started (demo).'),
    ],
  },
  {
    id: 'sub-009',
    pgName: 'Lotus Girls Hostel',
    ownerName: 'Neelam Arya (demo)',
    planId: 'starter',
    cycle: 'MONTHLY',
    startOn: '2026-05-05',
    expiryOn: '2026-05-19',
    status: 'TRIAL',
    amount: 0,
    events: [
      subEvent('evt-14', '2026-05-05', '14-day free trial started (demo).'),
    ],
  },
  {
    id: 'sub-010',
    pgName: 'Urban Nest Co-living',
    ownerName: 'Farhan Qureshi (demo)',
    planId: 'professional',
    cycle: 'MONTHLY',
    startOn: '2026-05-12',
    expiryOn: '2026-06-12',
    status: 'PENDING',
    amount: 599,
    events: [
      subEvent('evt-15', '2026-05-12', 'Subscription created — awaiting demo payment confirmation (demo).'),
    ],
  },
]

/* ------------------------------------------------------------- payments */

/** RahoMitra SaaS subscription payments only — never student rent payments. */
export const PAYMENTS: PaymentRecord[] = [
  {
    id: 'RM-DEMO-1001',
    ownerName: 'Rakesh Sharma (demo)',
    pgName: 'Shree Shyam Boys PG',
    planId: 'professional',
    amount: 599,
    paidOn: '2026-05-01',
    status: 'SUCCESS',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1002',
    ownerName: 'Sunita Verma (demo)',
    pgName: 'Ashiana PG',
    planId: 'starter',
    amount: 2990,
    paidOn: '2025-11-20',
    status: 'SUCCESS',
    method: 'Card (demo)',
  },
  {
    id: 'RM-DEMO-1003',
    ownerName: 'Mahesh Gupta (demo)',
    pgName: 'GreenLeaf Boys PG',
    planId: 'starter',
    amount: 299,
    paidOn: '2026-04-10',
    status: 'SUCCESS',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1004',
    ownerName: 'Kavita Joshi (demo)',
    pgName: 'Sunrise Girls PG',
    planId: 'professional',
    amount: 5990,
    paidOn: '2026-03-20',
    status: 'SUCCESS',
    method: 'Netbanking (demo)',
  },
  {
    id: 'RM-DEMO-1005',
    ownerName: 'Aman Trivedi (demo)',
    pgName: 'Nest Co-living',
    planId: 'starter',
    amount: 299,
    paidOn: '2026-02-18',
    status: 'REFUNDED',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1006',
    ownerName: 'Pooja Mehta (demo)',
    pgName: 'Nirvana Girls PG',
    planId: 'professional',
    amount: 599,
    paidOn: '2026-04-02',
    status: 'SUCCESS',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1007',
    ownerName: 'Mahesh Gupta (demo)',
    pgName: 'Maple Stay Boys PG',
    planId: 'starter',
    amount: 299,
    paidOn: '2026-05-11',
    status: 'PENDING',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1008',
    ownerName: 'Deepak Rathore (demo)',
    pgName: 'Amber Boys PG',
    planId: 'starter',
    amount: 299,
    paidOn: '2026-03-30',
    status: 'FAILED',
    method: 'Card (demo)',
  },
]

/* -------------------------------------------------------------- tickets */

export const TICKETS: SupportTicket[] = [
  {
    id: 'TCK-101',
    subject: 'Listing photos are not appearing',
    raisedBy: 'Sunita Verma (demo)',
    raisedRole: 'Owner',
    category: 'Listings',
    priority: 'HIGH',
    status: 'OPEN',
    createdOn: '2026-05-10',
    description:
      'Uploaded gallery images for Ashiana PG do not show on the public page (demo complaint text).',
    notes: [],
  },
  {
    id: 'TCK-102',
    subject: 'Unable to update subscription plan',
    raisedBy: 'Mahesh Gupta (demo)',
    raisedRole: 'Owner',
    category: 'Billing',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdOn: '2026-05-08',
    description:
      'The change-plan button appears stuck after selecting PRO (demo complaint text).',
    notes: [
      {
        id: 'note-1',
        text: 'Reproduced in the demo build — checking state updates (internal demo note).',
        on: '2026-05-09',
      },
    ],
  },
  {
    id: 'TCK-103',
    subject: 'OTP email never arrives',
    raisedBy: 'Aarav Kapoor (demo)',
    raisedRole: 'Student',
    category: 'Authentication',
    priority: 'URGENT',
    status: 'OPEN',
    createdOn: '2026-05-12',
    description:
      'Student signup OTP is not received on the registered demo email address (demo complaint text).',
    notes: [],
  },
  {
    id: 'TCK-104',
    subject: 'Incorrect rent displayed on explore page',
    raisedBy: 'Diya Malhotra (demo)',
    raisedRole: 'Student',
    category: 'Listings',
    priority: 'LOW',
    status: 'RESOLVED',
    createdOn: '2026-04-28',
    description:
      'Rent shown for a listing did not match the owner update (demo complaint text).',
    notes: [
      {
        id: 'note-2',
        text: 'Owner updated the demo listing — resolved (internal demo note).',
        on: '2026-04-30',
      },
    ],
  },
  {
    id: 'TCK-105',
    subject: 'Dashboard loading slowly',
    raisedBy: 'Rakesh Sharma (demo)',
    raisedRole: 'Owner',
    category: 'Platform',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdOn: '2026-05-05',
    description: 'Owner dashboard takes several seconds to load (demo complaint text).',
    notes: [],
  },
  {
    id: 'TCK-106',
    subject: 'Request to add a new city',
    raisedBy: 'Pooja Mehta (demo)',
    raisedRole: 'Owner',
    category: 'Feature request',
    priority: 'LOW',
    status: 'CLOSED',
    createdOn: '2026-04-15',
    description: 'Owner asks for additional city coverage (demo complaint text).',
    notes: [],
  },
  {
    id: 'TCK-107',
    subject: 'Refund not reflected in payment records',
    raisedBy: 'Aman Trivedi (demo)',
    raisedRole: 'Owner',
    category: 'Billing',
    priority: 'HIGH',
    status: 'OPEN',
    createdOn: '2026-05-13',
    description:
      'Refunded subscription amount is not visible in the payment history (demo complaint text).',
    notes: [],
  },
]

/* ------------------------------------------------------- notifications */

export const NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'ntf-001',
    title: 'Scheduled maintenance window',
    message:
      'The RahoMitra platform will undergo maintenance on Sunday 2:00–4:00 AM IST (demo announcement).',
    category: 'MAINTENANCE',
    audience: 'ALL_OWNERS',
    sentOn: '2026-05-12',
    read: false,
  },
  {
    id: 'ntf-002',
    title: 'New PRO plan features',
    message:
      'Detailed reports are now included in the PRO plan for demo owners (demo announcement).',
    category: 'FEATURE',
    audience: 'ALL_OWNERS',
    sentOn: '2026-05-09',
    read: false,
  },
  {
    id: 'ntf-003',
    title: 'Profile verification reminder',
    message:
      'Complete your student profile to improve PG shortlisting (demo announcement).',
    category: 'PLATFORM',
    audience: 'ALL_STUDENTS',
    sentOn: '2026-05-06',
    read: true,
  },
  {
    id: 'ntf-004',
    title: 'Subscription renewal reminder',
    message:
      'Your plan expires soon — renew to keep listings active (demo announcement).',
    category: 'SUBSCRIPTION',
    audience: 'SELECTED_OWNERS',
    sentOn: '2026-05-03',
    read: true,
  },
  {
    id: 'ntf-005',
    title: 'Support SLA update',
    message:
      'First response time for urgent tickets is now 4 hours (demo announcement).',
    category: 'SUPPORT',
    audience: 'ALL_OWNERS',
    sentOn: '2026-04-29',
    read: true,
  },
]

/* ----------------------------------------------------------- activities */

export const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    text: 'New owner application from Harish Pant (demo)',
    time: '2 hours ago',
    kind: 'owner',
    admin: 'Super Admin (demo)',
    action: 'Owner application received',
    entity: 'app-005 · Maple Stay Boys PG',
    description: 'Application submitted via the owner signup flow and queued for review (demo).',
    at: '2026-05-14 09:20',
  },
  {
    id: 'act-2',
    text: 'GreenLeaf Boys PG listing approved (demo)',
    time: '5 hours ago',
    kind: 'pg',
    admin: 'Super Admin (demo)',
    action: 'PG listing approved',
    entity: 'pg-003 · GreenLeaf Boys PG',
    description: 'Documents verified and the demo listing published to Explore (demo action).',
    at: '2026-05-14 06:35',
  },
  {
    id: 'act-3',
    text: 'Student Sara Khan registered (demo)',
    time: '8 hours ago',
    kind: 'student',
    admin: 'System (demo)',
    action: 'Student registration',
    entity: 'stu-008 · Sara Khan',
    description: 'New student account created on the demo platform (no email sent).',
    at: '2026-05-14 03:10',
  },
  {
    id: 'act-4',
    text: 'PRO subscription renewed for Nirvana Girls PG (demo)',
    time: '1 day ago',
    kind: 'subscription',
    admin: 'Super Admin (demo)',
    action: 'Subscription extended',
    entity: 'sub-007 · Nirvana Girls PG',
    description: 'PROFESSIONAL monthly subscription extended by 30 days (demo only).',
    at: '2026-05-13 11:45',
  },
  {
    id: 'act-5',
    text: 'Urgent ticket TCK-103 raised by a student (demo)',
    time: '1 day ago',
    kind: 'support',
    admin: 'System (demo)',
    action: 'Support ticket created',
    entity: 'TCK-103',
    description: 'URGENT priority ticket received from a demo student account.',
    at: '2026-05-13 08:02',
  },
  {
    id: 'act-6',
    text: 'Nest Co-living listing suspended (demo)',
    time: '2 days ago',
    kind: 'pg',
    admin: 'Super Admin (demo)',
    action: 'PG listing suspended',
    entity: 'pg-005 · Nest Co-living',
    description: 'Listing suspended for demo rule violations — visible in PG Management.',
    at: '2026-05-12 15:30',
  },
  {
    id: 'act-7',
    text: 'Payment RM-DEMO-1007 marked pending (demo)',
    time: '3 days ago',
    kind: 'subscription',
    admin: 'System (demo)',
    action: 'Payment status changed',
    entity: 'RM-DEMO-1007 · Maple Stay Boys PG',
    description: 'Demo subscription payment marked PENDING — no real transaction exists.',
    at: '2026-05-11 10:15',
  },
  {
    id: 'act-8',
    text: 'Application from Deepak Rathore rejected (demo)',
    time: '4 days ago',
    kind: 'owner',
    admin: 'Super Admin (demo)',
    action: 'Owner application rejected',
    entity: 'app-004 · Amber Boys PG',
    description: 'Address proof unreadable — rejected with a demo reason.',
    at: '2026-05-10 13:50',
  },
]

/* --------------------------------------------------------- chart series */

/** Monthly demo series — Jan 2026 → Apr 2026 (4 points). */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr'] as const

export const SERIES = {
  pgRegistrations: [2, 3, 2, 1],
  ownerRegistrations: [2, 2, 2, 1],
  studentRegistrations: [1, 2, 2, 3],
  /** Illustrative subscription revenue in ₹ (demo only). */
  revenue: [1998, 4491, 3493, 1498],
  monthlySubscriptions: [4, 5, 6, 7],
} as const

/** Plan distribution across demo subscriptions. */
export const PLAN_DISTRIBUTION = [
  { label: 'STARTER', value: 5, color: '#173D32' },
  { label: 'PROFESSIONAL', value: 3, color: '#C49A52' },
  { label: 'PREMIUM', value: 1, color: '#252A27' },
]

/** Application approval ratio (demo). */
export const APPROVAL_RATIO = [
  { label: 'Approved', value: 3, color: '#1F5143' },
  { label: 'Rejected', value: 1, color: '#B3402F' },
  { label: 'Pending', value: 3, color: '#C49A52' },
]

/* ======================================================== SECTION 08 === */

/* ---------------------------------------------------- featured listings */

const featuredHistory = (id: string, on: string, text: string) => ({ id, on, text })

/** Owner featured-placement requests — all demo records, no real payment. */
export const FEATURED_REQUESTS: FeaturedRequest[] = [
  {
    id: 'FLT-001',
    pgId: 'pg-001',
    pgName: 'Shree Shyam Boys PG',
    ownerName: 'Rakesh Sharma (demo)',
    tier: 'PREMIUM_FEATURED',
    amount: 499,
    requestedOn: '2026-05-02',
    status: 'APPROVED',
    durationMonths: 3,
    startOn: '2026-05-05',
    endOn: '2026-08-05',
    listingStatus: 'ACTIVE',
    history: [
      featuredHistory('fh-1', '2026-05-05', 'Listing activated for a 3-month Premium Featured run (demo).'),
      featuredHistory('fh-2', '2026-05-03', 'Request approved by Super Admin (demo).'),
      featuredHistory('fh-3', '2026-05-02', 'Owner submitted a featured request (demo).'),
    ],
  },
  {
    id: 'FLT-002',
    pgId: 'pg-002',
    pgName: 'Ashiana PG',
    ownerName: 'Sunita Verma (demo)',
    tier: 'FEATURED',
    amount: 299,
    requestedOn: '2026-05-08',
    status: 'PENDING',
    history: [
      featuredHistory('fh-4', '2026-05-08', 'Owner submitted a featured request (demo).'),
    ],
  },
  {
    id: 'FLT-003',
    pgId: 'pg-004',
    pgName: 'Sunrise Girls PG',
    ownerName: 'Kavita Joshi (demo)',
    tier: 'FEATURED',
    amount: 299,
    requestedOn: '2026-04-10',
    status: 'APPROVED',
    durationMonths: 1,
    startOn: '2026-04-12',
    endOn: '2026-05-12',
    listingStatus: 'EXPIRED',
    history: [
      featuredHistory('fh-5', '2026-05-12', 'Featured run expired (demo).'),
      featuredHistory('fh-6', '2026-04-12', 'Listing activated for 1 month (demo).'),
      featuredHistory('fh-7', '2026-04-10', 'Owner submitted a featured request (demo).'),
    ],
  },
  {
    id: 'FLT-004',
    pgId: 'pg-006',
    pgName: 'Amber Boys PG',
    ownerName: 'Deepak Rathore (demo)',
    tier: 'FEATURED',
    amount: 299,
    requestedOn: '2026-04-25',
    status: 'REJECTED',
    rejectReason: 'Listing is not approved yet — featured placement requires an approved demo listing.',
    history: [
      featuredHistory('fh-8', '2026-04-26', 'Request rejected by Super Admin (demo).'),
      featuredHistory('fh-9', '2026-04-25', 'Owner submitted a featured request (demo).'),
    ],
  },
]

/* ---------------------------------------------------------- advertisements */

/** Illustrative demo ad campaigns — no ad network or tracking is connected. */
export const ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'AD-001',
    businessName: 'Annapurna Tiffin (demo)',
    category: 'Tiffin Services',
    title: 'Home-style tiffin from ₹2,499/month',
    description: 'Fresh vegetarian tiffin delivered near Malviya Nagar — illustrative demo ad copy.',
    destinationUrl: 'https://demo.rahomitra.demo/annapurna-tiffin',
    imagePreview:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    targetCity: 'Jaipur',
    targetLocality: 'Malviya Nagar',
    placement: 'Explore Banner',
    startOn: '2026-05-01',
    endOn: '2026-06-01',
    price: 3500,
    status: 'ACTIVE',
    createdOn: '2026-04-28',
  },
  {
    id: 'AD-002',
    businessName: 'FreshWash Laundry (demo)',
    category: 'Laundry Services',
    title: 'Wash & fold at ₹35/kg',
    description: 'Doorstep pickup for PG students — illustrative demo ad copy.',
    destinationUrl: 'https://demo.rahomitra.demo/freshwash',
    imagePreview:
      'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
    targetCity: 'Jaipur',
    targetLocality: 'Vaishali Nagar',
    placement: 'Listing Card',
    startOn: '2026-05-05',
    endOn: '2026-07-05',
    price: 2800,
    status: 'ACTIVE',
    createdOn: '2026-05-02',
  },
  {
    id: 'AD-003',
    businessName: 'UrbanNest Furniture (demo)',
    category: 'Furniture',
    title: 'Study desks & wardrobes on rent',
    description: 'Monthly furniture rentals for students — illustrative demo ad copy.',
    destinationUrl: 'https://demo.rahomitra.demo/urbannest-furniture',
    imagePreview:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    targetCity: 'Jaipur',
    targetLocality: 'Gopalpura',
    placement: 'Sidebar Rail',
    startOn: '2026-04-15',
    endOn: '2026-05-15',
    price: 1999,
    status: 'PAUSED',
    createdOn: '2026-04-12',
  },
  {
    id: 'AD-004',
    businessName: 'GigaStream Broadband (demo)',
    category: 'Internet Services',
    title: '200 Mbps unlimited from ₹699/month',
    description: 'Fibre internet for PG residents — illustrative demo ad copy.',
    destinationUrl: 'https://demo.rahomitra.demo/gigastream',
    imagePreview:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    targetCity: 'Jaipur',
    targetLocality: 'All localities',
    placement: 'Home Footer',
    startOn: '2026-05-10',
    endOn: '2026-08-10',
    price: 4500,
    status: 'ACTIVE',
    createdOn: '2026-05-08',
  },
  {
    id: 'AD-005',
    businessName: 'CityRide Auto (demo)',
    category: 'Local Transport',
    title: 'Student auto passes at ₹999/month',
    description: 'Shared auto routes near college campuses — illustrative demo ad copy.',
    destinationUrl: 'https://demo.rahomitra.demo/cityride',
    imagePreview:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    targetCity: 'Jaipur',
    targetLocality: 'Sodala',
    placement: 'Explore Banner',
    startOn: '2026-03-01',
    endOn: '2026-04-01',
    price: 2200,
    status: 'EXPIRED',
    createdOn: '2026-02-25',
  },
]

/* ------------------------------------------------------- platform settings */

/** Default platform settings — Save / Reset operate on local demo state only. */
export const PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'RAHO MITRA',
  hindiName: 'रहो मित्र',
  tagline: 'आपके रहने का डिजिटल साथी',
  description:
    'RahoMitra is a frontend demo platform for discovering PG accommodation, managing properties and handling student admissions — everything shown here is illustrative sample data.',
  supportEmail: 'support@rahomitra.demo',
  supportPhone: '+91 98765 43210 (demo)',
  currency: 'INR (₹)',
  country: 'India',
  timezone: 'Asia/Kolkata',
  logoPreview: '/RahoMitra_logo.png',
  faviconPreview: '/RahoMitra_logo.png',
  brandColors: {
    forest: '#173D32',
    ivory: '#F5F1E7',
    gold: '#C49A52',
    dark: '#252A27',
  },
  websiteTitle: 'RahoMitra — Find your perfect PG',
  footerDescription:
    'RahoMitra helps students discover PG accommodation and helps owners manage their properties — demo build, illustrative data only.',
  trialDurationDays: 14,
  gracePeriodDays: 7,
  featuredPrice: 299,
  premiumFeaturedPrice: 499,
  adPriceBase: 2000,
  notify: {
    newOwnerApplication: true,
    newPgApproval: true,
    newStudentRegistration: false,
    newComplaint: true,
    subscriptionExpiry: true,
    featuredRequest: true,
  },
  maintenanceMode: false,
  maintenanceMessage:
    'RahoMitra is undergoing scheduled maintenance. Please check back in a little while. (Demo message — no real maintenance mode exists.)',
}

/* ------------------------------------------------ platform support tickets */

const reply = (
  id: string,
  author: string,
  role: 'Admin' | 'User',
  text: string,
  on: string,
): PlatformTicket['replies'][number] => ({ id, author, role, text, on })

/** Centralised platform-level support tickets (separate from PG complaints). */
export const PLATFORM_TICKETS: PlatformTicket[] = [
  {
    id: 'PTS-1001',
    submittedBy: 'Rakesh Sharma (demo)',
    userRole: 'Owner',
    category: 'Subscription',
    subject: 'Upgrade button does not change my plan',
    description:
      'I selected PREMIUM on the subscription screen but my dashboard still shows the old plan (demo complaint text).',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdOn: '2026-05-12',
    assignedTo: 'Anjali Verma (demo staff)',
    replies: [
      reply(
        'r1',
        'Anjali Verma (demo staff)',
        'Admin',
        'Thanks for reporting — could you confirm which plan you expect to see? (demo response)',
        '2026-05-12',
      ),
      reply('r2', 'Rakesh Sharma (demo)', 'User', 'It should show PREMIUM (demo reply).', '2026-05-13'),
    ],
  },
  {
    id: 'PTS-1002',
    submittedBy: 'Aarav Kapoor (demo)',
    userRole: 'Student',
    category: 'Student Account',
    subject: 'Cannot reset my account password',
    description:
      'The reset link screen loops back to the login page after submitting (demo complaint text).',
    priority: 'URGENT',
    status: 'OPEN',
    createdOn: '2026-05-13',
    assignedTo: null,
    replies: [],
  },
  {
    id: 'PTS-1003',
    submittedBy: 'Sunita Verma (demo)',
    userRole: 'Owner',
    category: 'PG Listing',
    subject: 'Gallery photos missing after approval',
    description:
      'Only the cover image appears on my public listing page (demo complaint text).',
    priority: 'MEDIUM',
    status: 'WAITING_USER',
    createdOn: '2026-05-10',
    assignedTo: 'Rohit Malhotra (demo staff)',
    replies: [
      reply(
        'r3',
        'Rohit Malhotra (demo staff)',
        'Admin',
        'Could you re-upload one gallery image so we can check? (demo response)',
        '2026-05-11',
      ),
    ],
  },
  {
    id: 'PTS-1004',
    submittedBy: 'Mahesh Gupta (demo)',
    userRole: 'Owner',
    category: 'Billing',
    subject: 'Invoice PDF shows an old plan name',
    description:
      'My latest demo invoice still says BASIC instead of STARTER (demo complaint text).',
    priority: 'LOW',
    status: 'RESOLVED',
    createdOn: '2026-05-04',
    assignedTo: 'Anjali Verma (demo staff)',
    replies: [
      reply(
        'r4',
        'Anjali Verma (demo staff)',
        'Admin',
        'Updated in the demo build — plan names are refreshed everywhere now (demo response).',
        '2026-05-06',
      ),
    ],
  },
  {
    id: 'PTS-1005',
    submittedBy: 'Diya Malhotra (demo)',
    userRole: 'Student',
    category: 'Technical Issue',
    subject: 'Explore filters freeze on mobile',
    description:
      'Applying two filters in a row freezes the results list on a phone browser (demo complaint text).',
    priority: 'HIGH',
    status: 'OPEN',
    createdOn: '2026-05-14',
    assignedTo: null,
    replies: [],
  },
  {
    id: 'PTS-1006',
    submittedBy: 'Pooja Mehta (demo)',
    userRole: 'Owner',
    category: 'Owner Account',
    subject: 'Change the registered owner email',
    description:
      'I want my demo account email updated to a different fictional address (demo request text).',
    priority: 'MEDIUM',
    status: 'CLOSED',
    createdOn: '2026-04-20',
    assignedTo: 'Rohit Malhotra (demo staff)',
    replies: [
      reply(
        'r5',
        'Rohit Malhotra (demo staff)',
        'Admin',
        'Email changes need backend support — noted for a future release (demo response).',
        '2026-04-21',
      ),
    ],
  },
  {
    id: 'PTS-1007',
    submittedBy: 'Guest Visitor (demo)',
    userRole: 'Guest',
    category: 'Other',
    subject: 'How do I contact a PG owner?',
    description:
      'Contact details are not visible on the listing page (demo question text).',
    priority: 'LOW',
    status: 'OPEN',
    createdOn: '2026-05-09',
    assignedTo: null,
    replies: [],
  },
]

/** Demo support staff available for assignment (fictional names). */
export const SUPPORT_STAFF = [
  'Anjali Verma (demo staff)',
  'Rohit Malhotra (demo staff)',
  'Kiran Joshi (demo staff)',
] as const
