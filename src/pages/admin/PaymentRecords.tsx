import { useMemo, useState } from 'react'
import { Eye, Receipt, Wallet } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { PaymentRecord, PaymentStatus } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { formatINR } from '../../utils/format'

/** /admin/payments — RahoMitra SaaS subscription payments only (demo). */
export function PaymentRecords() {
  useDocumentTitle('Payment Records')

  const { payments, plans } = useAdminStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | PaymentStatus>('ALL')
  const [plan, setPlan] = useState('ALL')
  const [detail, setDetail] = useState<PaymentRecord | null>(null)

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id.toUpperCase()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter(
      (p) =>
        (!q ||
          p.id.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          p.pgName.toLowerCase().includes(q)) &&
        (status === 'ALL' || p.status === status) &&
        (plan === 'ALL' || p.planId === plan),
    )
  }, [payments, search, status, plan])

  const totalSuccess = useMemo(
    () => payments.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0),
    [payments],
  )

  const columns: Array<Column<PaymentRecord>> = [
    {
      key: 'ref',
      header: 'Transaction Reference',
      sortValue: (p) => p.id,
      render: (p) => (
        <span className="whitespace-nowrap font-mono text-[12.5px] font-bold text-ink">{p.id}</span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      sortValue: (p) => p.ownerName,
      render: (p) => (
        <div>
          <span className="block font-semibold text-ink">{p.ownerName}</span>
          <span className="block text-[11.5px] text-ink-mute">{p.pgName}</span>
        </div>
      ),
    },
    {
      key: 'pg',
      header: 'PG Workspace',
      sortValue: (p) => p.pgName,
      render: (p) => <span className="whitespace-nowrap">{p.pgName}</span>,
    },
    {
      key: 'plan',
      header: 'Plan',
      sortValue: (p) => p.planId,
      render: (p) => (
        <span className="whitespace-nowrap rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-gold-dark">
          {p.planId}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (p) => p.amount,
      render: (p) => (
        <span className="whitespace-nowrap font-semibold text-ink">{formatINR(p.amount)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Payment Date',
      sortValue: (p) => p.paidOn,
      render: (p) => <span className="whitespace-nowrap tabular-nums">{p.paidOn}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (p) => p.status,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <button
          type="button"
          onClick={() => setDetail(p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          View
        </button>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Payment Records"
        description="Transaction records for RahoMitra SaaS subscription payments only. Student rent paid directly to PG owners is never tracked here."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <Wallet className="h-4 w-4 text-forest" aria-hidden />
            Successful total: {formatINR(totalSuccess)} · demo
          </span>
        }
      />

      <DemoBanner message="transaction references and amounts are fictional — no payment gateway is connected and no real money moved." />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        pageSize={8}
        emptyTitle="No payments match"
        emptyDescription="Try a different search term, plan or payment status."
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search reference, owner or PG…"
            />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Plan"
                value={plan}
                onChange={setPlan}
                options={[
                  { value: 'ALL', label: 'All plans' },
                  ...plans.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as 'ALL' | PaymentStatus)}
                options={[
                  { value: 'ALL', label: 'All statuses' },
                  { value: 'SUCCESS', label: 'Success' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'FAILED', label: 'Failed' },
                  { value: 'REFUNDED', label: 'Refunded' },
                ]}
              />
            </div>
          </div>
        }
      />

      <Modal
        open={detail !== null}
        title="Transaction details"
        subtitle={detail ? `${detail.id} · demo reference` : undefined}
        onClose={() => setDetail(null)}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            Close
          </button>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-soft text-forest">
                <Receipt className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-sm font-bold text-ink">{detail.id}</p>
                <p className="text-xs text-ink-mute">Illustrative demo transaction</p>
              </div>
              <span className="ml-auto">
                <StatusBadge status={detail.status} />
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-ivory/40 p-4">
              <dl className="space-y-2.5 text-sm">
                {[
                  ['Owner', detail.ownerName],
                  ['PG workspace', detail.pgName],
                  ['Subscription plan', planName(detail.planId)],
                  ['Amount', formatINR(detail.amount)],
                  ['Payment date', detail.paidOn],
                  ['Method', detail.method],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-ink-mute">{label}</dt>
                    <dd className="text-right font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
              This reference exists only in the demo dataset. No Razorpay or payment gateway is
              integrated in this build.
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
