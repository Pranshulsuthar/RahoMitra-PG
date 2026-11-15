/**
 * Section 03 — Super Admin dashboard domain types.
 * All records are illustrative DEMO data (frontend-only).
 */
import type { PGCategory } from './index'

export type PgStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type OwnerStatus = 'ACTIVE' | 'SUSPENDED'
export type MembershipStatus = 'ACTIVE' | 'INACTIVE'
export type BillingCycle = 'MONTHLY' | 'YEARLY'
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'TRIAL'
  | 'PENDING'
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type NotificationCategory = 'PLATFORM' | 'SUBSCRIPTION' | 'FEATURE' | 'MAINTENANCE' | 'SUPPORT'
export type NotificationAudience = 'ALL_OWNERS' | 'ALL_STUDENTS' | 'SELECTED_OWNERS'
export type PlanStatus = 'ENABLED' | 'DISABLED'

/* ------------------------------------------ Section 08 — SaaS platform */

/** A single toggleable capability inside a subscription plan. */
export interface PlanFeatureToggle {
  key: string
  label: string
  enabled: boolean
}

/** One entry in a subscription's audit trail. */
export interface SubscriptionEvent {
  id: string
  on: string
  text: string
}

export type FeaturedTier = 'FEATURED' | 'PREMIUM_FEATURED'
export type FeaturedRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type FeaturedListingStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED'

export interface FeaturedRequest {
  id: string
  pgId: string
  pgName: string
  ownerName: string
  tier: FeaturedTier
  /** Proposed demo price in ₹ (299 / 499). */
  amount: number
  requestedOn: string
  /** Admin decision — filled on approve/reject. */
  status: FeaturedRequestStatus
  /** Promotion duration in months (approved requests). */
  durationMonths?: number
  startOn?: string
  endOn?: string
  /** Live listing state after approval. */
  listingStatus?: FeaturedListingStatus
  rejectReason?: string
  /** Demo payment record only — never a real transaction. */
  history: Array<{ id: string; on: string; text: string }>
}

export type AdCategory =
  | 'Tiffin Services'
  | 'Laundry Services'
  | 'Furniture'
  | 'Internet Services'
  | 'Local Transport'
  | 'Other Relevant Services'
export type AdPlacement = 'Explore Banner' | 'Listing Card' | 'Sidebar Rail' | 'Home Footer'
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'DRAFT'

export interface Advertisement {
  id: string
  businessName: string
  category: AdCategory
  title: string
  description: string
  destinationUrl: string
  /** Local object URL / data URL preview — never uploaded anywhere. */
  imagePreview: string
  targetCity: string
  targetLocality: string
  placement: AdPlacement
  startOn: string
  endOn: string
  price: number
  status: AdStatus
  createdOn: string
}

export type PlatformTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED'
export type PlatformTicketCategory =
  | 'Owner Account'
  | 'Subscription'
  | 'PG Listing'
  | 'Student Account'
  | 'Billing'
  | 'Technical Issue'
  | 'Other'

export interface PlatformTicketReply {
  id: string
  author: string
  role: 'Admin' | 'User'
  text: string
  on: string
}

export interface PlatformTicket {
  id: string
  submittedBy: string
  userRole: 'Owner' | 'Student' | 'Guest'
  category: PlatformTicketCategory
  subject: string
  description: string
  priority: TicketPriority
  status: PlatformTicketStatus
  createdOn: string
  assignedTo: string | null
  replies: PlatformTicketReply[]
}

export interface PlatformSettings {
  /* A. General */
  platformName: string
  hindiName: string
  tagline: string
  description: string
  supportEmail: string
  supportPhone: string
  currency: string
  country: string
  timezone: string
  /* B. Branding */
  logoPreview: string
  faviconPreview: string
  brandColors: { forest: string; ivory: string; gold: string; dark: string }
  websiteTitle: string
  footerDescription: string
  /* C. Business */
  trialDurationDays: number
  gracePeriodDays: number
  featuredPrice: number
  premiumFeaturedPrice: number
  adPriceBase: number
  /* D. Notifications */
  notify: {
    newOwnerApplication: boolean
    newPgApproval: boolean
    newStudentRegistration: boolean
    newComplaint: boolean
    subscriptionExpiry: boolean
    featuredRequest: boolean
  }
  /* F. Maintenance (visual demo only) */
  maintenanceMode: boolean
  maintenanceMessage: string
}

export interface AdminPg {
  id: string
  name: string
  ownerId: string
  ownerName: string
  city: string
  locality: string
  category: PGCategory
  /** ISO date (demo). */
  registeredOn: string
  status: PgStatus
  statusNote?: string
  rent: number
  address: string
  description: string
  facilities: string[]
  roomCategories: { label: string; sharing: string; rent: number }[]
  coverImage: string
  gallery: string[]
}

export interface OwnerApplication {
  id: string
  ownerName: string
  /** Fictional demo email — never a real address. */
  email: string
  pgName: string
  city: string
  category: PGCategory
  submittedOn: string
  status: ApplicationStatus
  rejectionReason?: string
  note: string
}

export interface OwnerRecord {
  id: string
  name: string
  email: string
  city: string
  status: OwnerStatus
  joinedOn: string
  planId: string
  subscriptionStatus: SubscriptionStatus
  pgIds: string[]
}

export interface StudentRecord {
  id: string
  name: string
  email: string
  pgId: string | null
  pgName: string
  city: string
  membership: MembershipStatus
  registeredOn: string
}

export interface PlanRecord {
  id: string
  name: string
  tagline: string
  features: string[]
  priceMonthly: number
  priceYearly: number
  status: PlanStatus
  /** Maximum PG properties an owner on this plan may manage. */
  propertyLimit: number
  /** Billing duration offered for this plan. */
  billing: BillingCycle
  /** Toggleable capability list used by the plan editor. */
  featureToggles: PlanFeatureToggle[]
  /** Marked when the plan was created in this demo session. */
  custom?: boolean
}

export interface SubscriptionRecord {
  id: string
  pgName: string
  ownerName: string
  planId: string
  cycle: BillingCycle
  startOn: string
  expiryOn: string
  status: SubscriptionStatus
  /** Demo subscription amount in ₹ (SaaS plan, not rent). */
  amount: number
  /** Suspended flag — shown as a chip, keeps the underlying status. */
  suspended?: boolean
  /** Demo audit trail for this subscription. */
  events: SubscriptionEvent[]
}

export interface PaymentRecord {
  id: string
  ownerName: string
  pgName: string
  planId: string
  amount: number
  paidOn: string
  status: PaymentStatus
  method: string
}

export interface TicketNote {
  id: string
  text: string
  on: string
}

export interface SupportTicket {
  id: string
  subject: string
  raisedBy: string
  raisedRole: 'Owner' | 'Student'
  category: string
  priority: TicketPriority
  status: TicketStatus
  createdOn: string
  description: string
  notes: TicketNote[]
}

export interface PlatformNotification {
  id: string
  title: string
  message: string
  category: NotificationCategory
  audience: NotificationAudience
  sentOn: string
  read: boolean
}

export interface ActivityItem {
  id: string
  text: string
  time: string
  kind: 'pg' | 'owner' | 'student' | 'subscription' | 'support' | 'platform'
  /* ---- Section 08 rich fields (optional so Section 03 feeds keep working) ---- */
  admin?: string
  action?: string
  entity?: string
  description?: string
  /** ISO date-time for the activity log table. */
  at?: string
}

export interface AdminToast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}
