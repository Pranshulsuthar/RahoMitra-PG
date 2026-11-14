import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  BILLING_TODAY,
  DEFAULT_PAYMENT_DETAILS,
  SEED_BILLS,
  SEED_PAYMENTS,
} from '../data/billingData'
import type {
  BillInput,
  BillStatus,
  PaymentDetails,
  PaymentInput,
  PaymentRecord,
  RentBill,
} from '../types/billing'
import { billRemaining, billStatus, billTotal } from '../types/billing'
import { ToastStack } from '../components/common/ToastStack'
import type { ToastItem } from '../components/common/ToastStack'

/**
 * ---------------------------------------------------------------------------
 * SECTION 06 — single in-memory demo store for Billing & Payments.
 * Shared by the owner console and the student portal so a payment recorded
 * by the owner instantly reflects on the student's bill screen.
 * Every mutation is local React state only — reload to restore the seeds.
 * ---------------------------------------------------------------------------
 */

export interface BillSaveResult {
  ok: boolean
  error?: string
  billId?: string
  /** Status label after a recorded payment (e.g. 'PAID'). */
  statusLabel?: BillStatus
}

interface BillingStoreValue {
  bills: RentBill[]
  payments: PaymentRecord[]
  paymentDetails: PaymentDetails
  toasts: ToastItem[]

  /* derived */
  statusOf: (bill: RentBill) => BillStatus
  paymentsForBill: (billId: string) => PaymentRecord[]
  studentBills: (studentId: string) => RentBill[]
  studentPayments: (studentId: string) => PaymentRecord[]

  /* bill CRUD */
  saveBill: (
    id: string | null,
    input: BillInput,
    draft: boolean,
    meta?: { studentName: string; roomId: string; roomNumber: string; bedLabel: string },
  ) => BillSaveResult
  cancelBill: (id: string) => void

  /* manual payment recording (owner confirms offline receipt) */
  recordPayment: (input: PaymentInput) => BillSaveResult

  /* owner payment details (UPI / QR …) */
  updatePaymentDetails: (patch: Partial<PaymentDetails>) => void

  /* toasts */
  pushToast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
}

const BillingStoreContext = createContext<BillingStoreValue | null>(null)

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

export function BillingStoreProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<RentBill[]>(SEED_BILLS)
  const [payments, setPayments] = useState<PaymentRecord[]>(SEED_PAYMENTS)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ ...DEFAULT_PAYMENT_DETAILS })
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toastId = useRef(0)

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const statusOf = useCallback((bill: RentBill) => billStatus(bill, BILLING_TODAY), [])

  const paymentsForBill = useCallback(
    (billId: string) => payments.filter((p) => p.billId === billId),
    [payments],
  )

  const studentBills = useCallback(
    (studentId: string) =>
      bills
        .filter((b) => b.studentId === studentId && !b.draft)
        .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0)),
    [bills],
  )

  const studentPayments = useCallback(
    (studentId: string) =>
      payments
        .filter((p) => p.studentId === studentId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [payments],
  )

  /* ------------------------------------------------------------ bill CRUD */

  const saveBill = useCallback(
    (
      id: string | null,
      input: BillInput,
      draft: boolean,
      meta?: { studentName: string; roomId: string; roomNumber: string; bedLabel: string },
    ): BillSaveResult => {
      const duplicate = bills.find(
        (b) => b.studentId === input.studentId && b.month === input.month && b.id !== id,
      )
      if (duplicate) {
        return {
          ok: false,
          error: `A bill for this student already exists for ${input.month} (${duplicate.id}). Edit that bill instead.`,
        }
      }

      if (id) {
        setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...input, draft } : b)))
        return { ok: true, billId: id }
      }

      const prefix = `RM-BILL-${input.month.slice(2).replace('-', '')}-`
      let n = bills.filter((b) => b.id.startsWith(prefix)).length + 1
      let newId = `${prefix}${String(n).padStart(3, '0')}`
      while (bills.some((b) => b.id === newId)) {
        n += 1
        newId = `${prefix}${String(n).padStart(3, '0')}`
      }

      const bill: RentBill = {
        id: newId,
        studentName: meta?.studentName ?? 'Demo Student',
        roomId: meta?.roomId ?? '',
        roomNumber: meta?.roomNumber ?? '—',
        bedLabel: meta?.bedLabel ?? '—',
        ...input,
        draft,
        paidAmount: 0,
        generatedOn: BILLING_TODAY,
      }
      setBills((prev) => [bill, ...prev])
      return { ok: true, billId: newId }
    },
    [bills],
  )

  const cancelBill = useCallback(
    (id: string) => {
      setBills((prev) => prev.filter((b) => b.id !== id))
      setPayments((prev) => prev.filter((p) => p.billId !== id))
    },
    [],
  )

  /* -------------------------------------------------- manual payment entry */

  const recordPayment = useCallback(
    (input: PaymentInput): BillSaveResult => {
      const bill = bills.find((b) => b.id === input.billId)
      if (!bill) return { ok: false, error: 'Select a bill to record the payment against.' }
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        return { ok: false, error: 'Enter an amount greater than zero.' }
      }
      const remaining = billRemaining(bill)
      if (input.amount > remaining) {
        return {
          ok: false,
          error: `Amount exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')} for this bill.`,
        }
      }

      const nextPaid = bill.paidAmount + input.amount
      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? { ...b, paidAmount: nextPaid } : b)),
      )

      const payment: PaymentRecord = {
        id: uid('PAY'),
        billId: bill.id,
        propertyId: bill.propertyId,
        studentId: bill.studentId,
        studentName: bill.studentName,
        amount: input.amount,
        method: input.method,
        reference: input.reference.trim(),
        date: input.date,
        notes: input.notes.trim(),
        recordedOn: BILLING_TODAY,
      }
      setPayments((prev) => [payment, ...prev])

      const updated: RentBill = { ...bill, paidAmount: nextPaid }
      const status = billStatus(updated, BILLING_TODAY)
      return { ok: true, billId: bill.id, statusLabel: status }
    },
    [bills],
  )

  const updatePaymentDetails = useCallback(
    (patch: Partial<PaymentDetails>) => {
      setPaymentDetails((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  const value = useMemo<BillingStoreValue>(
    () => ({
      bills,
      payments,
      paymentDetails,
      toasts,
      statusOf,
      paymentsForBill,
      studentBills,
      studentPayments,
      saveBill,
      cancelBill,
      recordPayment,
      updatePaymentDetails,
      pushToast,
      dismissToast,
    }),
    [
      bills,
      payments,
      paymentDetails,
      toasts,
      statusOf,
      paymentsForBill,
      studentBills,
      studentPayments,
      saveBill,
      cancelBill,
      recordPayment,
      updatePaymentDetails,
      pushToast,
      dismissToast,
    ],
  )

  return (
    <BillingStoreContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </BillingStoreContext.Provider>
  )
}

export function useBillingStore(): BillingStoreValue {
  const ctx = useContext(BillingStoreContext)
  if (!ctx) throw new Error('useBillingStore must be used within BillingStoreProvider')
  return ctx
}

/** Convenience helper — total billed for a bill list. */
export function sumTotal(list: RentBill[]): number {
  return list.reduce((sum, b) => sum + billTotal(b), 0)
}
