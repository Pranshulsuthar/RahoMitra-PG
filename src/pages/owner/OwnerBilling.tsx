import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  BadgeIndianRupee,
  Clock,
  Eye,
  PencilLine,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { useBillingStore } from '../../context/BillingStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { Button } from '../../components/common/Button'
import { BarChart, DonutChart } from '../../components/admin/Charts'
import { GenerateBillModal } from '../../components/billing/GenerateBillModal'
import type { BillSubmitMeta } from '../../components/billing/GenerateBillModal'
import { RecordPaymentModal } from '../../components/billing/RecordPaymentModal'
import { InvoiceView } from '../../components/billing/InvoiceView'
import type {
  BillInput,
  BillStatus,
  PaymentInput,
  PaymentMethod,
  PaymentRecord,
  RentBill,
} from '../../types/billing'
import {
  BILL_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  billRemaining,
  billTotal,
  formatDate,
  monthLabel,
} from '../../types/billing'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

const TABS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All Bills' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'DRAFT', label: 'Draft' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Any status' },
  ...TABS.filter((t) => t.value !== 'ALL').map((t) => ({ value: t.value, label: t.label })),
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
]

const DONUT_COLORS: Record<BillStatus, string> = {
  PAID: '#173D32',
  UNPAID: '#B3402F',
  PARTIALLY_PAID: '#C49A52',
  OVERDUE: '#7F2A1D',
  DRAFT: '#DDD5C0',
}

