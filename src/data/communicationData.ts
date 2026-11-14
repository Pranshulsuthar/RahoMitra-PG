/**
 * ---------------------------------------------------------------------------
 * SECTION 07 — CENTRALISED COMMUNICATION DEMO DATA
 * ---------------------------------------------------------------------------
 * Illustrative conversations, complaints, announcements and notifications for
 * interface demonstration only. Everything is generated from the existing
 * Section 04 demo students and properties (Shree Shyam Boys PG / Ashiana PG)
 * so names, rooms and PGs always match the rest of the app. Nothing here is a
 * real message, ticket or notice — reload the page to restore these seeds.
 * ---------------------------------------------------------------------------
 */
import type {
  Announcement,
  ChatMessage,
  CommNotification,
  Complaint,
  ComplaintEvent,
  Conversation,
} from '../types/communication'
import { OWNER_PROPERTIES, OWNER_ROOMS, OWNER_STUDENTS } from './ownerData'

/** Fixed "today" for the whole communication demo (matches every section). */
export const COMM_TODAY = '2026-05-14'

/** The student logged into the Section 05 student portal. */
export const DEMO_STUDENT_ID = 'stu-13'

const roomById = new Map(OWNER_ROOMS.map((r) => [r.id, r]))

export const PROPERTY_NAMES: Record<string, string> = Object.fromEntries(
  OWNER_PROPERTIES.map((p) => [p.id, p.name]),
)

/** Property display name with a safe fallback. */
export function commPropertyName(propertyId: string): string {
  return PROPERTY_NAMES[propertyId] ?? 'Demo PG'
}

/** Active (admitted) students only — the audience for all Section 07 data. */
const activeStudents = OWNER_STUDENTS.filter(
  (s) => s.membership === 'ACTIVE' && s.roomId.length > 0,
)

/** Room number for a student id ('—' when unknown). */
export function roomNumberOf(studentId: string): string {
  const student = OWNER_STUDENTS.find((s) => s.id === studentId)
  if (!student) return '—'
  return roomById.get(student.roomId)?.number ?? '—'
}

/* ------------------------------------------------------------- conversations */

/** Scripted demo threads — cycled across the admitted students. */
const THREADS: Array<Array<{ from: 'OWNER' | 'STUDENT'; text: string; date: string; at: string }>> = [
  // Rahul Sharma (stu-13) — the logged-in Section 05 student.
  [
    { from: 'STUDENT', text: 'Hello sir, the AC in room 204 is not cooling since last night.', date: '2026-05-13', at: '21:14' },
    { from: 'OWNER', text: 'Thanks for telling me Rahul. I will send the technician tomorrow morning (demo).', date: '2026-05-13', at: '21:40' },
    { from: 'STUDENT', text: 'Thank you sir. Also, can I get the May electricity bill photo?', date: '2026-05-14', at: '09:24' },
    { from: 'OWNER', text: 'It is on your My Bills screen — ₹7,900 for May (demo). Pay directly to me before 5 June.', date: '2026-05-14', at: '09:47' },
  ],
  [
    { from: 'STUDENT', text: 'Good morning sir, mess menu for this week?', date: '2026-05-13', at: '08:12' },
    { from: 'OWNER', text: 'Posted on the notice board — paneer on Wednesday (demo).', date: '2026-05-13', at: '08:35' },
  ],
  [
    { from: 'OWNER', text: 'Please clear your pending rent for April, Rohit (demo).', date: '2026-05-11', at: '11:02' },
    { from: 'STUDENT', text: 'Sir, I will pay by this weekend via UPI.', date: '2026-05-11', at: '11:26' },
    { from: 'OWNER', text: 'Noted. Send me the screenshot after payment so I can update your bill (demo).', date: '2026-05-11', at: '11:31' },
  ],
  [
    { from: 'STUDENT', text: 'Sir, WiFi is very slow in room 102 after 10 pm.', date: '2026-05-14', at: '07:55' },
    { from: 'OWNER', text: 'Raising a router restart tonight — tell me if it is still slow tomorrow (demo).', date: '2026-05-14', at: '08:10' },
  ],
  [
    { from: 'STUDENT', text: 'Bhaiya, a guest is coming this evening for an hour — is that okay?', date: '2026-05-13', at: '16:44' },
    { from: 'OWNER', text: 'Yes, lobby me wait karwa lena — rooms me allowed nahi hai after 8 pm (demo).', date: '2026-05-13', at: '17:01' },
  ],
]

