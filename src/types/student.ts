/**
 * ---------------------------------------------------------------------------
 * SECTION 05 — STUDENT DASHBOARD TYPES
 * ---------------------------------------------------------------------------
 * Frontend-only demo shapes. Every record here is illustrative sample data —
 * no real student, identity or account exists behind it.
 * ---------------------------------------------------------------------------
 */

export type NoticeCategory =
  | 'GENERAL'
  | 'MAINTENANCE'
  | 'FOOD'
  | 'ELECTRICITY'
  | 'WATER'
  | 'IMPORTANT'

export interface StudentNotice {
  id: string
  title: string
  description: string
  date: string // ISO yyyy-mm-dd
  category: NoticeCategory
  read: boolean
}

export interface StudentProfile {
  name: string
  email: string
  mobile: string
  college: string
  city: string
  emergencyContact: string
}

export interface StudentSettings {
  /* account */
  languageEnglish: boolean
  showProfileToOwner: boolean
  /* notifications */
  noticeAlerts: boolean
  rentReminders: boolean
  emailDigest: boolean
  /* appearance */
  compactCards: boolean
  reduceMotion: boolean
  darkMode: boolean
}

export interface ImportantDate {
  id: string
  label: string
  date: string // ISO yyyy-mm-dd
  note: string
}

export interface StudentActivity {
  id: string
  text: string
  time: string
  kind: 'notice' | 'rent' | 'room' | 'profile' | 'support'
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

/** Category badge styling keys for the notice board. */
export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  GENERAL: 'General',
  MAINTENANCE: 'Maintenance',
  FOOD: 'Food',
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  IMPORTANT: 'Important',
}
