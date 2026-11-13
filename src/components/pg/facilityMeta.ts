import {
  Snowflake,
  Wifi,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Zap,
  ShieldCheck,
  Car,
  BookOpen,
  Bath,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PGFacilities } from '../../types'

export interface FacilityMeta {
  key: keyof PGFacilities
  label: string
  icon: LucideIcon
}

export const FACILITY_META: FacilityMeta[] = [
  { key: 'ac', label: 'AC', icon: Snowflake },
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'food', label: 'Food', icon: UtensilsCrossed },
  { key: 'laundry', label: 'Laundry', icon: Shirt },
  { key: 'housekeeping', label: 'Housekeeping', icon: Sparkles },
  { key: 'powerBackup', label: 'Power Backup', icon: Zap },
  { key: 'cctv', label: 'CCTV', icon: ShieldCheck },
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'studyTable', label: 'Study Table', icon: BookOpen },
  { key: 'attachedBathroom', label: 'Attached Bath', icon: Bath },
]

/** Facilities the demo PG actually offers (true flags only). */
export function availableFacilities(facilities: PGFacilities): FacilityMeta[] {
  return FACILITY_META.filter((meta) => facilities[meta.key])
}