interface RawThread {
  conv: Conversation
  messages: ChatMessage[]
}

function seedThreads(): RawThread[] {
  return activeStudents.map((student, i) => {
    const thread = THREADS[i % THREADS.length]
    const convId = `CONV-${String(i + 1).padStart(3, '0')}`
    const messages: ChatMessage[] = thread.map((m, j) => ({
      id: `MSG-${convId.slice(4)}-${j + 1}`,
      conversationId: convId,
      sender: m.from,
      senderName:
        m.from === 'OWNER' ? 'Rakesh Sharma (PG Owner)' : student.name,
      text: m.text,
      date: m.date,
      at: m.at,
      read: true,
    }))

    // Leave the newest message unread for its receiver in selected threads so
    // the unread filters and badges have demo data. Some threads show an
    // owner-side unread (student wrote last), others a student-side unread.
    if (i % 4 === 0) {
      for (let k = messages.length - 1; k >= 0; k -= 1) {
        if (messages[k].sender === 'STUDENT') {
          messages[k].read = false
          break
        }
      }
    }
    if (i % 3 === 0) {
      for (let k = messages.length - 1; k >= 0; k -= 1) {
        if (messages[k].sender === 'OWNER') {
          messages[k].read = false
          break
        }
      }
    }

    const last = messages[messages.length - 1]
    const conv: Conversation = {
      id: convId,
      propertyId: student.propertyId,
      studentId: student.id,
      studentName: student.name,
      roomId: student.roomId,
      roomNumber: roomById.get(student.roomId)?.number ?? '—',
      ownerUnread: messages.filter((m) => !m.read && m.sender === 'STUDENT').length,
      studentUnread: messages.filter((m) => !m.read && m.sender === 'OWNER').length,
      lastMessageOn: last?.date ?? COMM_TODAY,
      lastMessageAt: last?.at ?? '09:00',
    }

    return { conv, messages }
  })
}

const RAW_THREADS = seedThreads()

export const SEED_CONVERSATIONS: Conversation[] = RAW_THREADS.map((r) => r.conv)
export const SEED_MESSAGES: ChatMessage[] = RAW_THREADS.flatMap((r) => r.messages)

/* ---------------------------------------------------------------- complaints */

