/**
 * ---------------------------------------------------------------------------
 * SECTION 04 — CENTRALISED PG OWNER DEMO DATA
 * ---------------------------------------------------------------------------
 * Every record is ILLUSTRATIVE SAMPLE DATA for interface demonstration only.
 * Names are fictional, emails use the non-routable "@rahomitra.demo" domain,
 * no real phone numbers exist anywhere in this file. The demo owner manages
 * exactly two sample properties (Shree Shyam Boys PG, Ashiana PG) — all rooms,
 * beds, students, admission codes and staff rows carry property IDs so the
 * data is already shaped for a future multi-tenant backend.
 * ---------------------------------------------------------------------------
 */
import type {
  AdmissionCode,
  AdmissionRequest,
  BedStatus,
  OwnerActivity,
  OwnerNotification,
  OwnerProperty,
  OwnerRoom,
  OwnerStudent,
  OwnerToast,
  RoomBed,
  StaffMember,
} from '../types/owner'
import { getPGBySlug } from './pgData'

/* -------------------------------------------------------------- helpers */

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

const facilityList = (flags: object) =>
  (Object.entries(flags) as [string, boolean][])
    .filter(([, on]) => on)
    .map(([key]) => FACILITY_LABELS[key] ?? key)

const bed = (roomId: string, label: string, status: BedStatus): RoomBed => ({
  id: `${roomId}-bed-${label}`,
  roomId,
  label,
  status,
})

const room = (
  id: string,
  propertyId: string,
  number: string,
  floor: number,
  type: OwnerRoom['type'],
  rent: number,
  beds: Array<[string, BedStatus]>,
): OwnerRoom => ({
  id,
  propertyId,
  number,
  floor,
  type,
  rent,
  beds: beds.map(([label, status]) => bed(id, label, status)),
})

/* --------------------------------------------------------------- owner */

export const DEMO_OWNER_ID = 'own-001'

export const DEMO_OWNER_PROFILE = {
  id: DEMO_OWNER_ID,
  name: 'Rakesh Sharma (demo)',
  email: 'owner1@rahomitra.demo',
  mobile: '98765 43000',
  city: 'Jaipur',
  bio: 'Demo PG owner managing two sample properties in Jaipur through the RahoMitra owner dashboard.',
} as const

/* ----------------------------------------------------------- properties */

const shyam = getPGBySlug('shree-shyam-boys-pg')!
const ashiana = getPGBySlug('ashiana-pg')!

export const OWNER_PROPERTIES: OwnerProperty[] = [
  {
    id: 'pg-001',
    ownerId: DEMO_OWNER_ID,
    name: shyam.name,
    type: 'BOYS',
    description: shyam.description,
    city: shyam.city,
    address: 'B-14, Malviya Nagar, Near College Gate, Jaipur 302017 (demo address)',
    locality: shyam.locality,
    contactPhone: '98765 43001',
    contactEmail: 'shreeshyam@rahomitra.demo',
    securityDeposit: shyam.securityDeposit,
    facilities: facilityList(shyam.facilities),
    food: 'INCLUDED',
    rules: shyam.rules,
    coverImage: shyam.coverImage,
    gallery: shyam.gallery,
    status: 'ACTIVE',
    listedOn: '2026-01-18',
  },
  {
    id: 'pg-002',
    ownerId: DEMO_OWNER_ID,
    name: ashiana.name,
    type: 'GIRLS',
    description: ashiana.description,
    city: ashiana.city,
    address: 'C-7, Vaishali Nagar, Opp. Park, Jaipur 302021 (demo address)',
    locality: ashiana.locality,
    contactPhone: '98765 43002',
    contactEmail: 'ashiana@rahomitra.demo',
    securityDeposit: ashiana.securityDeposit,
    facilities: facilityList(ashiana.facilities),
    food: 'INCLUDED',
    rules: ashiana.rules,
    coverImage: ashiana.coverImage,
    gallery: ashiana.gallery,
    status: 'ACTIVE',
    listedOn: '2026-02-04',
  },
]

/* ---------------------------------------------------------------- rooms */

