/** Core domain types for the RahoMitra public website. */

export type PGCategory = 'Boys' | 'Girls' | 'Co-living'

export type SharingOption = 'Single' | 'Double' | 'Triple'

export type FoodAvailability = 'Included in rent' | 'Available at extra cost' | 'Not available'

export type RentSort = 'default' | 'price-asc' | 'price-desc'

/** Amenities that can be filtered on the Explore page. */
export interface PGFacilities {
  ac: boolean
  wifi: boolean
  food: boolean
  laundry: boolean
  housekeeping: boolean
  powerBackup: boolean
  cctv: boolean
  parking: boolean
  studyTable: boolean
  attachedBathroom: boolean
}

export interface RoomType {
  label: string
  sharing: SharingOption
  /** Monthly rent in INR (illustrative demo pricing). */
  rent: number
}

/**
 * Owner contact details.
 * Kept optional on purpose: contact actions (Call / WhatsApp) are rendered
 * ONLY when real details are supplied. Never invent phone numbers.
 */
export interface OwnerContact {
  phone?: string
  whatsapp?: string
  displayName?: string
}

export interface PG {
  id: string
  slug: string
  name: string
  category: PGCategory
  /** Demo locality — illustrative sample data only. */
  locality: string
  city: string
  /** Monthly rent in INR (demo pricing). */
  rent: number
  /** Security deposit in INR (demo pricing). */
  securityDeposit: number
  description: string
  coverImage: string
  gallery: string[]
  facilities: PGFacilities
  sharingOptions: SharingOption[]
  roomTypes: RoomType[]
  foodAvailability: FoodAvailability
  rules: string[]
  /** Demo availability status — not live inventory. */
  availabilityNote: string
  /** Always true for current data: every listing is illustrative demo data. */
  isDemo: true
  /** null until a real owner shares verified contact details. */
  ownerContact: OwnerContact | null
}

/** City / locality suggestion shown in the hero search. */
export interface LocalityOption {
  city: string
  locality: string
}
