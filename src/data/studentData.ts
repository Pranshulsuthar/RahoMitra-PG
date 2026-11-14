/**
 * ---------------------------------------------------------------------------
 * SECTION 05 — CENTRALISED STUDENT DEMO DATA
 * ---------------------------------------------------------------------------
 * Every record is ILLUSTRATIVE SAMPLE DATA for interface demonstration only.
 * The demo student is logically allocated to Section 04's "Shree Shyam Boys
 * PG" (pg-001) — property, room and bed IDs are imported from ownerData so
 * the two dashboards can never drift into conflicting records. Names are
 * fictional, the email uses the non-routable "@rahomitra.demo" domain and no
 * real phone numbers exist anywhere in this file.
 * ---------------------------------------------------------------------------
 */
import { OWNER_PROPERTIES, OWNER_ROOMS } from './ownerData'
import type {
  FaqItem,
  ImportantDate,
  StudentActivity,
  StudentNotice,
  StudentProfile,
} from '../types/student'

/* --------------------------------------------------------- demo student */

export const DEMO_STUDENT_ID = 'stu-self'

/** Editable profile fields — stored in local React state only. */
export const DEMO_STUDENT_PROFILE: StudentProfile = {
  name: 'Rahul Sharma',
  email: 'student@rahomitra.demo',
  mobile: '98765 43050',
  college: 'SKIT Jaipur',
  city: 'Jaipur',
  emergencyContact: '98765 43051 (demo — father)',
}

/** Admission / membership facts for the demo student. */
export const STUDENT_ADMISSION = {
  admissionDate: '2026-01-25',
  membership: 'ACTIVE' as const,
  monthlyRent: 7500,
  nextBillingDate: '2026-06-01',
  securityDeposit: 8000,
  propertyId: 'pg-001',
  roomId: 'r-204',
  bedLabel: 'B',
} as const

/* --------------------------------- linked Section 04 records (single source) */

/** The student's PG — imported from the owner demo dataset (never duplicated). */
export const STUDENT_PROPERTY = OWNER_PROPERTIES.find(
  (p) => p.id === STUDENT_ADMISSION.propertyId,
)!

/**
 * The student's room. Section 04 seeds rooms 101–104 / 201–202, so room 204
 * is registered once here through the same shape the owner store uses — the
 * owner dashboard creates it at seed time via `OWNER_ROOMS` below.
 */
export const STUDENT_ROOM = OWNER_ROOMS.find(
  (r) => r.id === STUDENT_ADMISSION.roomId,
)!

/** Roommate sharing room 204 with the demo student (fictional). */
export const ROOMMATES = [
  { id: 'roommate-1', name: 'Aman Verma (demo)', bedLabel: 'A', college: 'SKIT Jaipur (demo)' },
]

/** Facilities shown on My Room — a readable subset of the PG's facility list. */
export const ROOM_FACILITIES = [
  'Study Table',
  'Wi-Fi',
  'Attached Bathroom',
  'Power Backup',
  'Housekeeping',
  'Fan & LED',
]

/* --------------------------------------------------------------- notices */

export const STUDENT_NOTICES: StudentNotice[] = [
  {
    id: 'notice-1',
    title: 'Water tank cleaning on Sunday',
    description:
      'The overhead water tank will be cleaned this Sunday between 10:00 AM and 1:00 PM. Water supply will be paused during the window (demo notice).',
    date: '2026-05-13',
    category: 'WATER',
    read: false,
  },
  {
    id: 'notice-2',
    title: 'Rent due — 5 June 2026',
    description:
      'Monthly rent for June is due by 5 June 2026. Pay the owner directly in this demo — no online payment exists in this build (demo notice).',
    date: '2026-05-12',
    category: 'IMPORTANT',
    read: false,
  },
  {
    id: 'notice-3',
    title: 'Mess menu change this week',
    description:
      'North Indian thali on Monday and Thursday, South Indian on Wednesday. Sunday special: paneer curry (demo notice).',
    date: '2026-05-11',
    category: 'FOOD',
    read: false,
  },
  {
    id: 'notice-4',
    title: 'Geyser maintenance in room 204',
    description:
      'The geyser in room 204 will be serviced on 16 May, 11:00 AM–12:30 PM. Please keep the bathroom clear (demo notice).',
    date: '2026-05-10',
    category: 'MAINTENANCE',
    read: true,
  },
  {
    id: 'notice-5',
    title: 'Power backup test — Tuesday 9 AM',
    description:
      'A brief generator test will run on Tuesday at 9:00 AM. Expect a momentary power blip on all floors (demo notice).',
    date: '2026-05-09',
    category: 'ELECTRICITY',
    read: true,
  },
  {
    id: 'notice-6',
    title: 'Gate closes at 10:30 PM',
    description:
      'From this week the main gate closes at 10:30 PM. Coordinate with the warden if you will be late (demo notice).',
    date: '2026-05-08',
    category: 'GENERAL',
    read: true,
  },
  {
    id: 'notice-7',
    title: 'Common room TV repaired',
    description:
      'The common room television has been repaired and is available again for evening use (demo notice).',
    date: '2026-05-06',
    category: 'GENERAL',
    read: true,
  },
  {
    id: 'notice-8',
    title: 'Electricity bill cycle reminder',
    description:
      'The PG electricity contribution for May will be added to next month’s settlement as per property rules (demo notice).',
    date: '2026-05-04',
    category: 'ELECTRICITY',
    read: true,
  },
]