export const OWNER_ROOMS: OwnerRoom[] = [
  // ---- Shree Shyam Boys PG (pg-001): 6 rooms · 13 beds
  room('r-101', 'pg-001', '101', 1, 'DOUBLE', 9500, [
    ['A', 'OCCUPIED'],
    ['B', 'AVAILABLE'],
  ]),
  room('r-102', 'pg-001', '102', 1, 'DOUBLE', 9500, [
    ['A', 'OCCUPIED'],
    ['B', 'OCCUPIED'],
  ]),
  room('r-103', 'pg-001', '103', 1, 'TRIPLE', 7800, [
    ['A', 'OCCUPIED'],
    ['B', 'OCCUPIED'],
    ['C', 'MAINTENANCE'],
  ]),
  room('r-104', 'pg-001', '104', 1, 'SINGLE', 12500, [['A', 'OCCUPIED']]),
  room('r-201', 'pg-001', '201', 2, 'DOUBLE', 9500, [
    ['A', 'MAINTENANCE'],
    ['B', 'AVAILABLE'],
  ]),
  room('r-202', 'pg-001', '202', 2, 'TRIPLE', 7800, [
    ['A', 'OCCUPIED'],
    ['B', 'AVAILABLE'],
    ['C', 'AVAILABLE'],
  ]),
  // ---- Ashiana PG (pg-002): 4 rooms · 8 beds
  room('r-g01', 'pg-002', 'G-01', 0, 'SINGLE', 13500, [['A', 'OCCUPIED']]),
  room('r-g02', 'pg-002', 'G-02', 0, 'DOUBLE', 11000, [
    ['A', 'OCCUPIED'],
    ['B', 'OCCUPIED'],
  ]),
  room('r-g03', 'pg-002', 'G-03', 0, 'DOUBLE', 11000, [
    ['A', 'OCCUPIED'],
    ['B', 'AVAILABLE'],
  ]),
  room('r-g04', 'pg-002', 'G-04', 0, 'TRIPLE', 9000, [
    ['A', 'AVAILABLE'],
    ['B', 'AVAILABLE'],
    ['C', 'MAINTENANCE'],
  ]),
]

/* ------------------------------------------------------------- students */

/** Fictional student records — one ACTIVE student per OCCUPIED demo bed. */
export const OWNER_STUDENTS: OwnerStudent[] = [
  {
    id: 'stu-01', propertyId: 'pg-001', roomId: 'r-101', bedId: 'r-101-bed-A',
    name: 'Aditya Rao (demo)', email: 'student01@rahomitra.demo', mobile: '98765 43021',
    college: 'MNIT Jaipur (demo)', city: 'Jaipur', admissionDate: '2026-01-25', membership: 'ACTIVE',
  },
  {
    id: 'stu-02', propertyId: 'pg-001', roomId: 'r-102', bedId: 'r-102-bed-A',
    name: 'Rohit Singh (demo)', email: 'student02@rahomitra.demo', mobile: '98765 43022',
    college: 'Poornima University (demo)', city: 'Jaipur', admissionDate: '2026-02-02', membership: 'ACTIVE',
  },
  {
    id: 'stu-03', propertyId: 'pg-001', roomId: 'r-102', bedId: 'r-102-bed-B',
    name: 'Mohit Verma (demo)', email: 'student03@rahomitra.demo', mobile: '98765 43023',
    college: 'UET Jaipur (demo)', city: 'Kota', admissionDate: '2026-02-14', membership: 'ACTIVE',
  },
  {
    id: 'stu-04', propertyId: 'pg-001', roomId: 'r-103', bedId: 'r-103-bed-A',
    name: 'Kunal Joshi (demo)', email: 'student04@rahomitra.demo', mobile: '98765 43024',
    college: 'Manipal University Jaipur (demo)', city: 'Ajmer', admissionDate: '2026-02-20', membership: 'ACTIVE',
  },
  {
    id: 'stu-05', propertyId: 'pg-001', roomId: 'r-103', bedId: 'r-103-bed-B',
    name: 'Sahil Khan (demo)', email: 'student05@rahomitra.demo', mobile: '98765 43025',
    college: 'MNIT Jaipur (demo)', city: 'Jaipur', admissionDate: '2026-03-05', membership: 'ACTIVE',
  },
  {
    id: 'stu-06', propertyId: 'pg-001', roomId: 'r-104', bedId: 'r-104-bed-A',
    name: 'Devendra Parmar (demo)', email: 'student06@rahomitra.demo', mobile: '98765 43026',
    college: 'Poornima University (demo)', city: 'Bhilwara', admissionDate: '2026-03-18', membership: 'ACTIVE',
  },
  {
    id: 'stu-07', propertyId: 'pg-001', roomId: 'r-202', bedId: 'r-202-bed-A',
    name: 'Yash Choudhary (demo)', email: 'student07@rahomitra.demo', mobile: '98765 43027',
    college: 'UET Jaipur (demo)', city: 'Sikar', admissionDate: '2026-04-01', membership: 'ACTIVE',
  },
  {
    id: 'stu-08', propertyId: 'pg-002', roomId: 'r-g01', bedId: 'r-g01-bed-A',
    name: 'Ananya Mishra (demo)', email: 'student08@rahomitra.demo', mobile: '98765 43028',
    college: 'Manipal University Jaipur (demo)', city: 'Jaipur', admissionDate: '2026-02-10', membership: 'ACTIVE',
  },
  {
    id: 'stu-09', propertyId: 'pg-002', roomId: 'r-g02', bedId: 'r-g02-bed-A',
    name: 'Priya Solanki (demo)', email: 'student09@rahomitra.demo', mobile: '98765 43029',
    college: 'MNIT Jaipur (demo)', city: 'Alwar', admissionDate: '2026-02-22', membership: 'ACTIVE',
  },
  {
    id: 'stu-10', propertyId: 'pg-002', roomId: 'r-g02', bedId: 'r-g02-bed-B',
    name: 'Ritu Prajapat (demo)', email: 'student10@rahomitra.demo', mobile: '98765 43030',
    college: 'Poornima University (demo)', city: 'Jaipur', admissionDate: '2026-03-11', membership: 'ACTIVE',
  },
  {
    id: 'stu-11', propertyId: 'pg-002', roomId: 'r-g03', bedId: 'r-g03-bed-A',
    name: 'Simran Kaur (demo)', email: 'student11@rahomitra.demo', mobile: '98765 43031',
    college: 'UET Jaipur (demo)', city: 'Jodhpur', admissionDate: '2026-04-06', membership: 'ACTIVE',
  },
  {
    id: 'stu-12', propertyId: 'pg-001', roomId: '', bedId: '',
    name: 'Harsh Vyas (demo)', email: 'student12@rahomitra.demo', mobile: '98765 43032',
    college: 'MNIT Jaipur (demo)', city: 'Udaipur', admissionDate: '2026-01-30', membership: 'INACTIVE',
  },
]

