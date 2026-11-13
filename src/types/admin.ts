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
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED'
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type NotificationCategory = 'PLATFORM' | 'SUBSCRIPTION' | 'FEATURE' | 'MAINTENANCE' | 'SUPPORT'
export type NotificationAudience = 'ALL_OWNERS' | 'ALL_STUDENTS' | 'SELECTED_OWNERS'
export type PlanStatus = 'ENABLED' | 'DISABLED'

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
  kind: 'pg' | 'owner' | 'student' | 'subscription' | 'support'
}

export interface AdminToast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}
