import { useMemo, useState } from 'react'
import {
  BadgeIndianRupee,
  CalendarClock,
  Eye,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useBillingStore } from '../../context/BillingStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { Modal } from '../../components/admin/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { Button } from '../../components/common/Button'
import { InvoiceView } from '../../components/billing/InvoiceView'
import type { PaymentRecord, RentBill } from '../../types/billing'
import {
  PAYMENT_METHOD_LABELS,
  billRemaining,
  billTotal,
  formatDate,
  monthLabel,
} from '../../types/billing'
import { BILLING_TODAY, DEMO_STUDENT_ID, propertyName } from '../../data/billingData'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

const TABS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
]

/** /student/billing — "My Bills": invoices, dues and personal payment history. */
export function StudentBilling() {
  useDocumentTitle('My Bills')

  const {
    studentBills,
    studentPayments,
    statusOf,
    paymentsForBill,
    paymentDetails,
  } = useBillingStore()

  const [view, setView] = useState<'bills' | 'payments'>('bills')
  const [status, setStatus] = useState('ALL')
  const [invoiceBill, setInvoiceBill] = useState<RentBill | null>(null)

  const bills = useMemo(
    () => studentBills(DEMO_STUDENT_ID),
    [studentBills],
  )
  const payments = useMemo(
    () => studentPayments(DEMO_STUDENT_ID),
    [studentPayments],
  )

  /* --------------------------------------------------------- derived stats */
  const currentMonth = BILLING_TODAY.slice(0, 7)
  const currentBill = bills.find((b) => b.month === currentMonth)

  const outstanding = bills.reduce((sum, b) => {
    const st = statusOf(b)
    return st === 'PAID' ? sum : sum + billRemaining(b)
  }, 0)

  const dueBills = bills
    .filter((b) => statusOf(b) !== 'PAID')
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
  const nextDue = dueBills[0]

  const lastPayment = payments[0]

  const filteredBills = useMemo(
    () => (status === 'ALL' ? bills : bills.filter((b) => statusOf(b) === status)),
    [bills, status, statusOf],
  )

  /* -------------------------------------------------------------- columns */
  const billColumns: Array<Column<RentBill>> = [
    {
      key: 'id',
      header: 'Bill ID',
      sortValue: (b) => b.id,
      render: (b) => (
        <button
          type="button"
          onClick={() => setInvoiceBill(b)}
          className="font-bold text-forest underline-offset-2 transition-colors hover:text-gold-dark hover:underline"
        >
          {b.id}
        </button>
      ),
    },
    {
      key: 'month',
      header: 'Billing Month',
      sortValue: (b) => b.month,
      render: (b) => (
        <span className="whitespace-nowrap font-semibold text-ink">{monthLabel(b.month)}</span>
      ),
    },
    {
      key: 'property',
      header: 'PG',
      sortValue: (b) => propertyName(b.propertyId),
      render: (b) => <span className="whitespace-nowrap">{propertyName(b.propertyId)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      sortValue: (b) => billTotal(b),
      className: 'text-right',
      render: (b) => (
        <span className="whitespace-nowrap font-bold text-ink">{formatINR(billTotal(b))}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due Date',
      sortValue: (b) => b.dueDate,
      render: (b) => <span className="whitespace-nowrap">{formatDate(b.dueDate)}</span>,
    },
    {
      key: 'paid',
      header: 'Paid',
      sortValue: (b) => b.paidAmount,
      className: 'text-right',
      render: (b) => (
        <span className="whitespace-nowrap font-semibold text-forest">
          {formatINR(b.paidAmount)}
        </span>
      ),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      sortValue: (b) => billRemaining(b),
      className: 'text-right',
      render: (b) => {
        const remaining = billRemaining(b)
        return (
          <span
            className={cn(
              'whitespace-nowrap font-semibold',
              remaining > 0 ? 'text-gold-dark' : 'text-ink-mute',
            )}
          >
            {formatINR(remaining)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (b) => statusOf(b),
      render: (b) => <StatusBadge status={statusOf(b)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (b) => (
        <button
          type="button"
          onClick={() => setInvoiceBill(b)}
          aria-label={`View invoice ${b.id}`}
          title="View invoice"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          View
        </button>
      ),
    },
  ]

  const paymentColumns: Array<Column<PaymentRecord>> = [
    {
      key: 'date',
      header: 'Payment Date',
      sortValue: (p) => p.date,
      render: (p) => (
        <span className="whitespace-nowrap font-semibold text-ink">{formatDate(p.date)}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (p) => p.amount,
      className: 'text-right',
      render: (p) => (
        <span className="whitespace-nowrap font-bold text-forest">{formatINR(p.amount)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      sortValue: (p) => p.method,
      render: (p) => (
        <span className="rounded-full border border-line bg-ivory px-3 py-1 text-[11.5px] font-bold text-ink-soft">
          {PAYMENT_METHOD_LABELS[p.method]}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      sortValue: (p) => p.reference,
      render: (p) => (
        <span className="whitespace-nowrap text-[12.5px] text-ink-mute">
          {p.reference || '—'}
        </span>
      ),
    },
    {
      key: 'bill',
      header: 'Bill',
      sortValue: (p) => p.billId,
      render: (p) => {
        const target = bills.find((b) => b.id === p.billId)
        return (
          <button
            type="button"
            disabled={!target}
            onClick={() => target && setInvoiceBill(target)}
            className="font-bold text-forest underline-offset-2 transition-colors hover:text-gold-dark hover:underline disabled:text-ink-mute disabled:no-underline"
          >
            {p.billId}
          </button>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => {
        const target = bills.find((b) => b.id === p.billId)
        return (
          <button
            type="button"
            disabled={!target}
            onClick={() => target && setInvoiceBill(target)}
            aria-label={`View bill for payment on ${formatDate(p.date)}`}
            title="View bill"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
        )
      },
    },
  ]

  /* -------------------------------------------------------------- render */
  return (
    <>
      <AdminPageHeader
        title="My Bills"
        description="Your monthly rent invoices, dues and payment history."
      />

      <DemoBanner message="every bill, amount and payment below is illustrative demo data. RahoMitra does not collect rent — pay your PG owner directly." />

      {/* ------------------------------------------------------ overview cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatisticCard
          label="Current Month's Rent"
          value={currentBill ? formatINR(billTotal(currentBill)) : '—'}
          icon={ReceiptText}
          tone="gold"
          hint={
            currentBill
              ? `${monthLabel(currentMonth)} · due ${formatDate(currentBill.dueDate)}`
              : 'No bill generated yet'
          }
        />
        <StatisticCard
          label="Total Outstanding"
          value={formatINR(outstanding)}
          icon={Wallet}
          tone={outstanding > 0 ? 'danger' : 'forest'}
          hint={outstanding > 0 ? 'Across all unpaid bills' : 'Nothing due right now'}
        />
        <StatisticCard
          label="Next Due Date"
          value={nextDue ? formatDate(nextDue.dueDate) : '—'}
          icon={CalendarClock}
          tone="ink"
          hint={
            nextDue
              ? `${monthLabel(nextDue.month)} · ${formatINR(billRemaining(nextDue))} due`
              : 'All bills settled'
          }
        />
        <StatisticCard
          label="Last Payment"
          value={lastPayment ? formatINR(lastPayment.amount) : '—'}
          icon={BadgeIndianRupee}
          tone="forest"
          hint={
            lastPayment
              ? `${formatDate(lastPayment.date)} · ${PAYMENT_METHOD_LABELS[lastPayment.method]}`
              : 'No payment recorded yet'
          }
        />
      </div>

      {/* --------------------------------------------------------- view toggle */}
      <div className="mb-5 inline-flex rounded-full border border-line bg-white p-1 shadow-card">
        {(
          [
            ['bills', 'My Bills'],
            ['payments', 'Payment History'],
          ] as Array<['bills' | 'payments', string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              'rounded-full px-5 py-2 text-[13px] font-bold transition-all',
              view === key ? 'bg-forest text-ivory shadow-sm' : 'text-ink-soft hover:text-forest',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'bills' ? (
        <>
          <DataTable
            columns={billColumns}
            rows={filteredBills}
            rowKey={(b) => b.id}
            pageSize={8}
            emptyTitle="No bills found"
            emptyDescription="No demo bills match this filter."
            toolbar={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatus(tab.value)}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-[12px] font-bold transition-all',
                        status === tab.value
                          ? 'border-forest bg-forest text-ivory'
                          : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest',
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-ink-mute">
                  {filteredBills.length} of {bills.length} bills · demo data
                </span>
              </div>
            }
          />

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3.5 text-[12.5px] leading-relaxed text-gold-dark">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              <strong>How to pay:</strong> please pay your rent directly to your PG owner using the
              payment method shared by them. RahoMitra does not process rent online — your payment
              status is updated after the owner confirms receipt.
            </p>
          </div>
        </>
      ) : (
        <DataTable
          columns={paymentColumns}
          rows={payments}
          rowKey={(p) => p.id}
          pageSize={8}
          emptyTitle="No payments yet"
          emptyDescription="Your payment history appears here once the owner records a receipt against your bills."
        />
      )}

      {/* ------------------------------------------------------- invoice modal */}
      <Modal
        open={invoiceBill !== null}
        title={invoiceBill ? `Invoice · ${invoiceBill.id}` : 'Invoice'}
        subtitle="RahoMitra rent invoice — demo data, print via your browser."
        onClose={() => setInvoiceBill(null)}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setInvoiceBill(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <ReceiptText className="h-4 w-4" aria-hidden />
              Print
            </Button>
          </>
        }
      >
        {invoiceBill && (
          <InvoiceView
            bill={invoiceBill}
            status={statusOf(invoiceBill)}
            payments={paymentsForBill(invoiceBill.id)}
            paymentDetails={paymentDetails}
            mode="student"
          />
        )}
      </Modal>

      {bills.length === 0 && (
        <EmptyState
          title="No bills yet"
          description="Once your PG owner generates a monthly bill, it will show up here."
        />
      )}
    </>
  )
}