/* ------------------------------------------------------- admission codes */

export const ADMISSION_CODES: AdmissionCode[] = [
  {
    id: 'code-1', propertyId: 'pg-001', code: 'ADM-SHYAM-7K2P', roomPreference: 'r-101',
    expiresOn: '2026-05-21', status: 'ACTIVE', createdOn: '2026-05-12',
  },
  {
    id: 'code-2', propertyId: 'pg-002', code: 'ADM-ASH-9M4T', roomPreference: '',
    expiresOn: '2026-05-18', status: 'ACTIVE', createdOn: '2026-05-11',
  },
  {
    id: 'code-3', propertyId: 'pg-001', code: 'ADM-SHYAM-3B8X', roomPreference: '',
    expiresOn: '2026-05-10', status: 'EXPIRED', createdOn: '2026-05-02',
  },
]

/* ----------------------------------------------------- admission requests */

export const ADMISSION_REQUESTS: AdmissionRequest[] = [
  {
    id: 'req-1', propertyId: 'pg-001', code: 'ADM-SHYAM-7K2P', roomPreference: 'r-101',
    studentName: 'Ishita Rathore (demo)', studentEmail: 'student15@rahomitra.demo',
    studentMobile: '98765 43077', requestedOn: '2026-05-13', status: 'PENDING',
  },
  {
    id: 'req-2', propertyId: 'pg-001', code: 'ADM-SHYAM-7K2P', roomPreference: '',
    studentName: 'Karan Yadav (demo)', studentEmail: 'student16@rahomitra.demo',
    studentMobile: '98765 43078', requestedOn: '2026-05-14', status: 'PENDING',
  },
  {
    id: 'req-3', propertyId: 'pg-002', code: 'ADM-ASH-9M4T', roomPreference: 'r-g03',
    studentName: 'Sneha Kapoor (demo)', studentEmail: 'student17@rahomitra.demo',
    studentMobile: '98765 43079', requestedOn: '2026-05-12', status: 'PENDING',
  },
  {
    id: 'req-4', propertyId: 'pg-001', code: 'ADM-SHYAM-3B8X', roomPreference: 'r-104',
    studentName: 'Devendra Parmar (demo)', studentEmail: 'student06@rahomitra.demo',
    studentMobile: '98765 43026', requestedOn: '2026-05-06', status: 'APPROVED',
    decidedOn: '2026-05-08',
  },
  {
    id: 'req-5', propertyId: 'pg-002', code: 'ADM-ASH-9M4T', roomPreference: 'r-g01',
    studentName: 'Preeti Jain (demo)', studentEmail: 'student18@rahomitra.demo',
    studentMobile: '98765 43080', requestedOn: '2026-05-07', status: 'REJECTED',
    decidedOn: '2026-05-09', reason: 'Single room already full (demo decision).',
  },
]

