import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ReceiptText } from 'lucide-react'
import { Modal } from '../admin/Modal'
import { Button } from '../common/Button'
import { FormInput, FormSelect, FormTextarea } from '../owner/FormInput'
import type { OwnerProperty, OwnerRoom, OwnerStudent } from '../../types/owner'
import type { BillInput, RentBill } from '../../types/billing'
import { dueDateFor, formatDate, monthLabel } from '../../types/billing'
import { formatINR } from '../../utils/format'

const MONTH_OPTIONS = ['2026-03', '2026-04', '2026-05', '2026-06']

interface FormState {
  propertyId: string
  studentId: string
  month: string
  rent: string
  electricity: string
  water: string
  maintenance: string
  food: string
  extra: string
  discount: string
  dueDate: string
  notes: string
}

export interface BillSubmitMeta {
  studentName: string
  roomId: string
  roomNumber: string
  bedLabel: string
}

interface GenerateBillModalProps {
  open: boolean
  editing: RentBill | null
  properties: OwnerProperty[]
  rooms: OwnerRoom[]
  students: OwnerStudent[]
  onClose: () => void
  onSubmit: (
    id: string | null,
    input: BillInput,
    draft: boolean,
    meta: BillSubmitMeta,
  ) => { ok: boolean; error?: string }
}

const num = (v: string) => Math.max(0, Number(v) || 0)