function seedComplaints(): Complaint[] {
  const rows: Array<{
    studentId: string
    category: Complaint['category']
    subject: string
    description: string
    priority: Complaint['priority']
    status: Complaint['status']
    submittedOn: string
    events: Array<Omit<ComplaintEvent, 'id'>>
  }> = [
    {
      studentId: 'stu-13',
      category: 'ELECTRICITY',
      subject: 'AC not cooling in Room 204',
      description:
        'The AC in Room 204 (Bed B) is running but not cooling since 13 May evening. The fan works fine. Please arrange a technician — the room is unusable at night without cooling (demo).',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      submittedOn: '2026-05-13',
      events: [
        { actor: 'STUDENT', actorName: 'Rahul Sharma (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-13', at: '21:20', status: 'SUBMITTED' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'STATUS', title: 'Status changed to Under Review', body: 'Owner acknowledged the complaint (demo).', date: '2026-05-13', at: '22:05', status: 'UNDER_REVIEW' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'RESPONSE', title: 'Owner responded', body: 'Technician scheduled for 15 May morning. Please keep the room accessible between 9–11 AM (demo).', date: '2026-05-14', at: '08:15', status: 'IN_PROGRESS' },
      ],
    },
    {
      studentId: 'stu-02',
      category: 'WIFI',
      subject: 'WiFi drops every night after 10 PM',
      description:
        'The router in the 1st floor lobby disconnects around 10 PM and comes back at 7 AM. Online classes at night are impossible (demo).',
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      submittedOn: '2026-05-12',
      events: [
        { actor: 'STUDENT', actorName: 'Rohit Singh (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-12', at: '22:40', status: 'SUBMITTED' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'STATUS', title: 'Status changed to Under Review', body: 'Checking with the ISP (demo).', date: '2026-05-13', at: '10:12', status: 'UNDER_REVIEW' },
      ],
    },
    {
      studentId: 'stu-08',
      category: 'FOOD_QUALITY',
      subject: 'Cold food served at dinner',
      description:
        'Dinner was cold two days in a row and the dal tasted stale. Requesting a check on mess timing and quality (demo).',
      priority: 'URGENT',
      status: 'SUBMITTED',
      submittedOn: '2026-05-14',
      events: [
        { actor: 'STUDENT', actorName: 'Ananya Mishra (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-14', at: '20:05', status: 'SUBMITTED' },
      ],
    },
    {
      studentId: 'stu-05',
      category: 'CLEANLINESS',
      subject: 'Bathroom cleaning missed on 2nd floor',
      description:
        'The common bathroom on the 2nd floor was not cleaned for three days. Please schedule the housekeeping cycle properly (demo).',
      priority: 'LOW',
      status: 'RESOLVED',
      submittedOn: '2026-05-08',
      events: [
        { actor: 'STUDENT', actorName: 'Sahil Khan (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-08', at: '18:30', status: 'SUBMITTED' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'STATUS', title: 'Status changed to In Progress', body: 'Housekeeping reassigned (demo).', date: '2026-05-09', at: '09:15', status: 'IN_PROGRESS' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'RESPONSE', title: 'Marked as Resolved', body: 'Deep cleaning done and the daily checklist restarted. Thanks for reporting (demo).', date: '2026-05-10', at: '17:40', status: 'RESOLVED' },
      ],
    },
    {
      studentId: 'stu-04',
      category: 'FURNITURE',
      subject: 'Study chair broken in Room 103',
      description:
        'The wheel of my study chair is broken and the seat wobbles. Requesting a replacement before the end of the week (demo).',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      submittedOn: '2026-05-05',
      events: [
        { actor: 'STUDENT', actorName: 'Kunal Joshi (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-05', at: '13:10', status: 'SUBMITTED' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'RESPONSE', title: 'Marked as Resolved', body: 'A replacement chair was delivered to Room 103 (demo).', date: '2026-05-07', at: '16:20', status: 'RESOLVED' },
      ],
    },
    {
      studentId: 'stu-09',
      category: 'STAFF_BEHAVIOUR',
      subject: 'Staff member shouted at students',
      description:
        'A staff member raised his voice at two students in the lobby over gate timing. Requesting a polite reminder about conduct (demo).',
      priority: 'HIGH',
      status: 'REJECTED',
      submittedOn: '2026-05-06',
      events: [
        { actor: 'STUDENT', actorName: 'Priya Solanki (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-06', at: '19:10', status: 'SUBMITTED' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'RESPONSE', title: 'Rejected with reason', body: 'Checked with both sides and the lobby CCTV — the account could not be verified. Please reach out directly next time so we can act the same day (demo).', date: '2026-05-07', at: '12:25', status: 'REJECTED' },
      ],
    },
    {
      studentId: 'stu-11',
      category: 'WATER_SUPPLY',
      subject: 'No cold water in the morning',
      description:
        'Cold water supply in room G-03 is very low between 6–8 AM (demo).',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      submittedOn: '2026-05-11',
      events: [
        { actor: 'STUDENT', actorName: 'Simran Kaur (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-11', at: '07:05', status: 'SUBMITTED' },
        { actor: 'OWNER', actorName: 'Rakesh Sharma (PG Owner)', kind: 'STATUS', title: 'Status changed to In Progress', body: 'Plumber is checking the overhead tank valve (demo).', date: '2026-05-12', at: '11:30', status: 'IN_PROGRESS' },
      ],
    },
    {
      studentId: 'stu-14',
      category: 'ROOM_MAINTENANCE',
      subject: 'Window latch broken in Room 204',
      description:
        'The window latch in Room 204 (Bed A) is loose and the window rattles at night (demo).',
      priority: 'LOW',
      status: 'SUBMITTED',
      submittedOn: '2026-05-14',
      events: [
        { actor: 'STUDENT', actorName: 'Aman Verma (demo)', kind: 'STATUS', title: 'Complaint submitted', body: 'Raised from the student portal (demo).', date: '2026-05-14', at: '10:45', status: 'SUBMITTED' },
      ],
    },
  ]

  return rows.map((row, i) => {
    const student = OWNER_STUDENTS.find((s) => s.id === row.studentId)
    const id = `CMP-${row.submittedOn.slice(2).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`
    return {
      id,
      propertyId: student?.propertyId ?? 'pg-001',
      studentId: row.studentId,
      studentName: student?.name ?? 'Demo Student',
      roomId: student?.roomId ?? '',
      roomNumber: roomNumberOf(row.studentId),
      category: row.category,
      subject: row.subject,
      description: row.description,
      priority: row.priority,
      status: row.status,
      submittedOn: row.submittedOn,
      image: '',
      history: row.events.map((e, j) => ({ ...e, id: `${id}-EV${j + 1}` })),
    }
  })
}

