import { Landmark, QrCode, Wallet } from 'lucide-react'
import type { BillStatus, PaymentDetails, PaymentRecord, RentBill } from '../../types/billing'
import {
  BILL_STATUS_LABELS,
  billRemaining,
  billSubtotal,
  billTotal,
  billingPeriod,
  formatDate,
  monthLabel,
} from '../../types/billing'
import { StatusBadge } from '../admin/StatusBadge'
import { formatINR } from '../../utils/format'

interface InvoiceViewProps {
  bill: RentBill
  status: BillStatus
  payments: PaymentRecord[]
  paymentDetails: PaymentDetails
  mode: 'owner' | 'student'
  propertyName?: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ivory/40 px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">{value}</p>
    </div>
  )
}

function ChargeRow({ label, amount, muted }: { label: string; amount: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className={muted ? 'text-ink-mute' : 'text-ink-soft'}>{label}</span>
      <span className={`font-semibold ${muted ? 'text-ink-mute' : 'text-ink'}`}>
        {muted && amount > 0 ? '− ' : ''}
        {formatINR(amount)}
      </span>
    </div>
  )
}

/**
 * Professional RahoMitra rent invoice — shared by the owner bill detail and
 * the student "My Bills" detail. Wrapped in `.print-area` so the browser
 * print dialog outputs only this card (see @media print in index.css).
 */
export function InvoiceView({
  bill,
  status,
  payments,
  paymentDetails,
  mode,
  propertyName: customPropName,
}: InvoiceViewProps) {
  const total = billTotal(bill)
  const remaining = billRemaining(bill)
  const discount = bill.discount

  return (
    <div className="print-area overflow-hidden rounded-3xl border border-line bg-white">
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-forest px-5 py-4 text-ivory sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
            <img src="/RahoMitra_logo.png" alt="" className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-white">RahoMitra</p>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-gold">
              Rent Invoice
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={status} />
          <span className="rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">
            Demo data
          </span>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {/* ---------------------------------------------------------- meta */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Row label="Bill ID" value={bill.id} />
          <Row label="Billing period" value={billingPeriod(bill.month)} />
          <Row label="Generated on" value={formatDate(bill.generatedOn)} />
          <Row label="Due date" value={formatDate(bill.dueDate)} />
          <Row label="PG property" value={customPropName || 'PG Accommodation'} />
          <Row label="Student" value={bill.studentName} />
          <Row label="Room number" value={`Room ${bill.roomNumber}`} />
          <Row label="Bed number" value={`Bed ${bill.bedLabel}`} />
        </div>

        {/* -------------------------------------------------------- charges */}
        <div className="rounded-2xl border border-line px-4 py-3 sm:px-5">
          <p className="mb-1 border-b border-line pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
            Charge breakdown
          </p>
          <ChargeRow label="Monthly rent" amount={bill.rent} />
          <ChargeRow label="Electricity charges" amount={bill.electricity} />
          <ChargeRow label="Water charges" amount={bill.water} />
          <ChargeRow label="Maintenance charges" amount={bill.maintenance} />
          <ChargeRow label="Food charges" amount={bill.food} />
          <ChargeRow label="Other charges" amount={bill.extra} />
          <div className="flex items-center justify-between border-t border-line py-2 text-sm">
            <span className="text-ink-soft">Subtotal</span>
            <span className="font-semibold text-ink">{formatINR(billSubtotal(bill))}</span>
          </div>
          <ChargeRow label="Discount" amount={discount} muted />
          <div className="flex items-center justify-between rounded-xl bg-forest px-3.5 py-2.5 text-sm">
            <span className="font-bold text-ivory">Total amount</span>
            <span className="font-bold text-white">{formatINR(total)}</span>
          </div>
          {bill.notes && (
            <p className="mt-3 rounded-xl border border-dashed border-line bg-ivory/40 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-mute">
              <span className="font-bold text-ink-soft">Notes:</span> {bill.notes}
            </p>
          )}
        </div>

        {/* -------------------------------------------------- payment state */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-forest/25 bg-forest-soft px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-forest">Amount paid</p>
            <p className="mt-1 text-lg font-bold text-forest">{formatINR(bill.paidAmount)}</p>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 text-center ${
              remaining > 0
                ? 'border-gold/40 bg-gold-soft text-gold-dark'
                : 'border-forest/25 bg-forest-soft text-forest'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]">Remaining balance</p>
            <p className="mt-1 text-lg font-bold">{formatINR(remaining)}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-line bg-ivory/40 px-4 py-3 text-center sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Payment status
            </p>
            <p className="mt-1.5 text-[13px] font-bold text-ink">
              {BILL_STATUS_LABELS[status]}
            </p>
          </div>
        </div>

        {/* ------------------------------------- owner: recorded payments */}
        {mode === 'owner' && (
          <div className="rounded-2xl border border-line px-4 py-3 sm:px-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
              Payments received ({payments.length})
            </p>
            {payments.length === 0 ? (
              <p className="py-2 text-[12.5px] text-ink-mute">
                No payment has been recorded for this bill yet — students pay the owner directly
                (offline), and the owner records it manually.
              </p>
            ) : (
              <ul className="divide-y divide-line/70">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[12.5px]">
                    <span className="font-semibold text-ink">{formatINR(p.amount)}</span>
                    <span className="text-ink-mute">{p.method.replace('_', ' ')}</span>
                    <span className="text-ink-mute">{formatDate(p.date)}</span>
                    <span className="text-ink-mute">
                      {p.reference ? `Ref ${p.reference}` : 'No reference'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ------------------------- student: payment instructions */}
        {mode === 'student' && (
          <div className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-4 sm:px-5">
            <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-gold-dark">
              <Wallet className="h-4 w-4" aria-hidden />
              Payment instructions
            </p>
            <p className="text-[13px] font-semibold leading-relaxed text-ink">
              “Please pay your rent directly to your PG owner using the payment method shared by
              them. Your payment status will be updated after the owner confirms receipt.”
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                    UPI ID (demo)
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-bold text-forest">
                    {paymentDetails.upiId || 'Not shared yet'}
                  </p>
                  <p className="text-[11.5px] text-ink-mute">
                    {paymentDetails.accountHolder || 'Account holder not set'}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                    Owner instructions
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
                    {paymentDetails.instructions || 'Follow the payment method shared by your PG owner.'}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-center rounded-xl border border-line bg-white px-4 py-3 sm:w-40">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                  <QrCode className="h-3.5 w-3.5" aria-hidden />
                  UPI QR
                </p>
                {paymentDetails.qrImage ? (
                  <img
                    src={paymentDetails.qrImage}
                    alt="Owner UPI QR (demo)"
                    className="h-28 w-28 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-lg border border-dashed border-line text-center text-[10.5px] leading-snug text-ink-mute">
                    <Landmark className="mb-1 h-5 w-5" aria-hidden />
                    No QR uploaded yet
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-gold-dark">
              <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              RahoMitra does not process rent online — pay the owner directly (UPI / cash / bank
              transfer). This invoice and its payment details are demo data.
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- footer */}
      <div className="border-t border-line bg-ivory/60 px-5 py-3 text-center text-[11px] text-ink-mute sm:px-6">
        Demo invoice generated on {formatDate(bill.generatedOn)} · {monthLabel(bill.month)} · no real
        payment is processed by RahoMitra.
      </div>
    </div>
  )
}
