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
  OwnerApplication,
  OwnerRecord,
  PaymentRecord,
  PlanRecord,
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
    planId: 'pro',
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
    planId: 'basic',
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
    planId: 'basic',
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
    planId: 'pro',
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
    planId: 'basic',
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
    planId: 'basic',
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
    planId: 'pro',
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

export const PLANS: PlanRecord[] = [
  {
    id: 'basic',
    name: 'BASIC PLAN',
    tagline: 'Basic PG management with limited features and standard support.',
    features: [
      'Basic PG management',
      'Limited management features',
      'Standard support',
      'Up to 3 PG listings',
    ],
    priceMonthly: 499,
    priceYearly: 4990,
    status: 'ENABLED',
  },
  {
    id: 'pro',
    name: 'PRO PLAN',
    tagline: 'Advanced PG management, detailed reports and priority support.',
    features: [
      'Advanced PG management',
      'Detailed reports',
      'Priority support',
      'Unlimited PG listings',
    ],
    priceMonthly: 999,
    priceYearly: 9990,
    status: 'ENABLED',
  },
]

/* ------------------------------------------------------ subscriptions */

export const SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: 'sub-001',
    pgName: 'Shree Shyam Boys PG',
    ownerName: 'Rakesh Sharma (demo)',
    planId: 'pro',
    cycle: 'MONTHLY',
    startOn: '2026-05-01',
    expiryOn: '2026-06-01',
    status: 'ACTIVE',
  },
  {
    id: 'sub-002',
    pgName: 'Ashiana PG',
    ownerName: 'Sunita Verma (demo)',
    planId: 'basic',
    cycle: 'YEARLY',
    startOn: '2025-11-20',
    expiryOn: '2026-11-20',
    status: 'ACTIVE',
  },
  {
    id: 'sub-003',
    pgName: 'GreenLeaf Boys PG',
    ownerName: 'Mahesh Gupta (demo)',
    planId: 'basic',
    cycle: 'MONTHLY',
    startOn: '2026-04-10',
    expiryOn: '2026-05-10',
    status: 'EXPIRING_SOON',
  },
  {
    id: 'sub-004',
    pgName: 'Sunrise Girls PG',
    ownerName: 'Kavita Joshi (demo)',
    planId: 'pro',
    cycle: 'YEARLY',
    startOn: '2026-03-20',
    expiryOn: '2027-03-20',
    status: 'ACTIVE',
  },
  {
    id: 'sub-005',
    pgName: 'Nest Co-living',
    ownerName: 'Aman Trivedi (demo)',
    planId: 'basic',
    cycle: 'MONTHLY',
    startOn: '2026-02-18',
    expiryOn: '2026-03-18',
    status: 'EXPIRED',
  },
  {
    id: 'sub-006',
    pgName: 'Amber Boys PG',
    ownerName: 'Deepak Rathore (demo)',
    planId: 'basic',
    cycle: 'MONTHLY',
    startOn: '2026-03-30',
    expiryOn: '2026-04-30',
    status: 'CANCELLED',
  },
  {
    id: 'sub-007',
    pgName: 'Nirvana Girls PG',
    ownerName: 'Pooja Mehta (demo)',
    planId: 'pro',
    cycle: 'MONTHLY',
    startOn: '2026-04-02',
    expiryOn: '2026-06-02',
    status: 'ACTIVE',
  },
  {
    id: 'sub-008',
    pgName: 'Maple Stay Boys PG',
    ownerName: 'Mahesh Gupta (demo)',
    planId: 'basic',
    cycle: 'MONTHLY',
    startOn: '2026-04-21',
    expiryOn: '2026-05-21',
    status: 'EXPIRING_SOON',
  },
]

/* ------------------------------------------------------------- payments */

/** RahoMitra SaaS subscription payments only — never student rent payments. */
export const PAYMENTS: PaymentRecord[] = [
  {
    id: 'RM-DEMO-1001',
    ownerName: 'Rakesh Sharma (demo)',
    pgName: 'Shree Shyam Boys PG',
    planId: 'pro',
    amount: 999,
    paidOn: '2026-05-01',
    status: 'SUCCESS',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1002',
    ownerName: 'Sunita Verma (demo)',
    pgName: 'Ashiana PG',
    planId: 'basic',
    amount: 4990,
    paidOn: '2025-11-20',
    status: 'SUCCESS',
    method: 'Card (demo)',
  },
  {
    id: 'RM-DEMO-1003',
    ownerName: 'Mahesh Gupta (demo)',
    pgName: 'GreenLeaf Boys PG',
    planId: 'basic',
    amount: 499,
    paidOn: '2026-04-10',
    status: 'SUCCESS',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1004',
    ownerName: 'Kavita Joshi (demo)',
    pgName: 'Sunrise Girls PG',
    planId: 'pro',
    amount: 9990,
    paidOn: '2026-03-20',
    status: 'SUCCESS',
    method: 'Netbanking (demo)',
  },
  {
    id: 'RM-DEMO-1005',
    ownerName: 'Aman Trivedi (demo)',
    pgName: 'Nest Co-living',
    planId: 'basic',
    amount: 499,
    paidOn: '2026-02-18',
    status: 'REFUNDED',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1006',
    ownerName: 'Pooja Mehta (demo)',
    pgName: 'Nirvana Girls PG',
    planId: 'pro',
    amount: 999,
    paidOn: '2026-04-02',
    status: 'SUCCESS',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1007',
    ownerName: 'Mahesh Gupta (demo)',
    pgName: 'Maple Stay Boys PG',
    planId: 'basic',
    amount: 499,
    paidOn: '2026-05-11',
    status: 'PENDING',
    method: 'UPI (demo)',
  },
  {
    id: 'RM-DEMO-1008',
    ownerName: 'Deepak Rathore (demo)',
    pgName: 'Amber Boys PG',
    planId: 'basic',
    amount: 499,
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
  { id: 'act-1', text: 'New owner application from Harish Pant (demo)', time: '2 hours ago', kind: 'owner' },
  { id: 'act-2', text: 'GreenLeaf Boys PG listing approved (demo)', time: '5 hours ago', kind: 'pg' },
  { id: 'act-3', text: 'Student Sara Khan registered (demo)', time: '8 hours ago', kind: 'student' },
  { id: 'act-4', text: 'PRO subscription renewed for Nirvana Girls PG (demo)', time: '1 day ago', kind: 'subscription' },
  { id: 'act-5', text: 'Urgent ticket TCK-103 raised by a student (demo)', time: '1 day ago', kind: 'support' },
  { id: 'act-6', text: 'Nest Co-living listing suspended (demo)', time: '2 days ago', kind: 'pg' },
  { id: 'act-7', text: 'Payment RM-DEMO-1007 marked pending (demo)', time: '3 days ago', kind: 'subscription' },
  { id: 'act-8', text: 'Application from Deepak Rathore rejected (demo)', time: '4 days ago', kind: 'owner' },
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
  { label: 'BASIC', value: 5, color: '#173D32' },
  { label: 'PRO', value: 3, color: '#C49A52' },
]

/** Application approval ratio (demo). */
export const APPROVAL_RATIO = [
  { label: 'Approved', value: 3, color: '#1F5143' },
  { label: 'Rejected', value: 1, color: '#B3402F' },
  { label: 'Pending', value: 3, color: '#C49A52' },
]