/** /owner/billing — bills, invoices, manual payment records + revenue charts. */
export function OwnerBilling() {
  useDocumentTitle('Billing & Payments')

  const { properties, students, rooms, pushToast } = useOwnerStore()
  const {
    bills,
    payments,
    paymentDetails,
    statusOf,
    paymentsForBill,
    saveBill,
    cancelBill,
    recordPayment,
  } = useBillingStore()

  /* ------------------------------------------------------------ view state */
  const [view, setView] = useState<'bills' | 'payments'>('bills')
  const [status, setStatus] = useState('ALL')
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [monthFilter, setMonthFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [query, setQuery] = useState('')

  const [payQuery, setPayQuery] = useState('')
  const [payMethod, setPayMethod] = useState('ALL')
  const [payMonth, setPayMonth] = useState('ALL')

  const [generateOpen, setGenerateOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<RentBill | null>(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordDefaultId, setRecordDefaultId] = useState<string | null>(null)
  const [invoiceBill, setInvoiceBill] = useState<RentBill | null>(null)
  const [cancelTarget, setCancelTarget] = useState<RentBill | null>(null)
  const [paymentDetail, setPaymentDetail] = useState<PaymentRecord | null>(null)

  /* ------------------------------------------------------------- options */
  const propertyOptions = [
    { value: 'ALL', label: 'All properties' },
    ...properties.map((p) => ({ value: p.id, label: p.name })),
  ]

  const monthsInData = useMemo(
    () => [...new Set(bills.map((b) => b.month))].sort(),
    [bills],
  )
  const yearsInData = useMemo(
    () => [...new Set(bills.map((b) => b.month.slice(0, 4)))].sort().reverse(),
    [bills],
  )

  const monthOptions = [
    { value: 'ALL', label: 'All months' },
    ...monthsInData.map((m) => ({ value: m, label: monthLabel(m) })),
  ]
  const yearOptions = [
    { value: 'ALL', label: 'All years' },
    ...yearsInData.map((y) => ({ value: y, label: y })),
  ]

  /* --------------------------------------------------------- filtered data */
  const filteredBills = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bills.filter((b) => {
      if (propertyFilter !== 'ALL' && b.propertyId !== propertyFilter) return false
      if (monthFilter !== 'ALL' && b.month !== monthFilter) return false
      if (yearFilter !== 'ALL' && !b.month.startsWith(yearFilter)) return false
      if (status !== 'ALL' && statusOf(b) !== status) return false
      if (q && !`${b.studentName} ${b.id}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [bills, propertyFilter, monthFilter, yearFilter, status, query, statusOf])

  const openBills = useMemo(
    () =>
      bills
        .filter((b) => {
          const st = statusOf(b)
          return !b.draft && (st === 'UNPAID' || st === 'PARTIALLY_PAID' || st === 'OVERDUE')
        })
        .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1)),
    [bills, statusOf],
  )

  /* --------------------------------------------------------------- totals */
  const stats = useMemo(() => {
    let billed = 0
    let received = 0
    let pending = 0
    let overdue = 0
    for (const b of filteredBills) {
      const total = billTotal(b)
      const st = statusOf(b)
      billed += total
      received += b.paidAmount
      if (st === 'UNPAID' || st === 'PARTIALLY_PAID') pending += billRemaining(b)
      if (st === 'OVERDUE') overdue += billRemaining(b)
    }
    return { count: filteredBills.length, billed, received, pending, overdue }
  }, [filteredBills, statusOf])

  /* --------------------------------------------------------------- charts */
  const chartBills = useMemo(
    () =>
      bills.filter(
        (b) =>
          (propertyFilter === 'ALL' || b.propertyId === propertyFilter) &&
          (yearFilter === 'ALL' || b.month.startsWith(yearFilter)),
      ),
    [bills, propertyFilter, yearFilter],
  )

  const chartMonths = useMemo(() => [...new Set(chartBills.map((b) => b.month))].sort(), [chartBills])

  const billedData = chartMonths.map((m) => ({
    label: monthLabel(m).slice(0, 3),
    value: chartBills.filter((b) => b.month === m).reduce((s, b) => s + billTotal(b), 0),
  }))
  const receivedData = chartMonths.map((m) => ({
    label: monthLabel(m).slice(0, 3),
    value: chartBills.filter((b) => b.month === m).reduce((s, b) => s + b.paidAmount, 0),
  }))

  const donutData = (Object.keys(BILL_STATUS_LABELS) as BillStatus[])
    .map((st) => ({
      label: BILL_STATUS_LABELS[st],
      value: filteredBills.filter((b) => statusOf(b) === st).length,
      color: DONUT_COLORS[st],
    }))
    .filter((d) => d.value > 0)

  /* ------------------------------------------------------ payment history */
  const filteredPayments = useMemo(() => {
    const q = payQuery.trim().toLowerCase()
    return payments.filter((p) => {
      if (propertyFilter !== 'ALL' && p.propertyId !== propertyFilter) return false
      if (payMethod !== 'ALL' && p.method !== payMethod) return false
      if (payMonth !== 'ALL' && !p.date.startsWith(payMonth)) return false
      if (q) {
        const prop = properties.find((x) => x.id === p.propertyId)?.name ?? ''
        const haystack = `${p.studentName} ${p.reference} ${p.billId} ${prop}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [payments, propertyFilter, payMethod, payMonth, payQuery, properties])

  const payMonthOptions = useMemo(() => {
    const months = [...new Set(payments.map((p) => p.date.slice(0, 7)))].sort().reverse()
    return [
      { value: 'ALL', label: 'All dates' },
      ...months.map((m) => ({ value: m, label: monthLabel(m) })),
    ]
  }, [payments])

  const payMethodOptions = [
    { value: 'ALL', label: 'Any method' },
    ...(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => ({
      value: m,
      label: PAYMENT_METHOD_LABELS[m],
    })),
  ]

  /* ------------------------------------------------------------ handlers */
  const handleGenerate = (
    id: string | null,
    input: BillInput,
    draft: boolean,
    meta: BillSubmitMeta,
  ) => {
    const result = saveBill(id, input, draft, meta)
    if (result.ok) {
      pushToast(
        draft
          ? `Draft bill saved for ${meta.studentName} (demo).`
          : `Bill ${result.billId} generated for ${meta.studentName} (demo).`,
      )
      setGenerateOpen(false)
      setEditingBill(null)
    }
    return result
  }

  const handleRecord = (input: PaymentInput) => {
    const result = recordPayment(input)
    if (result.ok) {
      pushToast(
        `Payment of ${formatINR(input.amount)} recorded — bill marked ${
          result.statusLabel ? BILL_STATUS_LABELS[result.statusLabel] : 'updated'
        } (manual confirmation, demo).`,
      )
    }
    return result
  }

  const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? 'Demo PG'

  /* ------------------------------------------------------------ columns */
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
      key: 'student',
      header: 'Student Name',
      sortValue: (b) => b.studentName,
      render: (b) => <span className="font-semibold text-ink">{b.studentName}</span>,
    },
    {
      key: 'property',
      header: 'PG Name',
      sortValue: (b) => propName(b.propertyId),
      render: (b) => <span className="whitespace-nowrap">{propName(b.propertyId)}</span>,
    },
    {
      key: 'room',
      header: 'Room / Bed',
      render: (b) => <span className="whitespace-nowrap">{`Room ${b.roomNumber} · Bed ${b.bedLabel}`}</span>,
    },
    {
      key: 'month',
      header: 'Billing Month',
      sortValue: (b) => b.month,
      render: (b) => <span className="whitespace-nowrap font-semibold text-ink-soft">{monthLabel(b.month)}</span>,
    },
    {
      key: 'total',
      header: 'Total Amount',
      sortValue: (b) => billTotal(b),
      className: 'text-right',
      render: (b) => <span className="whitespace-nowrap font-bold text-ink">{formatINR(billTotal(b))}</span>,
    },
    {
      key: 'due',
      header: 'Due Date',
      sortValue: (b) => b.dueDate,
      render: (b) => <span className="whitespace-nowrap">{formatDate(b.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Payment Status',
      sortValue: (b) => statusOf(b),
      render: (b) => <StatusBadge status={statusOf(b)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (b) => {
        const st = statusOf(b)
        const canPay = st === 'UNPAID' || st === 'PARTIALLY_PAID' || st === 'OVERDUE'
        return (
          <div className="flex justify-end gap-1.5">
            <ActionBtn label={`View ${b.id}`} onClick={() => setInvoiceBill(b)}>
              <Eye className="h-3.5 w-3.5" aria-hidden />
            </ActionBtn>
            {b.draft && (
              <ActionBtn
                label={`Edit draft ${b.id}`}
                onClick={() => {
                  setEditingBill(b)
                  setGenerateOpen(true)
                }}
              >
                <PencilLine className="h-3.5 w-3.5" aria-hidden />
              </ActionBtn>
            )}
            {canPay && (
              <ActionBtn
                label={`Record payment for ${b.id}`}
                onClick={() => {
                  setRecordDefaultId(b.id)
                  setRecordOpen(true)
                }}
              >
                <Wallet className="h-3.5 w-3.5" aria-hidden />
              </ActionBtn>
            )}
            {b.paidAmount === 0 && (
              <ActionBtn label={`Cancel ${b.id}`} danger onClick={() => setCancelTarget(b)}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </ActionBtn>
            )}
          </div>
        )
      },
    },
  ]

  const paymentColumns: Array<Column<PaymentRecord>> = [
    {
      key: 'date',
      header: 'Payment Date',
      sortValue: (p) => p.date,
      render: (p) => <span className="whitespace-nowrap font-semibold text-ink">{formatDate(p.date)}</span>,
    },
    {
      key: 'student',
      header: 'Student',
      sortValue: (p) => p.studentName,
      render: (p) => <span className="font-semibold text-ink">{p.studentName}</span>,
    },
    {
      key: 'property',
      header: 'PG Name',
      sortValue: (p) => propName(p.propertyId),
      render: (p) => <span className="whitespace-nowrap">{propName(p.propertyId)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount Received',
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
      header: 'Transaction Reference',
      sortValue: (p) => p.reference,
      render: (p) => (
        <span className="whitespace-nowrap text-[12.5px] text-ink-mute">{p.reference || '—'}</span>
      ),
    },
    {
      key: 'bill',
      header: 'Bill ID',
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
      render: (p) => (
        <ActionBtn label={`View payment ${p.id}`} onClick={() => setPaymentDetail(p)}>
          <Eye className="h-3.5 w-3.5" aria-hidden />
        </ActionBtn>
      ),
    },
  ]

  /* --------------------------------------------------------------- render */
  return (
    <>
      <AdminPageHeader
        title="Billing & Payments"
        description="Generate monthly bills, track dues and manually record offline payments — students pay you directly."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setRecordDefaultId(null)
                setRecordOpen(true)
              }}
            >
              <Wallet className="h-4 w-4" aria-hidden />
              Record Payment
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditingBill(null)
                setGenerateOpen(true)
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Generate Bill
            </Button>
          </>
        }
      />

      <DemoBanner message="every bill, payment and rupee figure below is illustrative demo data — RahoMitra never collects rent online; owners record offline receipts manually." />

      {/* ---------------------------------------------------- overview cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatisticCard
          label="Total Bills Generated"
          value={stats.count}
          icon={ReceiptText}
          tone="ink"
          hint="Matching current filters"
        />
        <StatisticCard
          label="Total Amount Billed"
          value={formatINR(stats.billed)}
          icon={BadgeIndianRupee}
          tone="gold"
          hint="Subtotal after discount"
        />
        <StatisticCard
          label="Amount Received"
          value={formatINR(stats.received)}
          icon={Wallet}
          tone="forest"
          hint="Manually recorded (demo)"
        />
        <StatisticCard
          label="Pending Amount"
          value={formatINR(stats.pending)}
          icon={Clock}
          tone="gold"
          hint="Unpaid + partially paid"
        />
        <StatisticCard
          label="Overdue Amount"
          value={formatINR(stats.overdue)}
          icon={AlertTriangle}
          tone="danger"
          hint="Past due date, not received"
        />
      </div>

      {/* ------------------------------------------------------ view toggle */}
      <div className="mb-5 inline-flex rounded-full border border-line bg-white p-1 shadow-card">
        {(
          [
            ['bills', 'Bills'],
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
          {/* ------------------------------------------------ monthly charts */}
          <div className="mb-6 grid gap-6 xl:grid-cols-3">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base">Monthly revenue — billed</h2>
                <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-gold-dark">
                  Demo
                </span>
              </div>
              <p className="mb-3 text-[11.5px] text-ink-mute">
                Property &amp; year filters apply · month filter applies to the table only.
              </p>
              {chartMonths.length === 0 ? (
                <EmptyState title="No data" description="No bills match the current property and year filters." />
              ) : (
                <BarChart data={billedData} valuePrefix="₹" ariaLabel="Monthly billed amount" color="#C49A52" />
              )}
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base">Monthly revenue — received</h2>
                <span className="rounded-full bg-forest-soft px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-forest">
                  Demo
                </span>
              </div>
              <p className="mb-3 text-[11.5px] text-ink-mute">
                Amounts the owner has manually recorded as received.
              </p>
              {chartMonths.length === 0 ? (
                <EmptyState title="No data" description="No bills match the current property and year filters." />
              ) : (
                <BarChart data={receivedData} valuePrefix="₹" ariaLabel="Monthly received amount" />
              )}
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base">Payment status split</h2>
                <span className="rounded-full bg-ivory px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-ink-mute">
                  {filteredBills.length} bills
                </span>
              </div>
              <p className="mb-3 text-[11.5px] text-ink-mute">
                Distribution across all filters below.
              </p>
              {donutData.length === 0 ? (
                <EmptyState title="No bills" description="Adjust the filters to see a status split." />
              ) : (
                <DonutChart
                  data={donutData}
                  centerLabel="BILLS"
                  ariaLabel="Payment status distribution"
                />
              )}
            </section>
          </div>

          {/* ------------------------------------------------------- filters */}
          <div className="mb-5 rounded-3xl border border-line bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect
                label="Property"
                value={propertyFilter}
                onChange={setPropertyFilter}
                options={propertyOptions}
              />
              <FilterSelect
                label="Month"
                value={monthFilter}
                onChange={setMonthFilter}
                options={monthOptions}
              />
              <FilterSelect
                label="Year"
                value={yearFilter}
                onChange={setYearFilter}
                options={yearOptions}
              />
              <FilterSelect
                label="Payment Status"
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search student or bill ID…"
                className="sm:w-64"
              />
            </div>
          </div>

          <DataTable
            columns={billColumns}
            rows={filteredBills}
            rowKey={(b) => b.id}
            pageSize={8}
            emptyTitle="No bills found"
            emptyDescription="No demo bills match the current filters — try clearing a filter or generate a new bill."
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
        </>
      ) : (
        <>
          {/* ------------------------------------------------ payment history */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchInput
              value={payQuery}
              onChange={setPayQuery}
              placeholder="Search student, property or reference…"
              className="sm:w-72"
            />
            <FilterSelect
              label="Method"
              value={payMethod}
              onChange={setPayMethod}
              options={payMethodOptions}
            />
            <FilterSelect
              label="Date"
              value={payMonth}
              onChange={setPayMonth}
              options={payMonthOptions}
            />
            <span className="ml-auto text-[12px] font-semibold text-ink-mute">
              {filteredPayments.length} of {payments.length} payments
            </span>
          </div>

          <DataTable
            columns={paymentColumns}
            rows={filteredPayments}
            rowKey={(p) => p.id}
            pageSize={8}
            emptyTitle="No payments found"
            emptyDescription="No recorded demo payments match this search — payments appear here after you use Record Payment."
          />
        </>
      )}

      {/* ------------------------------------------------------ invoice view */}
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
            {invoiceBill?.draft && (
              <Button
                variant="gold"
                onClick={() => {
                  setEditingBill(invoiceBill)
                  setInvoiceBill(null)
                  setGenerateOpen(true)
                }}
              >
                <PencilLine className="h-4 w-4" aria-hidden />
                Edit draft
              </Button>
            )}
            {invoiceBill &&
              (statusOf(invoiceBill) === 'UNPAID' ||
                statusOf(invoiceBill) === 'PARTIALLY_PAID' ||
                statusOf(invoiceBill) === 'OVERDUE') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRecordDefaultId(invoiceBill.id)
                    setInvoiceBill(null)
                    setRecordOpen(true)
                  }}
                >
                  <Wallet className="h-4 w-4" aria-hidden />
                  Record payment
                </Button>
              )}
            <Button variant="primary" onClick={() => window.print()}>
              <ReceiptText className="h-4 w-4" aria-hidden />
              Print / Download
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
            mode="owner"
          />
        )}
      </Modal>

      {/* ------------------------------------------------- payment details */}
      <Modal
        open={paymentDetail !== null}
        title="Payment Details"
        subtitle="Manual offline receipt recorded by the owner (demo)."
        onClose={() => setPaymentDetail(null)}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setPaymentDetail(null)}>
              Close
            </Button>
            {paymentDetail &&
              (() => {
                const target = bills.find((b) => b.id === paymentDetail.billId)
                return (
                  <Button
                    variant="primary"
                    disabled={!target}
                    onClick={() => {
                      if (target) setInvoiceBill(target)
                      setPaymentDetail(null)
                    }}
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View bill
                  </Button>
                )
              })()}
          </>
        }
      >
        {paymentDetail && (
          <dl className="space-y-2.5 text-[13px]">
            {[
              ['Payment ID', paymentDetail.id],
              ['Bill ID', paymentDetail.billId],
              ['Student', paymentDetail.studentName],
              ['PG property', propName(paymentDetail.propertyId)],
              ['Amount received', formatINR(paymentDetail.amount)],
              ['Payment method', PAYMENT_METHOD_LABELS[paymentDetail.method]],
              ['Transaction reference', paymentDetail.reference || '— (not provided)'],
              ['Payment date', formatDate(paymentDetail.date)],
              ['Recorded on', formatDate(paymentDetail.recordedOn)],
              ['Notes', paymentDetail.notes || '—'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-ivory/40 px-4 py-3"
              >
                <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                  {label}
                </dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      {/* --------------------------------------------- generate / edit bill */}
      <GenerateBillModal
        open={generateOpen}
        editing={editingBill}
        properties={properties}
        rooms={rooms}
        students={students}
        onClose={() => {
          setGenerateOpen(false)
          setEditingBill(null)
        }}
        onSubmit={handleGenerate}
      />

      {/* -------------------------------------------------- record payment */}
      <RecordPaymentModal
        open={recordOpen}
        bills={openBills}
        defaultBillId={recordDefaultId}
        onClose={() => {
          setRecordOpen(false)
          setRecordDefaultId(null)
        }}
        onRecord={handleRecord}
      />

      {/* ------------------------------------------------------ cancel bill */}
      <ConfirmDialog
        open={cancelTarget !== null}
        title={`Cancel bill ${cancelTarget?.id ?? ''}?`}
        message="This removes the bill from local demo state. Only bills with no recorded payments can be cancelled — this cannot be undone in the demo session."
        confirmLabel="Cancel bill"
        danger
        onConfirm={() => {
          if (cancelTarget) {
            cancelBill(cancelTarget.id)
            pushToast(`Bill ${cancelTarget.id} cancelled (demo).`, 'info')
          }
          setCancelTarget(null)
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  )
}

function ActionBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft transition-colors',
        danger
          ? 'hover:border-danger hover:text-danger'
          : 'hover:border-forest hover:text-forest',
      )}
    >
      {children}
    </button>
  )
}