/** Generate / edit a monthly rent bill with a live preview + duplicate guard. */
export function GenerateBillModal({
  open,
  editing,
  properties,
  rooms,
  students,
  onClose,
  onSubmit,
}: GenerateBillModalProps) {
  const [form, setForm] = useState<FormState>({
    propertyId: '',
    studentId: '',
    month: '2026-05',
    rent: '',
    electricity: '0',
    water: '0',
    maintenance: '0',
    food: '0',
    extra: '0',
    discount: '0',
    dueDate: dueDateFor('2026-05'),
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  /* ------------------------------------------------------ initial values */
  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError(null)
    if (editing) {
      setForm({
        propertyId: editing.propertyId,
        studentId: editing.studentId,
        month: editing.month,
        rent: String(editing.rent),
        electricity: String(editing.electricity),
        water: String(editing.water),
        maintenance: String(editing.maintenance),
        food: String(editing.food),
        extra: String(editing.extra),
        discount: String(editing.discount),
        dueDate: editing.dueDate,
        notes: editing.notes,
      })
    } else {
      const propertyId = properties[0]?.id ?? ''
      setForm({
        propertyId,
        studentId: '',
        month: '2026-05',
        rent: '',
        electricity: '0',
        water: '0',
        maintenance: '0',
        food: '0',
        extra: '0',
        discount: '0',
        dueDate: dueDateFor('2026-05'),
        notes: '',
      })
    }
  }, [open, editing, properties])

  /* ------------------------------------------------------------- options */
  const propertyOptions = properties.map((p) => ({ value: p.id, label: p.name }))

  const studentOptions = useMemo(
    () =>
      students
        .filter(
          (s) =>
            s.propertyId === form.propertyId &&
            s.membership === 'ACTIVE' &&
            s.roomId.length > 0,
        )
        .map((s) => ({ value: s.id, label: s.name })),
    [students, form.propertyId],
  )

  const monthOptions = useMemo(() => {
    const list = MONTH_OPTIONS.includes(form.month)
      ? MONTH_OPTIONS
      : [form.month, ...MONTH_OPTIONS]
    return list.map((m) => ({ value: m, label: monthLabel(m) }))
  }, [form.month])

  const selectedStudent = students.find((s) => s.id === form.studentId)
  const selectedRoom = rooms.find((r) => r.id === selectedStudent?.roomId)
  const bedLabel = selectedStudent?.bedId.split('-bed-')[1] ?? '—'

  /* ------------------------------------------------------------ live calc */
  const subtotal =
    num(form.rent) +
    num(form.electricity) +
    num(form.water) +
    num(form.maintenance) +
    num(form.food) +
    num(form.extra)
  const finalAmount = Math.max(0, subtotal - num(form.discount))

  const set = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
    setFormError(null)
  }

  /* ---------------------------------------------------------- validations */
  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.propertyId) next.propertyId = 'Select a PG property.'
    if (!form.studentId) next.studentId = 'Select a student.'
    if (!form.month) next.month = 'Select a billing month.'
    if (!(Number(form.rent) > 0)) next.rent = 'Monthly rent must be greater than zero.'
    if (!form.dueDate) next.dueDate = 'Due date is required.'
    const charges: Array<[keyof FormState, string]> = [
      ['electricity', 'Electricity'],
      ['water', 'Water'],
      ['maintenance', 'Maintenance'],
      ['food', 'Food'],
      ['extra', 'Extra'],
      ['discount', 'Discount'],
    ]
    for (const [key, label] of charges) {
      if (Number(form[key]) < 0) next[key] = `${label} charges cannot be negative.`
    }
    if (subtotal > 0 && finalAmount <= 0) next.discount = 'Discount cannot exceed the subtotal.'
    if (finalAmount <= 0) next.rent = 'Final amount must be greater than zero.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (draft: boolean) => {
    if (!validate()) return
    const input: BillInput = {
      propertyId: form.propertyId,
      studentId: form.studentId,
      month: form.month,
      rent: num(form.rent),
      electricity: num(form.electricity),
      water: num(form.water),
      maintenance: num(form.maintenance),
      food: num(form.food),
      extra: num(form.extra),
      discount: num(form.discount),
      dueDate: form.dueDate,
      notes: form.notes.trim(),
    }
    const meta: BillSubmitMeta = {
      studentName: selectedStudent?.name ?? 'Demo Student',
      roomId: selectedStudent?.roomId ?? '',
      roomNumber: selectedRoom?.number ?? '—',
      bedLabel,
    }
    const result = onSubmit(editing?.id ?? null, input, draft, meta)
    if (!result.ok) setFormError(result.error ?? 'Could not save the bill.')
  }

  const chargeFields: Array<{ key: keyof FormState; label: string; hint?: string }> = [
    { key: 'electricity', label: 'Electricity Charges (₹)' },
    { key: 'water', label: 'Water Charges (₹)' },
    { key: 'maintenance', label: 'Maintenance Charges (₹)' },
    { key: 'food', label: 'Food Charges (₹)' },
    { key: 'extra', label: 'Extra Charges (₹)' },
    { key: 'discount', label: 'Discount (₹, optional)', hint: 'Deducted from the subtotal.' },
  ]

  return (
    <Modal
      open={open}
      title={editing ? `Edit bill ${editing.id}` : 'Generate Monthly Bill'}
      subtitle="Frontend demo — calculations are automatic; nothing is sent anywhere."
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" onClick={() => submit(true)}>
            Save as Draft
          </Button>
          <Button variant="primary" onClick={() => submit(false)}>
            <ReceiptText className="h-4 w-4" aria-hidden />
            Generate Bill
          </Button>
        </>
      }
    >
      {formError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-[12.5px] font-semibold text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {formError}
        </div>
      )}

      {/* ------------------------------------------------------ live preview */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ivory/60 px-4 py-2.5">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
            <ReceiptText className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
            Bill preview
          </p>
          <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gold-dark">
            Before generating
          </span>
        </div>
        <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-2">
          <div className="space-y-1.5 text-[12.5px]">
            <p className="text-ink-soft">
              <span className="text-ink-mute">Student:</span>{' '}
              <strong className="text-ink">{selectedStudent?.name ?? '— select a student —'}</strong>
            </p>
            <p className="text-ink-soft">
              <span className="text-ink-mute">PG:</span>{' '}
              <strong className="text-ink">
                {properties.find((p) => p.id === form.propertyId)?.name ?? '—'}
              </strong>
            </p>
            <p className="text-ink-soft">
              <span className="text-ink-mute">Room / Bed:</span>{' '}
              <strong className="text-ink">
                {selectedRoom ? `Room ${selectedRoom.number}` : '—'} / Bed {selectedStudent ? bedLabel : '—'}
              </strong>
            </p>
            <p className="text-ink-soft">
              <span className="text-ink-mute">Period:</span>{' '}
              <strong className="text-ink">{monthLabel(form.month)}</strong>
            </p>
            <p className="text-ink-soft">
              <span className="text-ink-mute">Due date:</span>{' '}
              <strong className="text-ink">{form.dueDate ? formatDate(form.dueDate) : '—'}</strong>
            </p>
          </div>
          <div className="rounded-xl border border-line bg-ivory/40 px-4 py-3 text-[12.5px]">
            <div className="flex justify-between py-0.5 text-ink-soft">
              <span>Subtotal</span>
              <span className="font-semibold text-ink">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between py-0.5 text-ink-soft">
              <span>Discount</span>
              <span className="font-semibold text-ink">− {formatINR(num(form.discount))}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-xl bg-forest px-3 py-2">
              <span className="text-[12px] font-bold text-ivory">Final amount</span>
              <span className="text-base font-bold text-white">{formatINR(finalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- form */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect
          id="bill-property"
          label="Select PG Property"
          required
          value={form.propertyId}
          onChange={(v) =>
            set({
              propertyId: v,
              studentId: students.some((s) => s.id === form.studentId && s.propertyId === v)
                ? form.studentId
                : '',
              rent: '',
            })
          }
          options={propertyOptions}
          error={errors.propertyId}
        />
        <FormSelect
          id="bill-student"
          label="Select Student"
          required
          value={form.studentId}
          onChange={(v) => {
            const student = students.find((s) => s.id === v)
            const room = rooms.find((r) => r.id === student?.roomId)
            set({ studentId: v, rent: room ? String(room.rent) : form.rent })
          }}
          options={
            studentOptions.length > 0
              ? studentOptions
              : [{ value: '', label: 'No active students in this PG' }]
          }
          error={errors.studentId}
          hint={studentOptions.length === 0 ? 'Pick another property.' : undefined}
        />
        <FormInput
          id="bill-room"
          label="Room Number"
          value={selectedRoom ? `Room ${selectedRoom.number}` : ''}
          onChange={() => undefined}
          disabled
          placeholder="Auto-filled from allocation"
        />
        <FormInput
          id="bill-bed"
          label="Bed Number"
          value={selectedStudent ? `Bed ${bedLabel}` : ''}
          onChange={() => undefined}
          disabled
          placeholder="Auto-filled from allocation"
        />
        <FormSelect
          id="bill-month"
          label="Billing Month"
          required
          value={form.month}
          onChange={(v) => set({ month: v, dueDate: dueDateFor(v) })}
          options={monthOptions}
          error={errors.month}
          hint="Due date auto-set to the 5th of the next month."
        />
        <FormInput
          id="bill-rent"
          label="Monthly Rent (₹)"
          type="number"
          min={0}
          required
          value={form.rent}
          onChange={(v) => set({ rent: v })}
          placeholder="Auto-filled from room rent"
          error={errors.rent}
        />
        {chargeFields.map((field) => (
          <FormInput
            key={field.key}
            id={`bill-${field.key}`}
            label={field.label}
            type="number"
            min={0}
            value={form[field.key]}
            onChange={(v) => set({ [field.key]: v } as Partial<FormState>)}
            error={errors[field.key]}
            hint={field.hint}
          />
        ))}
        <FormInput
          id="bill-due"
          label="Due Date"
          type="date"
          required
          value={form.dueDate}
          onChange={(v) => set({ dueDate: v })}
          error={errors.dueDate}
        />
        <FormTextarea
          id="bill-notes"
          label="Additional Notes (optional)"
          rows={2}
          maxLength={300}
          value={form.notes}
          onChange={(v) => set({ notes: v })}
          placeholder="e.g. Electricity as per meter reading (demo)."
          className="sm:col-span-2"
        />
      </div>

      <p className="mt-4 text-[11.5px] text-ink-mute">
        Subtotal = rent + all charges · Final amount = subtotal − discount. Duplicate bills for the
        same student and billing month are blocked in this demo.
      </p>
    </Modal>
  )
}