export const SEED_COMPLAINTS: Complaint[] = seedComplaints()

/* ------------------------------------------------------------- announcements */

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ANN-2026-001',
    propertyId: 'pg-001',
    title: 'Water tank cleaning on 16 May',
    message:
      'The overhead water tank of Shree Shyam Boys PG will be cleaned on Saturday, 16 May between 10 AM and 2 PM. Water supply will be paused during this window — please store water in advance (demo notice).',
    category: 'MAINTENANCE',
    priority: 'IMPORTANT',
    audience: 'ALL',
    audienceStudentIds: [],
    publishedOn: '2026-05-12',
    expiresOn: '2026-05-17',
    published: true,
    readBy: ['stu-01', 'stu-02', 'stu-03'],
  },
  {
    id: 'ANN-2026-002',
    propertyId: 'pg-001',
    title: 'Rent due — pay directly to the owner before 5 June',
    message:
      'May 2026 rent is due on 5 June. Please pay your PG owner directly using the payment method shared with you (UPI / cash / bank transfer). Your payment status is updated after the owner confirms receipt (demo reminder).',
    category: 'RENT_REMINDER',
    priority: 'URGENT',
    audience: 'ALL',
    audienceStudentIds: [],
    publishedOn: '2026-05-10',
    expiresOn: '2026-06-05',
    published: true,
    readBy: ['stu-13', 'stu-01'],
  },
  {
    id: 'ANN-2026-003',
    propertyId: 'pg-001',
    title: 'Mess menu for this week',
    message:
      'Mon: Rajma-Chawal · Tue: Aloo-Puri · Wed: Paneer-Curry · Thu: Chole-Bhature · Fri: Veg-Pulao · Sat: Dal-Tadka & Roti · Sunday special dessert (demo menu).',
    category: 'FOOD_MESS',
    priority: 'NORMAL',
    audience: 'ALL',
    audienceStudentIds: [],
    publishedOn: '2026-05-11',
    expiresOn: '',
    published: true,
    readBy: ['stu-02', 'stu-04'],
  },
  {
    id: 'ANN-2026-004',
    propertyId: 'pg-002',
    title: 'Electricity maintenance — Ashiana PG',
    message:
      'Power will be interrupted in Ashiana PG on 15 May from 11 AM to 1 PM for meter maintenance. The lift and water pump will be off during this time (demo notice).',
    category: 'ELECTRICITY_WATER',
    priority: 'IMPORTANT',
    audience: 'ALL',
    audienceStudentIds: [],
    publishedOn: '2026-05-13',
    expiresOn: '2026-05-15',
    published: true,
    readBy: ['stu-08'],
  },
  {
    id: 'ANN-2026-005',
    propertyId: 'pg-001',
    title: 'Gate closes at 11 PM sharp',
    message:
      'As per the rules & regulations, the main gate closes at 11 PM. Late entry requires prior written permission from the owner (demo rule reminder).',
    category: 'RULES',
    priority: 'NORMAL',
    audience: 'ALL',
    audienceStudentIds: [],
    publishedOn: '2026-05-02',
    expiresOn: '',
    published: true,
    readBy: ['stu-13', 'stu-05', 'stu-06', 'stu-07'],
  },
  {
    id: 'ANN-2026-006',
    propertyId: 'pg-001',
    title: 'New fridge in the common area',
    message:
      'A second refrigerator is now available in the common area. Please label your items and do not store open packets overnight (draft — not yet published, demo).',
    category: 'GENERAL',
    priority: 'NORMAL',
    audience: 'SELECTED',
    audienceStudentIds: ['stu-13', 'stu-14'],
    publishedOn: '2026-05-14',
    expiresOn: '',
    published: false,
    readBy: [],
  },
  {
    id: 'ANN-2026-007',
    propertyId: 'pg-002',
    title: 'Guest policy update (draft)',
    message:
      'Weekend guests must be registered at the reception one day in advance (draft, demo).',
    category: 'RULES',
    priority: 'IMPORTANT',
    audience: 'ALL',
    audienceStudentIds: [],
    publishedOn: '2026-05-14',
    expiresOn: '',
    published: false,
    readBy: [],
  },
]

