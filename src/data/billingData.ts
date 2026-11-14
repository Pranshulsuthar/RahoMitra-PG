/**
 * ---------------------------------------------------------------------------
 * SECTION 06 — CENTRALISED BILLING DEMO DATA
 * ---------------------------------------------------------------------------
 * Illustrative sample bills + payments for interface demonstration only.
 * Seeds are generated from the existing Section 04 demo students and rooms
 * (Shree Shyam Boys PG / Ashiana PG) so names, rooms and rents always match
 * the rest of the app. Nothing here is a real transaction — reload the page
 * to restore this original dataset.
 *
 * Status mix across 13 active students × Mar/Apr/May 2026 (39 bills):
 *   PAID 22 · UNPAID 8 · OVERDUE 3 · PARTIALLY_PAID 4 · DRAFT 2
 * Rahul Sharma (stu-13) — the Section 05 logged-in student — holds the
 * PARTIALLY_PAID May bill (₹4,000 of ₹7,900 received).
 * ---------------------------------------------------------------------------
 */
import type { PaymentDetails, PaymentRecord, PaymentMethod, RentBill } from '../types/billing'
import { billTotal } from '../types/billing'
import { OWNER_PROPERTIES, OWNER_ROOMS, OWNER_STUDENTS } from './ownerData'

/** Fixed "today" for the whole demo (matches the owner console). */
export const BILLING_TODAY = '2026-05-14'

/** The student logged into the Section 05 student portal. */
export const DEMO_STUDENT_ID = 'stu-13'

const BILLING_MONTHS = ['2026-03', '2026-04', '2026-05']

const roomById = new Map(OWNER_ROOMS.map((r) => [r.id, r]))

const PROPERTY_NAMES: Record<string, string> = Object.fromEntries(
  OWNER_PROPERTIES.map((p) => [p.id, p.name]),
)

/** Property display name with a safe fallback for demo-generated records. */
export function propertyName(propertyId: string): string {
  return PROPERTY_NAMES[propertyId] ?? 'Demo PG'
}

/* ------------------------------------------------------- deterministic plan */

type Plan = 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL' | 'DRAFT'

/** Per-month overrides keyed by active-student index — everything else defaults. */
const PLAN: Array<Record<number, Plan>> = [
  /* March 2026  */ { 4: 'OVERDUE', 9: 'PARTIAL' },
  /* April 2026  */ { 2: 'OVERDUE', 7: 'OVERDUE', 5: 'PARTIAL', 11: 'PARTIAL' },
  /* May 2026    */ { 0: 'PAID', 12: 'PAID', 11: 'PARTIAL', 3: 'DRAFT', 6: 'DRAFT' },
]

const ELEC = [640, 815, 470, 1120, 690, 535, 905, 605, 775, 425, 860, 555, 700]
const WATER = [180, 150, 220, 165, 200, 140, 240, 175, 190, 160, 210, 155, 185]

const METHODS: PaymentMethod[] = ['UPI', 'UPI', 'CASH', 'UPI', 'BANK_TRANSFER', 'UPI', 'OTHER']

const activeStudents = OWNER_STUDENTS.filter((s) => s.membership === 'ACTIVE' && s.roomId)

