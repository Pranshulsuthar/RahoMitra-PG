/**
 * ---------------------------------------------------------------------------
 * SECTION 07 — COMMUNICATION & COMPLAINTS TYPES
 * ---------------------------------------------------------------------------
 * Frontend-only: every shape below describes LOCAL DEMO data held in React
 * state. No backend, WebSocket, real messaging, email or SMS service backs
 * any of it. Students and owners talk only inside this simulated console —
 * RahoMitra never delivers a real message.
 * ---------------------------------------------------------------------------
 */

/* --------------------------------------------------------------- messaging */

/** A private 1:1 conversation between the demo owner and ONE student. */
export interface Conversation {
  id: string
  propertyId: string
  studentId: string
  /** Denormalised for list rendering — matches OwnerStudent.name. */
  studentName: string
  roomId: string
  roomNumber: string
  /** Unread count from the owner's perspective. */
  ownerUnread: number
  /** Unread count from the student's perspective. */
  studentUnread: number
  /** ISO yyyy-mm-dd of the newest message. */
  lastMessageOn: string
  /** HH:mm of the newest message. */
  lastMessageAt: string
}

/** A single chat message inside a conversation. */
export interface ChatMessage {
  id: string
  conversationId: string
  sender: 'OWNER' | 'STUDENT'
  /** Denormalised sender display name. */
  senderName: string
  text: string
  /** yyyy-mm-dd */
  date: string
  /** HH:mm (24h demo clock) */
  at: string
  read: boolean
}

/* -------------------------------------------------------------- complaints */

export type ComplaintCategory =
  | 'ELECTRICITY'
  | 'WATER_SUPPLY'
  | 'WIFI'
  | 'FOOD_QUALITY'
  | 'CLEANLINESS'
  | 'ROOM_MAINTENANCE'
  | 'FURNITURE'
  | 'SECURITY'
  | 'STAFF_BEHAVIOUR'
  | 'OTHER'

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'

/** One entry in a complaint's status/response history timeline. */
export interface ComplaintEvent {
  id: string
  /** Who caused the event. */
  actor: 'STUDENT' | 'OWNER'
  actorName: string
  kind: 'STATUS' | 'RESPONSE' | 'COMMENT' | 'PRIORITY'
  /** Short headline e.g. "Status changed to In Progress". */
  title: string
  body: string
  date: string
  at: string
  /** For STATUS events — the status after the change. */
  status?: ComplaintStatus
}

/** A complaint raised by a student against their PG. */
export interface Complaint {
  id: string
  propertyId: string
  studentId: string
  studentName: string
  roomId: string
  roomNumber: string
  category: ComplaintCategory
  subject: string
  description: string
  priority: ComplaintPriority
  status: ComplaintStatus
  /** yyyy-mm-dd the student submitted it. */
  submittedOn: string
  /** Local data-URL preview only — never uploaded anywhere. */
  image: string
  /** Newest first timeline of status changes, responses and comments. */
  history: ComplaintEvent[]
}

/* ------------------------------------------------------------ announcements */

export type AnnouncementCategory =
  | 'GENERAL'
  | 'MAINTENANCE'
  | 'ELECTRICITY_WATER'
  | 'FOOD_MESS'
  | 'RENT_REMINDER'
  | 'RULES'
  | 'EMERGENCY'

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT'

/** Owner-published notice shown to students of a property (or selected few). */
export interface Announcement {
  id: string
  propertyId: string
  title: string
  message: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  /** 'ALL' or an explicit list of student ids. */
  audience: 'ALL' | 'SELECTED'
  audienceStudentIds: string[]
  publishedOn: string
  /** Optional yyyy-mm-dd expiry — blank means no expiry. */
  expiresOn: string
  /** Unpublished announcements are owner-only drafts. */
  published: boolean
  /** Student ids that have read it. */
  readBy: string[]
}

/* ---------------------------------------------------------- notifications */

export type CommNotificationKind =
  | 'MESSAGE'
  | 'COMPLAINT'
  | 'ANNOUNCEMENT'
  | 'MAINTENANCE'

/** Frontend notification-center row (no real push / email / SMS). */
export interface CommNotification {
  id: string
  /** ROLE that should see it. */
  role: 'OWNER' | 'STUDENT'
  /** Student scope — notifications for a student carry their id. */
  studentId?: string
  kind: CommNotificationKind
  title: string
  body: string
  /** Where the bell sends you when clicked. */
  to: string
  date: string
  at: string
  read: boolean
}

/* ------------------------------------------------------------- label maps */

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  ELECTRICITY: 'Electricity',
  WATER_SUPPLY: 'Water Supply',
  WIFI: 'WiFi / Internet',
  FOOD_QUALITY: 'Food Quality',
  CLEANLINESS: 'Cleanliness',
  ROOM_MAINTENANCE: 'Room Maintenance',
  FURNITURE: 'Furniture',
  SECURITY: 'Security',
  STAFF_BEHAVIOUR: 'Staff Behaviour',
  OTHER: 'Other',
}

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
}

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  GENERAL: 'General Notice',
  MAINTENANCE: 'Maintenance',
  ELECTRICITY_WATER: 'Electricity / Water',
  FOOD_MESS: 'Food & Mess',
  RENT_REMINDER: 'Rent Reminder',
  RULES: 'Rules & Regulations',
  EMERGENCY: 'Emergency',
}

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  NORMAL: 'Normal',
  IMPORTANT: 'Important',
  URGENT: 'Urgent',
}

/* ------------------------------------------------------------ date helpers */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2026-05-14' → '14 May 2026' */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`
}

/** Relative-ish demo label used in chat lists: Today / Yesterday / date. */
export function dayLabel(iso: string, today: string): string {
  if (iso === today) return 'Today'
  const t = new Date(`${today}T00:00:00`)
  const d = new Date(`${iso}T00:00:00`)
  const diff = Math.round((t.getTime() - d.getTime()) / 86400000)
  if (diff === 1) return 'Yesterday'
  return fmtDate(iso)
}