/* -------------------------------------------------------- important dates */

export const IMPORTANT_DATES: ImportantDate[] = [
  {
    id: 'date-1',
    label: 'Next rent due',
    date: '2026-06-01',
    note: '₹7,500 monthly rent — demo reminder',
  },
  {
    id: 'date-2',
    label: 'Geyser service (room 204)',
    date: '2026-05-16',
    note: '11:00 AM–12:30 PM — demo schedule',
  },
  {
    id: 'date-3',
    label: 'Water tank cleaning',
    date: '2026-05-17',
    note: 'Supply paused 10:00 AM–1:00 PM — demo',
  },
  {
    id: 'date-4',
    label: 'Membership review',
    date: '2026-06-25',
    note: 'Quarterly demo membership check-in',
  },
]

/* ------------------------------------------------------------- activity */

export const STUDENT_ACTIVITIES: StudentActivity[] = [
  { id: 'act-1', text: 'New notice posted: “Water tank cleaning on Sunday”', time: '1 day ago', kind: 'notice' },
  { id: 'act-2', text: 'Profile details reviewed (demo action)', time: '3 days ago', kind: 'profile' },
  { id: 'act-3', text: 'Rent reminder for June added to important dates', time: '4 days ago', kind: 'rent' },
  { id: 'act-4', text: 'Geyser service scheduled for room 204', time: '5 days ago', kind: 'room' },
  { id: 'act-5', text: 'Help & Support page visited (demo action)', time: '1 week ago', kind: 'support' },
]

/* ------------------------------------------------------------------ FAQ */

export const STUDENT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I pay my monthly rent?',
    answer:
      'In this frontend-only demo there is no payment gateway. Rent is settled directly with the PG owner — the demo student dashboard only shows the amount and due date.',
  },
  {
    id: 'faq-2',
    question: 'How do I request a room or bed change?',
    answer:
      'Room allocation is managed by the PG owner. Use Help & Support to find the owner’s contact details, then raise a request in the Communication & Complaints module (arriving in a future section).',
  },
  {
    id: 'faq-3',
    question: 'Where can I see official PG notices?',
    answer:
      'The Notices screen is your notice board — filter by category, search by keyword and mark items as read. New demo notices appear at the top.',
  },
  {
    id: 'faq-4',
    question: 'Is my profile editable?',
    answer:
      'Yes — My Profile lets you edit your name, mobile, college, city and emergency contact. Changes stay in local React state and reset when you reload the page.',
  },
  {
    id: 'faq-5',
    question: 'Who can see my personal details?',
    answer:
      'Nobody — this build has no backend. Every record is illustrative demo data stored in the browser tab only.',
  },
]

/** Fictional demo support contacts — never real people or numbers. */
export const SUPPORT_CONTACTS = [
  { label: 'PG Owner', value: 'Demo Owner — 98765 43001 (demo)' },
  { label: 'Owner email', value: 'shreeshyam@rahomitra.demo' },
  { label: 'Warden (demo)', value: 'Anita Sharma — 98765 43102 (demo)' },
  { label: 'RahoMitra support', value: 'support@rahomitra.demo (demo inbox)' },
]
