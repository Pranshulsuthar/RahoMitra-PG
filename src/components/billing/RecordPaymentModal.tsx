import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BadgeIndianRupee } from 'lucide-react'
import { Modal } from '../admin/Modal'
import { ConfirmDialog } from '../admin/ConfirmDialog'
import { Button } from '../common/Button'
import { FormInput, FormSelect, FormTextarea } from '../owner/FormInput'
import type { PaymentInput, PaymentMethod, RentBill } from '../../types/billing'
import {
  PAYMENT_METHOD_LABELS,
  billRemaining,
  billTotal,
  formatDate,
  monthLabel,
} from '../../types/billing'
import { BILLING_TODAY } from '../../data/billingData'
import { formatINR } from '../../utils/format'

interface RecordPaymentModalProps {
  open: boolean
  /** Open (unpaid / partially paid / overdue, non-draft) bills. */
  bills: RentBill[]
  defaultBillId: string | null
  onClose: () => void
  onRecord: (input: PaymentInput) => { ok: boolean; error?: string; statusLabel?: string }
}

const METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}))

/**
 * Owner records an offline payment the student made directly (UPI / cash /
 * bank transfer). RahoMitra never verifies it — the owner must manually
 * confirm the money was actually received before it is stored.
 */
export function RecordPaymentModal({
  open,
  bills,
  defaultBillId,
  onClose,
  onRecord,
}: RecordPaymentModalProps) {
  const [billId, setBillId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('UPI')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(BILLING_TODAY)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const bill = bills.find((b) => b.id === billId)
  const remaining = bill ? billRemaining(bill) : 0

  const billOptions = useMemo(
    () =>
      bills.map((b) => ({
        value: b.id,
        label: `${b.id} · ${b.studentName} · ${monthLabel(b.month)} · balance ${formatINR(
          billRemaining(b),
        )}`,
      })),
    [bills],
  )

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError(null)
    setConfirmOpen(false)
    setMethod('UPI')
    setReference('')
    setDate(BILLING_TODAY)
    setNotes('')
    const initial = defaultBillId ?? bills[0]?.id ?? ''
    setBillId(initial)
    const initialBill = bills.find((b) => b.id === initial)
    setAmount(initialBill ? String(billRemaining(initialBill)) : '')
  }, [open, defaultBillId, bills])

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!billId) next.billId = 'Select a bill.'
    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      next.amount = 'Enter an amount greater than zero.'
    } else if (bill && value > remaining) {
      next.amount = `Cannot exceed the remaining balance of ${formatINR(remaining)}.`
    }
    if (!date) next.date = 'Payment date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSelectBill = (id: string) => {
    setBillId(id)
    const target = bills.find((b) => b.id === id)
    if (target) setAmount(String(billRemaining(target)))
    setFormError(null)
  }

  const proceed = () => {
    if (!validate()) return
    setConfirmOpen(true)
  }

  const confirmRecord = () => {
    if (!bill) return
    const result = onRecord({
      billId,
      amount: Number(amount),
      method,
      reference,
      date,
      notes,
    })
    if (!result.ok) {
      setConfirmOpen(false)
      setFormError(result.error ?? 'Could not record the payment.')
      return
    }
    setConfirmOpen(false)
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        title="Record Payment"
        subtitle="Students pay the PG owner directly (offline) — RahoMitra does not collect rent online."
        onClose={onClose}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={proceed}>
              <BadgeIndianRupee className="h-4 w-4" aria-hidden />
              Record payment
            </Button>
          </>
        }
      >
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
          <BadgeIndianRupee className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          You are recording money you have already received. You will be asked to confirm this
          manually — RahoMitra never verifies UPI or bank transactions in this demo.
        </div>

        {formError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-[12.5px] font-semibold text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="pay-bill"
            label="Select Bill"
            required
            value={billId}
            onChange={handleSelectBill}
            options={
              billOptions.length > 0
                ? billOptions
                : [{ value: '', label: 'No open bills right now' }]
            }
            error={errors.billId}
            hint={billOptions.length === 0 ? 'Every bill is fully paid or still a draft.' : undefined}
            className="sm:col-span-2"
          />
          <FormInput
            id="pay-student"
            label="Student Name"
            value={bill?.studentName ?? ''}
            onChange={() => undefined}
            disabled
            placeholder="Auto-filled from the selected bill"
          />
          <FormInput
            id="pay-balance"
            label="Remaining Balance"
            value={bill ? formatINR(remaining) : ''}
            onChange={() => undefined}
            disabled
            placeholder="Auto-filled"
          />
          <FormInput
            id="pay-amount"
            label="Amount Received (₹)"
            type="number"
            min={0}
            required
            value={amount}
            onChange={(v) => setAmount(v)}
            error={errors.amount}
            hint={`Full remaining: ${formatINR(remaining)}`}
          />
          <FormSelect
            id="pay-method"
            label="Payment Method"
            value={method}
            onChange={(v) => setMethod(v as PaymentMethod)}
            options={METHOD_OPTIONS}
          />
          <FormInput
            id="pay-ref"
            label="Transaction Reference (optional)"
            value={reference}
            onChange={setReference}
            placeholder="e.g. UPI ref / cheque no."
            hint="Leave blank for cash payments."
          />
          <FormInput
            id="pay-date"
            label="Payment Date"
            type="date"
            required
            value={date}
            onChange={setDate}
            error={errors.date}
          />
          <FormTextarea
            id="pay-notes"
            label="Notes (optional)"
            rows={2}
            maxLength={300}
            value={notes}
            onChange={setNotes}
            placeholder="e.g. Cash handed over at the PG counter (demo)."
            className="sm:col-span-2"
          />
        </div>

        {bill && (
          <div className="mt-4 rounded-2xl border border-line bg-ivory/40 px-4 py-3 text-[12.5px] text-ink-soft">
            <p>
              <span className="text-ink-mute">Bill:</span>{' '}
              <strong className="text-ink">{bill.id}</strong> · {monthLabel(bill.month)} · total{' '}
              <strong className="text-ink">{formatINR(billTotal(bill))}</strong> · already received{' '}
              <strong className="text-ink">{formatINR(bill.paidAmount)}</strong>
            </p>
            <p className="mt-1 text-ink-mute">
              Due {formatDate(bill.dueDate)} · after this payment the bill will be marked{' '}
              <strong className="text-ink-soft">
                {Number(amount) >= remaining ? 'PAID' : Number(amount) > 0 ? 'PARTIALLY PAID' : 'UNPAID'}
              </strong>
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm payment received?"
        message={
          <>
            You are recording <strong>{formatINR(Number(amount) || 0)}</strong> received from{' '}
            <strong>{bill?.studentName}</strong> for bill <strong>{bill?.id}</strong> via{' '}
            <strong>{PAYMENT_METHOD_LABELS[method]}</strong>. Confirm only if the money has actually
            been received — this is a manual, owner-confirmed entry (demo, no gateway verification).
          </>
        }
        confirmLabel="Yes, payment received"
        onConfirm={confirmRecord}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