/* ------------------------------------------------------------- notifications */

export const SEED_COMM_NOTIFICATIONS: CommNotification[] = [
  // ---- owner side
  { id: 'NTF-O1', role: 'OWNER', kind: 'MESSAGE', title: 'New message from Rahul Sharma', body: 'May I get the May electricity bill photo?', to: '/owner/communication', date: '2026-05-14', at: '09:24', read: false },
  { id: 'NTF-O2', role: 'OWNER', kind: 'MESSAGE', title: 'New message from Rohit Singh', body: 'Sir, WiFi is very slow in room 102 after 10 pm.', to: '/owner/communication', date: '2026-05-14', at: '07:55', read: false },
  { id: 'NTF-O3', role: 'OWNER', kind: 'COMPLAINT', title: 'New complaint submitted', body: 'Ananya Mishra — Food Quality (Urgent) at Ashiana PG.', to: '/owner/complaints', date: '2026-05-14', at: '20:05', read: false },
  { id: 'NTF-O4', role: 'OWNER', kind: 'COMPLAINT', title: 'New complaint submitted', body: 'Aman Verma — Room Maintenance at Shree Shyam Boys PG.', to: '/owner/complaints', date: '2026-05-14', at: '10:45', read: true },
  { id: 'NTF-O5', role: 'OWNER', kind: 'COMPLAINT', title: 'Complaint status updated', body: 'Rahul Sharma — AC not cooling moved to In Progress.', to: '/owner/complaints', date: '2026-05-14', at: '08:15', read: true },
  { id: 'NTF-O6', role: 'OWNER', kind: 'ANNOUNCEMENT', title: 'Announcement published', body: 'Water tank cleaning on 16 May — Shree Shyam Boys PG.', to: '/owner/announcements', date: '2026-05-12', at: '12:00', read: true },
  { id: 'NTF-O7', role: 'OWNER', kind: 'MAINTENANCE', title: 'Important maintenance notice', body: 'Electricity maintenance scheduled at Ashiana PG on 15 May.', to: '/owner/announcements', date: '2026-05-13', at: '11:30', read: false },

  // ---- student side (stu-13 = Rahul Sharma, the logged-in demo student)
  { id: 'NTF-S1', role: 'STUDENT', studentId: 'stu-13', kind: 'MESSAGE', title: 'New message from your PG owner', body: 'It is on your My Bills screen — ₹7,900 for May (demo).', to: '/student/messages', date: '2026-05-14', at: '09:47', read: false },
  { id: 'NTF-S2', role: 'STUDENT', studentId: 'stu-13', kind: 'COMPLAINT', title: 'Owner responded to your complaint', body: 'Technician scheduled for 15 May morning, 9–11 AM (demo).', to: '/student/complaints', date: '2026-05-14', at: '08:15', read: false },
  { id: 'NTF-S3', role: 'STUDENT', studentId: 'stu-13', kind: 'ANNOUNCEMENT', title: 'New PG announcement', body: 'Rent due — pay directly to the owner before 5 June.', to: '/student/notices', date: '2026-05-10', at: '10:00', read: true },
  { id: 'NTF-S4', role: 'STUDENT', studentId: 'stu-13', kind: 'ANNOUNCEMENT', title: 'Water tank cleaning on 16 May', body: 'Supply paused 10 AM–2 PM — store water in advance (demo).', to: '/student/notices', date: '2026-05-12', at: '12:00', read: false },
  { id: 'NTF-S5', role: 'STUDENT', studentId: 'stu-13', kind: 'MAINTENANCE', title: 'Important maintenance notice', body: 'Gate closes at 11 PM sharp — rules reminder (demo).', to: '/student/notices', date: '2026-05-02', at: '09:00', read: true },
]