/* ---------------------------------------------------------------- staff */

export const OWNER_STAFF: StaffMember[] = [
  {
    id: 'staff-1', propertyId: 'pg-001', name: 'Suresh Jangir (demo)',
    email: 'staff01@rahomitra.demo', mobile: '98765 43101', role: 'MANAGER', joinedOn: '2026-01-20',
  },
  {
    id: 'staff-2', propertyId: 'pg-001', name: 'Anita Sharma (demo)',
    email: 'staff02@rahomitra.demo', mobile: '98765 43102', role: 'WARDEN', joinedOn: '2026-02-01',
  },
  {
    id: 'staff-3', propertyId: 'pg-002', name: 'Meena Parewa (demo)',
    email: 'staff03@rahomitra.demo', mobile: '98765 43103', role: 'WARDEN', joinedOn: '2026-02-10',
  },
  {
    id: 'staff-4', propertyId: 'pg-002', name: 'Ramesh Saini (demo)',
    email: 'staff04@rahomitra.demo', mobile: '98765 43104', role: 'MAINTENANCE', joinedOn: '2026-03-02',
  },
  {
    id: 'staff-5', propertyId: 'pg-002', name: 'Vikas Agarwal (demo)',
    email: 'staff05@rahomitra.demo', mobile: '98765 43105', role: 'ACCOUNTANT', joinedOn: '2026-03-15',
  },
]

/* --------------------------------------------------------- notifications */

export const OWNER_NOTIFICATIONS: OwnerNotification[] = [
  {
    id: 'on-1', title: 'New admission request', category: 'ADMISSION',
    message: 'Ishita Rathore (demo) submitted a request for Shree Shyam Boys PG — room 101 preferred.',
    on: '2026-05-13', read: false,
  },
  {
    id: 'on-2', title: 'Bed marked for maintenance', category: 'ROOM',
    message: 'Bed C in room 103 (Shree Shyam Boys PG) is under maintenance (demo update).',
    on: '2026-05-12', read: false,
  },
  {
    id: 'on-3', title: 'Admission code expiring soon', category: 'ADMISSION',
    message: 'Code ADM-ASH-9M4T expires on 18 May 2026 (demo reminder).',
    on: '2026-05-11', read: true,
  },
  {
    id: 'on-4', title: 'Property listing is live', category: 'PROPERTY',
    message: 'Ashiana PG is approved and visible on the public Explore page (demo state).',
    on: '2026-05-05', read: true,
  },
]

/* ------------------------------------------------------------ activities */

export const OWNER_ACTIVITIES: OwnerActivity[] = [
  { id: 'oa-1', propertyId: 'pg-001', text: 'Admission request from “Ishita Rathore (demo)” received', time: '1 day ago', kind: 'admission' },
  { id: 'oa-2', propertyId: 'pg-001', text: 'Bed C in room 103 marked MAINTENANCE', time: '2 days ago', kind: 'room' },
  { id: 'oa-3', propertyId: 'pg-002', text: 'Admission code ADM-ASH-9M4T generated', time: '3 days ago', kind: 'admission' },
  { id: 'oa-4', propertyId: 'pg-001', text: 'Student “Devendra Parmar (demo)” approved for room 104', time: '6 days ago', kind: 'student' },
  { id: 'oa-5', propertyId: 'pg-002', text: 'Staff member “Ramesh Saini (demo)” added', time: '2 weeks ago', kind: 'staff' },
  { id: 'oa-6', propertyId: 'pg-002', text: 'Listing details updated for Ashiana PG', time: '3 weeks ago', kind: 'property' },
]

export const OWNER_TOASTS: OwnerToast[] = []