function seedBills(): RentBill[] {
  const bills: RentBill[] = []

  activeStudents.forEach((student, i) => {
    const room = roomById.get(student.roomId)
    if (!room) return
    const bedLabel = student.bedId.split('-bed-')[1] ?? 'A'

    BILLING_MONTHS.forEach((month, m) => {
      const plan: Plan = PLAN[m][i] ?? (m < 2 ? 'PAID' : 'UNPAID')

      let rent = room.rent
      let electricity = ELEC[i % ELEC.length] + m * 40
      let water = WATER[i % WATER.length]
      let maintenance = 250
      let food = i % 3 === 0 ? 1600 : 0
      let extra = i % 5 === 0 ? 300 : 0
      let discount = i % 7 === 0 ? 500 : 0

      // Rahul's May bill: ₹7,500 rent + ₹400 electricity = ₹7,900 (demo story).
      if (i === 11 && month === '2026-05') {
        electricity = 400
        water = 0
        maintenance = 0
        food = 0
        extra = 0
        discount = 0
      }

      const draft = plan === 'DRAFT'
      const bill: RentBill = {
        id: `RM-BILL-${month.slice(2).replace('-', '')}-${String(m * 100 + i + 1).padStart(3, '0')}`,
        propertyId: student.propertyId,
        studentId: student.id,
        studentName: student.name,
        roomId: room.id,
        roomNumber: room.number,
        bedLabel,
        month,
        rent,
        electricity,
        water,
        maintenance,
        food,
        extra,
        discount,
        dueDate: dueFor(month),
        notes:
          m === 2
            ? 'Rent for May 2026 — please pay by 5 June 2026 (demo).'
            : i % 4 === 0
              ? 'Electricity as per meter reading (demo).'
              : '',
        draft,
        paidAmount: 0,
        generatedOn: `${month}-01`,
      }

      const total = billTotal(bill)
      if (plan === 'PAID') bill.paidAmount = total
      if (plan === 'PARTIAL') bill.paidAmount = i === 11 && month === '2026-05' ? 4000 : Math.round((total * 0.55) / 10) * 10

      bills.push(bill)
    })
  })

  return bills
}

/** 5th of the month after the billing month. */
function dueFor(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 5)).toISOString().slice(0, 10)
}

/** Payment received date for a (student index, billing month) pair. */
function paidOn(month: string, i: number): string {
  if (month === '2026-05') {
    if (i === 11) return '2026-05-09' // Rahul's partial payment
    return `2026-05-${String(5 + (i % 4)).padStart(2, '0')}`
  }
  const day = 4 + ((i * 3 + (month === '2026-04' ? 2 : 0)) % 11)
  return `${month}-${String(day).padStart(2, '0')}`
}

function seedPayments(bills: RentBill[]): PaymentRecord[] {
  const payments: PaymentRecord[] = []

  for (const bill of bills) {
    if (bill.paidAmount <= 0) continue
    const i = activeStudents.findIndex((s) => s.id === bill.studentId)
    const m = BILLING_MONTHS.indexOf(bill.month)
    const method = METHODS[(i + Math.max(m, 0)) % METHODS.length]
    const date = paidOn(bill.month, i)

    let reference = ''
    if (method === 'UPI') reference = `RHM${bill.month.replace('-', '')}${1000 + i}`
    if (method === 'BANK_TRANSFER') reference = `NEFT-DEMO-${2600 + i}`

    payments.push({
      id: `PAY-${bill.month.slice(2).replace('-', '')}-${String(i + 1).padStart(3, '0')}`,
      billId: bill.id,
      propertyId: bill.propertyId,
      studentId: bill.studentId,
      studentName: bill.studentName,
      amount: bill.paidAmount,
      method,
      reference,
      date,
      notes:
        method === 'CASH'
          ? 'Cash received at the PG counter — recorded by owner (demo).'
          : 'Received directly by the owner — RahoMitra does not process rent (demo).',
      recordedOn: date,
    })
  }

  return payments.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export const SEED_BILLS: RentBill[] = seedBills()

export const SEED_PAYMENTS: PaymentRecord[] = seedPayments(SEED_BILLS)

/** Default owner payment instructions — QR starts empty (no pre-filled images). */
export const DEFAULT_PAYMENT_DETAILS: PaymentDetails = {
  upiId: 'rakeshdemo@okaxis',
  accountHolder: 'Rakesh Sharma (demo)',
  instructions:
    'Pay directly via UPI, cash or bank transfer to the PG owner. RahoMitra does not collect rent online — the owner updates your payment status after manually confirming receipt.',
  qrImage: '',
}
