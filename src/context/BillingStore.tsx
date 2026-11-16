import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
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
import { useAuth } from './AuthContext'
import {
  cancelOwnerBill,
  fetchOwnerBills,
  fetchOwnerPaymentDetails,
  fetchOwnerPayments,
  fetchStudentBills,
  fetchStudentOwnerPaymentDetails,
  recordOwnerPayment,
  saveOwnerBill,
  updateOwnerPaymentDetails as apiUpdateOwnerPaymentDetails,
} from '../api/billing'

export interface BillSaveResult {
  ok: boolean
  error?: string
  billId?: string
  /** Status label after a recorded payment (e.g. 'PAID'). */
  statusLabel?: BillStatus
}

const BILLING_TODAY = new Date().toISOString().slice(0, 10)

const DEFAULT_PAYMENT_DETAILS: PaymentDetails = {
  upiId: '',
  accountHolder: '',
  instructions: 'Pay via UPI or direct bank transfer. The owner will record offline receipts once payment is received.',
  qrImage: '',
}

interface BillingStoreValue {
  bills: RentBill[]
  payments: PaymentRecord[]
  paymentDetails: PaymentDetails
  toasts: ToastItem[]
  loading: boolean

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

  /* refresh data from backend */
  refresh: () => Promise<void>

  /* toasts */
  pushToast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
}

const BillingStoreContext = createContext<BillingStoreValue | null>(null)

export function BillingStoreProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth()
  const [bills, setBills] = useState<RentBill[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ ...DEFAULT_PAYMENT_DETAILS })
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [loading, setLoading] = useState(false)

  const toastId = useRef(0)

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Load live data from API depending on authenticated role
  const loadLiveData = useCallback(async () => {
    if (!user || !role) return

    try {
      setLoading(true)
      if (role === 'owner') {
        const [apiBills, apiPayments, apiDetails] = await Promise.allSettled([
          fetchOwnerBills(),
          fetchOwnerPayments(),
          fetchOwnerPaymentDetails(),
        ])

        if (apiBills.status === 'fulfilled') {
          setBills(apiBills.value)
        }
        if (apiPayments.status === 'fulfilled') {
          setPayments(apiPayments.value)
        }
        if (apiDetails.status === 'fulfilled' && apiDetails.value.upiId) {
          setPaymentDetails((prev) => ({ ...prev, ...apiDetails.value }))
        }
      } else if (role === 'student') {
        const [apiBills, apiDetails] = await Promise.allSettled([
          fetchStudentBills(),
          fetchStudentOwnerPaymentDetails(),
        ])

        if (apiBills.status === 'fulfilled') {
          setBills(apiBills.value)
        }
        if (apiDetails.status === 'fulfilled' && apiDetails.value.upiId) {
          setPaymentDetails((prev) => ({ ...prev, ...apiDetails.value }))
        }
      }
    } catch {
      // Keep state intact
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    loadLiveData()
  }, [loadLiveData])

  const statusOf = useCallback((bill: RentBill) => {
    const today = new Date().toISOString().slice(0, 10)
    return billStatus(bill, today)
  }, [])

  const paymentsForBill = useCallback(
    (billId: string) => payments.filter((p) => p.billId === billId),
    [payments],
  )

  const studentBills = useCallback(
    (studentId: string) =>
      bills
        .filter((b) => (role === 'student' || b.studentId === studentId) && !b.draft)
        .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0)),
    [bills, role],
  )

  const studentPayments = useCallback(
    (studentId: string) =>
      payments
        .filter((p) => role === 'student' || p.studentId === studentId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [payments, role],
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
        // Call backend in background
        saveOwnerBill({ id, ...input, draft, meta }).catch((err) => {
          pushToast(err instanceof Error ? err.message : 'Failed to update bill on server', 'error')
        })
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
        studentName: meta?.studentName ?? 'Student',
        roomId: meta?.roomId ?? '',
        roomNumber: meta?.roomNumber ?? '—',
        bedLabel: meta?.bedLabel ?? '—',
        ...input,
        draft,
        paidAmount: 0,
        generatedOn: BILLING_TODAY,
      }
      setBills((prev) => [bill, ...prev])

      // Asynchronously persist to backend API
      saveOwnerBill({ id: newId, ...input, draft, meta })
        .then((persisted) => {
          // Sync with the backend's returned bill
          setBills((prev) => prev.map((b) => (b.id === newId ? persisted : b)))
        })
        .catch((err) => {
          // If server fails (e.g. 409 duplicate on server), rollback
          setBills((prev) => prev.filter((b) => b.id !== newId))
          pushToast(err instanceof Error ? err.message : 'Failed to save bill on server', 'error')
        })

      return { ok: true, billId: newId }
    },
    [bills, pushToast],
  )

  const cancelBill = useCallback(
    (id: string) => {
      const prevBills = [...bills]
      const prevPayments = [...payments]

      setBills((prev) => prev.filter((b) => b.id !== id))
      setPayments((prev) => prev.filter((p) => p.billId !== id))

      cancelOwnerBill(id).catch((err) => {
        // Rollback on server failure
        setBills(prevBills)
        setPayments(prevPayments)
        pushToast(err instanceof Error ? err.message : 'Failed to cancel bill', 'error')
      })
    },
    [bills, payments, pushToast],
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

      const tempPaymentId = `PAY-${Date.now()}`
      const payment: PaymentRecord = {
        id: tempPaymentId,
        billId: bill.id,
        propertyId: bill.propertyId,
        studentId: bill.studentId,
        studentName: bill.studentName,
        amount: input.amount,
        method: input.method,
        reference: input.reference.trim(),
        date: input.date,
        notes: input.notes.trim(),
        recordedOn: new Date().toISOString().slice(0, 10),
      }
      setPayments((prev) => [payment, ...prev])

      const updated: RentBill = { ...bill, paidAmount: nextPaid }
      const status = billStatus(updated, new Date().toISOString().slice(0, 10))

      // Persist to backend
      recordOwnerPayment(input)
        .then((res) => {
          // Replace temp payment with persisted payment and sync bill
          setPayments((prev) => prev.map((p) => (p.id === tempPaymentId ? res.payment : p)))
          setBills((prev) => prev.map((b) => (b.id === bill.id ? res.bill : b)))
        })
        .catch((err) => {
          // Rollback on server failure
          setBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)))
          setPayments((prev) => prev.filter((p) => p.id !== tempPaymentId))
          pushToast(err instanceof Error ? err.message : 'Failed to record payment on server', 'error')
        })

      return { ok: true, billId: bill.id, statusLabel: status }
    },
    [bills, pushToast],
  )

  const updatePaymentDetails = useCallback(
    (patch: Partial<PaymentDetails>) => {
      setPaymentDetails((prev) => ({ ...prev, ...patch }))
      apiUpdateOwnerPaymentDetails(patch).catch((err) => {
        pushToast(err instanceof Error ? err.message : 'Failed to update payment details on server', 'error')
      })
    },
    [pushToast],
  )

  const value = useMemo<BillingStoreValue>(
    () => ({
      bills,
      payments,
      paymentDetails,
      toasts,
      loading,
      statusOf,
      paymentsForBill,
      studentBills,
      studentPayments,
      saveBill,
      cancelBill,
      recordPayment,
      updatePaymentDetails,
      refresh: loadLiveData,
      pushToast,
      dismissToast,
    }),
    [
      bills,
      payments,
      paymentDetails,
      toasts,
      loading,
      statusOf,
      paymentsForBill,
      studentBills,
      studentPayments,
      saveBill,
      cancelBill,
      recordPayment,
      updatePaymentDetails,
      loadLiveData,
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
