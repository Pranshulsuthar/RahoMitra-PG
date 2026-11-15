import { useMemo, useState } from 'react'
import { CalendarClock, Eye, History, PauseCircle, PlayCircle, Repeat, XCircle } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { SubscriptionRecord, SubscriptionStatus } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { formatINR } from '../../utils/format'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All subscriptions' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRING_SOON', label: 'Expiring soon' },
]

/** /admin/subscriptions — owner subscription lifecycle management (demo). */
export function Subscriptions() {
  useDocumentTitle('Subscriptions')

  const {
    subscriptions,
    plans,
    changeSubscriptionPlan,
    extendSubscription,
    setSubscriptionStatus,
    setSubscriptionSuspended,
    pushToast,
  } = useAdminStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | SubscriptionStatus>('ALL')
  const [plan, setPlan] = useState('ALL')
  const [detail, setDetail] = useState<SubscriptionRecord | null>(null)
  const [planModal, setPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [cancelTarget, setCancelTarget] = useState<SubscriptionRecord | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<SubscriptionRecord | null>(null)
  const [historyFor, setHistoryFor] = useState<SubscriptionRecord | null>(null)

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id.toUpperCase()

  /* Live copy so modal edits appear instantly after store updates. */
  const liveDetail = detail ? subscriptions.find((s) => s.id === detail.id) ?? detail : null
  const liveHistory = historyFor
    ? subscriptions.find((s) => s.id === historyFor.id) ?? historyFor
    : null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subscriptions.filter(
      (s) =>
        (!q ||
          s.pgName.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)) &&
        (status === 'ALL' || s.status === status) &&
        (plan === 'ALL' || s.planId === plan),
    )
  }, [subscriptions, search, status, plan])

  const savePlanChange = () => {
    if (!liveDetail || !selectedPlan) return
    changeSubscriptionPlan(liveDetail.id, selectedPlan)
    pushToast(`Subscription for “${liveDetail.pgName}” moved to ${planName(selectedPlan)} (demo).`)
    setPlanModal(false)
  }

  const extend = (days: number) => {
    if (!liveDetail) return
    extendSubscription(liveDetail.id, days)
    pushToast(`“${liveDetail.pgName}” subscription extended by ${days} days (demo).`)
  }

  const confirmCancel = () => {
    if (!cancelTarget) return
    setSubscriptionStatus(cancelTarget.id, 'CANCELLED')
    pushToast(`Subscription for “${cancelTarget.pgName}” cancelled (demo).`, 'error')
    setCancelTarget(null)
    setDetail(null)
  }

  const confirmSuspend = () => {
    if (!suspendTarget) return
    const next = !suspendTarget.suspended
    setSubscriptionSuspended(suspendTarget.id, next)
    pushToast(
      `Subscription for “${suspendTarget.pgName}” ${next ? 'suspended' : 'reactivated'} (demo).`,
      next ? 'error' : 'success',
    )
    setSuspendTarget(null)
  }

  const columns: Array<Column<SubscriptionRecord>> = [
    {
      key: 'id',
      header: 'Subscription ID',
      sortValue: (s) => s.id,
      render: (s) => <span className="whitespace-nowrap font-mono text-xs text-ink-soft">{s.id}</span>,
    },
    {
      key: 'pg',
      header: 'PG Business',
      sortValue: (s) => s.pgName,
      render: (s) => (
        <div>
          <span className="block font-semibold text-ink">{s.pgName}</span>
          <span className="block text-[11.5px] text-ink-mute">{s.ownerName}</span>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner Name',
      sortValue: (s) => s.ownerName,
      render: (s) => <span className="whitespace-nowrap">{s.ownerName}</span>,
    },
    {
      key: 'plan',
      header: 'Selected Plan',
      sortValue: (s) => s.planId,
      render: (s) => (
        <span className="whitespace-nowrap rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-gold-dark">
          {planName(s.planId)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (s) => s.amount,
      render: (s) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-forest">
          {s.amount === 0 ? 'Trial' : formatINR(s.amount)}
        </span>
      ),
    },
    {
      key: 'start',
      header: 'Start Date',
      sortValue: (s) => s.startOn,
      render: (s) => <span className="whitespace-nowrap tabular-nums">{s.startOn}</span>,
    },
    {
      key: 'expiry',
      header: 'Expiry Date',
      sortValue: (s) => s.expiryOn,
      render: (s) => <span className="whitespace-nowrap tabular-nums">{s.expiryOn}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (s) => s.status,
      render: (s) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <StatusBadge status={s.status} />
          {s.suspended && (
            <span className="rounded-full border border-danger/40 bg-danger-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-danger">
              Suspended
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDetail(s)
              setSelectedPlan(s.planId)
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
          <button
            type="button"
            onClick={() => setHistoryFor(s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest"
          >
            <History className="h-3.5 w-3.5" aria-hidden />
            History
          </button>
          {s.status !== 'CANCELLED' && s.status !== 'EXPIRED' && (
            <button
              type="button"
              onClick={() => setCancelTarget(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Subscriptions"
        description="Track RahoMitra owner subscription records — plan, amount, term dates, status, suspension and history. (These are SaaS plans, not student rent payments.)"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <Repeat className="h-4 w-4 text-forest" aria-hidden />
            {filtered.length} of {subscriptions.length} subscriptions
          </span>
        }
      />

      <DemoBanner message="all subscription records, amounts and term dates are illustrative samples — changes here reflect on the owner subscription dashboard in this session." />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        pageSize={8}
        emptyTitle="No subscriptions match"
        emptyDescription="Try clearing the search or selecting a different plan or status."
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by PG, owner or ID…" />
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
                onChange={(value) => setStatus(value as 'ALL' | SubscriptionStatus)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        }
      />

      {/* -------------------------------------------------- detail modal */}
      <Modal
        open={liveDetail !== null}
        title="Subscription details"
        subtitle={liveDetail ? `${liveDetail.id} · demo record` : undefined}
        onClose={() => setDetail(null)}
        size="md"
        footer={
          liveDetail && (
            <>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setSuspendTarget(liveDetail)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-danger/40 bg-white px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
              >
                {liveDetail.suspended ? (
                  <>
                    <PlayCircle className="h-4 w-4" aria-hidden />
                    Reactivate
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4" aria-hidden />
                    Suspend
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPlanModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
              >
                <Repeat className="h-4 w-4" aria-hidden />
                Change plan
              </button>
              <button
                type="button"
                onClick={() => extend(30)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
              >
                <CalendarClock className="h-4 w-4" aria-hidden />
                Extend 30 days
              </button>
            </>
          )
        }
      >
        {liveDetail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={liveDetail.status} />
              {liveDetail.suspended && (
                <span className="rounded-full border border-danger/40 bg-danger-soft px-3 py-1 text-[11px] font-bold uppercase text-danger">
                  Suspended
                </span>
              )}
              <span className="rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase text-gold-dark">
                {planName(liveDetail.planId)}
              </span>
              <span className="text-xs text-ink-mute">{liveDetail.cycle} billing</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">Property</h3>
                <p className="text-sm font-semibold text-ink">{liveDetail.pgName}</p>
                <p className="mt-1 text-sm text-ink-soft">Owner: {liveDetail.ownerName}</p>
              </div>
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">Amount</h3>
                <p className="text-lg font-bold text-forest">
                  {liveDetail.amount === 0 ? 'Trial' : formatINR(liveDetail.amount)}
                </p>
                <p className="mt-1 text-[12px] text-ink-mute">
                  {liveDetail.cycle === 'YEARLY' ? 'per year' : 'per month'} · demo record
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">Term</h3>
                <p className="text-sm text-ink-soft">
                  {liveDetail.startOn} →{' '}
                  <span className="font-semibold text-ink">{liveDetail.expiryOn}</span>
                </p>
                <p className="mt-1 text-[12px] text-ink-mute">Extend adds time to expiry (demo).</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(['30', '90', '180'] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => extend(Number(days))}
                  className="rounded-full border border-forest/25 bg-white px-4 py-2 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                >
                  +{days} days
                </button>
              ))}
              <button
                type="button"
                onClick={() => setHistoryFor(liveDetail)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest"
              >
                <History className="h-3.5 w-3.5" aria-hidden />
                View history
              </button>
              {liveDetail.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => setCancelTarget(liveDetail)}
                  className="rounded-full border border-danger/40 bg-white px-4 py-2 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  Cancel subscription
                </button>
              )}
            </div>

            <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
              Demo record — no payment is processed and no renewal is charged when extending or
              changing plans here.
            </p>
          </div>
        )}
      </Modal>

      {/* -------------------------------------------------- change plan modal */}
      <Modal
        open={planModal}
        title="Change subscription plan"
        subtitle={liveDetail ? `${liveDetail.pgName} · currently ${planName(liveDetail.planId)}` : undefined}
        onClose={() => setPlanModal(false)}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPlanModal(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePlanChange}
              disabled={!selectedPlan}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save plan
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {plans.map((p) => (
            <label
              key={p.id}
              className={
                selectedPlan === p.id
                  ? 'flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-forest bg-forest-soft/60 p-4'
                  : 'flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-forest/40'
              }
            >
              <input
                type="radio"
                name="sub-plan"
                value={p.id}
                checked={selectedPlan === p.id}
                onChange={() => setSelectedPlan(p.id)}
                className="mt-1 h-4 w-4 accent-[#173D32]"
              />
              <span className="flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{p.name}</span>
                  <StatusBadge status={p.status} />
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{p.tagline}</span>
                <span className="mt-1 block text-[12px] font-semibold text-forest">
                  {formatINR(p.priceMonthly)}/month · up to {p.propertyLimit} PG{' '}
                  {p.propertyLimit === 1 ? 'property' : 'properties'}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Modal>

      {/* -------------------------------------------------- history modal */}
      <Modal
        open={liveHistory !== null}
        title="Subscription history"
        subtitle={liveHistory ? `${liveHistory.id} · ${liveHistory.pgName}` : undefined}
        onClose={() => setHistoryFor(null)}
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setHistoryFor(null)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            Close
          </button>
        }
      >
        {liveHistory && liveHistory.events.length > 0 ? (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {liveHistory.events.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-white"
                  aria-hidden
                />
                <p className="text-sm leading-snug text-ink-soft">{event.text}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-mute">{event.on}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-ivory/50 px-4 py-6 text-center text-sm text-ink-mute">
            No history events recorded for this demo subscription yet.
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel subscription?"
        message={
          <>
            Cancel the subscription for{' '}
            <strong className="font-semibold text-ink">{cancelTarget?.pgName}</strong>? The record will
            be marked CANCELLED in this demo. This does not process any refund (demo only).
          </>
        }
        confirmLabel="Cancel subscription"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={suspendTarget !== null}
        title={suspendTarget?.suspended ? 'Reactivate subscription?' : 'Suspend subscription?'}
        message={
          <>
            {suspendTarget?.suspended ? (
              <>
                Reactivate the subscription for{' '}
                <strong className="font-semibold text-ink">{suspendTarget?.pgName}</strong>? The owner
                regains demo access immediately.
              </>
            ) : (
              <>
                Suspend the subscription for{' '}
                <strong className="font-semibold text-ink">{suspendTarget?.pgName}</strong>? This is a
                demo flag — no data is lost and the owner dashboard keeps showing existing records.
              </>
            )}
          </>
        }
        confirmLabel={suspendTarget?.suspended ? 'Reactivate' : 'Suspend'}
        danger={!suspendTarget?.suspended}
        onConfirm={confirmSuspend}
        onCancel={() => setSuspendTarget(null)}
      />
    </>
  )
}
