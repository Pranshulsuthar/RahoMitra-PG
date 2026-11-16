/**
 * ---------------------------------------------------------------------------
 * SECTION 04 — PG Owner Dashboard types.
 * Frontend-only: every shape below describes LOCAL DEMO data held in React
 * state. No API, database or real session backs any of it.
 * ---------------------------------------------------------------------------
 */

/** Multi-tenant identifiers — ready for a future backend mapping. */
export type PropertyId = string
export type RoomId = string
export type BedId = string

export type PgType = 'BOYS' | 'GIRLS' | 'CO_LIVING'
export type PropertyStatus = 'ACTIVE' | 'PENDING' | 'DRAFT' | 'PAUSED'
export type FoodOption = 'INCLUDED' | 'PAID' | 'NOT_AVAILABLE'

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'CUSTOM'
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'

export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING'

export type AdmissionCodeStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED'
export type AdmissionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Staff role is a free-text identity the owner defines themselves (e.g. Chef). */

/** A PG property owned by the demo owner. */
export interface OwnerProperty {
  id: PropertyId
  ownerId: string
  name: string
  type: PgType
  description: string
  city: string
  address: string
  locality: string
  /** Fictional demo contact — never a real number. */
  contactPhone: string
  contactEmail: string
  securityDeposit: number
  facilities: string[]
  food: FoodOption
  rules: string[]
  coverImage: string
  gallery: string[]
  status: PropertyStatus
  listedOn: string
}

/** A bed always belongs to exactly one room (`roomId`). */
export interface RoomBed {
  id: BedId
  roomId: RoomId
  label: string
  status: BedStatus
}

/** A room always belongs to exactly one property (`propertyId`). */
export interface OwnerRoom {
  id: RoomId
  propertyId: PropertyId
  number: string
  floor: number
  type: RoomType
  rent: number
  beds: RoomBed[]
}

/** A student is associated with the correct PG; allocation is optional. */
export interface OwnerStudent {
  id: string
  propertyId: PropertyId
  /** Empty string = no current allocation (e.g. ended membership). */
  roomId: RoomId | ''
  bedId: BedId | ''
  name: string
  email: string
  /** Fictional demo contact — never a real number. */
  mobile: string
  college: string
  city: string
  admissionDate: string
  membership: MembershipStatus
}

/** Locally simulated admission code — NOT secure, server-validated or single-use. */
export interface AdmissionCode {
  id: string
  propertyId: PropertyId
  code: string
  /** Optional preferred room (room id). */
  roomPreference: RoomId | ''
  expiresOn: string
  status: AdmissionCodeStatus
  createdOn: string
}

/** A demo admission request waiting for the owner's approval. */
export interface AdmissionRequest {
  id: string
  propertyId: PropertyId
  code: string
  roomPreference: RoomId | ''
  studentName: string
  studentEmail: string
  /** Fictional demo contact. */
  studentMobile: string
  requestedOn: string
  status: AdmissionRequestStatus
  decidedOn?: string
  reason?: string
}

export interface StaffMember {
  id: string
  propertyId: PropertyId
  name: string
  email: string
  /** Fictional demo contact. */
  mobile: string
  /** Owner-defined role text — no fixed list, no permissions in this demo. */
  role: string
  joinedOn: string
}

export interface OwnerProfile {
  id: string
  name: string
  email: string
  /** Fictional demo contact. */
  mobile: string
  city: string
  bio: string
  joinedOn?: string
  verified?: boolean
}

export interface OwnerNotification {
  id: string
  title: string
  message: string
  on: string
  read: boolean
  category: 'ADMISSION' | 'ROOM' | 'PROPERTY' | 'ACCOUNT'
}

export interface OwnerActivity {
  id: string
  propertyId: PropertyId | null
  text: string
  time: string
  kind: 'admission' | 'room' | 'property' | 'student' | 'staff'
}

export interface OwnerToast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

/* ------------------------------------------------------------- label maps */

export const PG_TYPE_LABELS: Record<PgType, string> = {
  BOYS: 'Boys',
  GIRLS: 'Girls',
  CO_LIVING: 'Co-living',
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  SINGLE: 'Single Sharing',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  QUAD: 'Four Sharing',
  CUSTOM: 'Custom Sharing',
}

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
}

export const FOOD_LABELS: Record<FoodOption, string> = {
  INCLUDED: 'Included in rent',
  PAID: 'Paid separately',
  NOT_AVAILABLE: 'Not available',
}

/** Room occupancy derived from its beds. */
export function roomOccupancy(room: OwnerRoom): {
  capacity: number
  occupied: number
  available: number
  maintenance: number
  label: 'VACANT' | 'PARTIAL' | 'FULL' | 'MAINTENANCE'
} {
  const capacity = room.beds.length
  const occupied = room.beds.filter((b) => b.status === 'OCCUPIED').length
  const maintenance = room.beds.filter((b) => b.status === 'MAINTENANCE').length
  const available = capacity - occupied - maintenance
  let label: 'VACANT' | 'PARTIAL' | 'FULL' | 'MAINTENANCE' = 'PARTIAL'
  if (capacity > 0 && occupied === capacity) label = 'FULL'
  else if (available === capacity && capacity > 0) label = 'VACANT'
  else if (available === 0 && maintenance > 0) label = 'MAINTENANCE'
  return { capacity, occupied, available, maintenance, label }
}
