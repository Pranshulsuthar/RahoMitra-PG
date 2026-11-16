import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, History, Plus, Star, XCircle } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { FeaturedRequest, FeaturedTier } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { formatINR } from '../../utils/format'
import { cn } from '../../utils/cn'

const TIER_META: Array<{ tier: FeaturedTier; label: string; price: number; blurb: string }> = [
  {
    tier: 'FEATURED',
    label: 'Featured Listing',
    price: 299,
    blurb: 'Gold Featured badge on the public Explore page for 30 days.',
  },
  {
    tier: 'PREMIUM_FEATURED',
    label: 'Premium Featured Placement',
    price: 499,
    blurb: 'Premium badge with priority placement on Explore for 30 days.',
  },
]

/** /admin/featured-listings — owner featured requests + admin decisions. */
export function FeaturedListings() {
  useDocumentTitle('Featured Listings')

  const { featuredRequests, pgs, submitFeaturedRequest, decideFeaturedRequest, setFeaturedListingStatus, pushToast } =
    useAdminStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | FeaturedRequest['status']>('ALL')
  const [requestOpen, setRequestOpen] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)
  const [approveTarget, setApproveTarget] = useState<FeaturedRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<FeaturedRequest | null>(null)
  const [duration, setDuration] = useState(1)

  /* ---- featured-owner-request form */
  const [form, setForm] = useState({ pgId: '', tier: 'FEATURED' as FeaturedTier })
  const [formError, setFormError] = useState<string | null>(null)

  const liveDetail = detail ? featuredRequests.find((r) => r.id === detail) ?? null : null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return featuredRequests.filter(
      (r) =>
        (!q ||
          r.pgName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)) &&
        (status === 'ALL' || r.status === status),
    )
  }, [featuredRequests, search, status])

  const submitRequest = (event: FormEvent) => {
    event.preventDefault()
    if (!form.pgId) {
      setFormError('Select an eligible PG property.')
      return
    }
    const pg = pgs.find((p) => p.id === form.pgId)
    if (!pg) {
      setFormError('Selected PG not found.')
      return
    }
    const meta = TIER_META.find((t) => t.tier === form.tier)!
    submitFeaturedRequest({
      pgId: pg.id,
      pgName: pg.name,
      ownerName: pg.ownerName,
      tier: form.tier,
      amount: meta.price,
    })
    pushToast(`Featured request submitted for “${pg.name}”.`)
    setRequestOpen(false)
    setForm({ pgId: '', tier: 'FEATURED' })
    setFormError(null)
  }

  const confirmApprove = () => {
    if (!approveTarget) return
    decideFeaturedRequest(approveTarget.id, 'APPROVED', { durationMonths: duration })
    pushToast(
      `Featured listing ${approveTarget.id} approved for ${duration} month${duration > 1 ? 's' : ''}.`,
    )
    setApproveTarget(null)
    setDuration(1)
  }

  const confirmReject = (reason?: string) => {
    if (!rejectTarget) return
    decideFeaturedRequest(rejectTarget.id, 'REJECTED', { reason })
    pushToast(`Featured listing ${rejectTarget.id} rejected.`, 'error')
    setRejectTarget(null)
  }

  const columns: Array<Column<FeaturedRequest>> = [
    {
      key: 'id',
      header: 'Request ID',
      sortValue: (r) => r.id,
      render: (r) => <span className="whitespace-nowrap font-mono text-xs text-ink-soft">{r.id}</span>,
    },
    {
      key: 'pg',
      header: 'PG Property',
      sortValue: (r) => r.pgName,
      render: (r) => (
        <div>
          <span className="block font-semibold text-ink">{r.pgName}</span>
          <span className="block text-[11.5px] text-ink-mute">{r.ownerName}</span>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Option',
      sortValue: (r) => r.tier,
      render: (r) => (
        <span className="whitespace-nowrap rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-gold-dark">
          {r.tier === 'PREMIUM_FEATURED' ? 'Premium' : 'Featured'} · {formatINR(r.amount)}/mo
        </span>
      ),
    },
    {
      key: 'requested',
      header: 'Requested On',
      sortValue: (r) => r.requestedOn,
      render: (r) => <span className="whitespace-nowrap tabular-nums">{r.requestedOn}</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      sortValue: (r) => r.durationMonths ?? 0,
      render: (r) => (
        <span className="whitespace-nowrap tabular-nums">
          {r.startOn && r.endOn ? `${r.startOn} → ${r.endOn}` : `${r.durationMonths ?? '—'} mo (on approval)`}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      render: (r) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <StatusBadge status={r.status} />
          {r.status === 'APPROVED' && r.listingStatus && <StatusBadge status={r.listingStatus} />}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDetail(r.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest"
          >
            <History className="h-3.5 w-3.5" aria-hidden />
            History
          </button>
          {r.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setApproveTarget(r)
                  setDuration(1)
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setRejectTarget(r)}
                className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Reject
              </button>
            </>
          )}
          {r.status === 'APPROVED' && r.listingStatus && (
            <button
              type="button"
              onClick={() => {
                const next = r.listingStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                setFeaturedListingStatus(r.id, next)
                pushToast(`Featured listing ${r.id} ${next === 'ACTIVE' ? 'activated' : 'paused'}.`, 'info')
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                r.listingStatus === 'ACTIVE'
                  ? 'border border-danger/40 bg-white text-danger hover:bg-danger hover:text-white'
                  : 'bg-forest text-ivory hover:bg-forest-light',
              )}
            >
              {r.listingStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      ),
    },
  ]

  const eligiblePgs = pgs.filter((pg) => pg.status === 'APPROVED')

  return (
    <>
      <AdminPageHeader
        title="Featured PG Listings"
        description="Owners request paid featured placement for their PGs; approve with a duration, activate, pause or review history. Only approved + active listings show a Featured badge on Explore."
        actions={
          <button
            type="button"
            onClick={() => {
              setFormError(null)
              setRequestOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory shadow-[0_10px_24px_-14px_rgba(23,61,50,0.9)] transition-colors hover:bg-forest-light"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add featured request
          </button>
        }
      />

      {/* --------------------------------------------------- pricing options */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {TIER_META.map((option) => (
          <article
            key={option.tier}
            className="rounded-3xl border border-gold/40 bg-white p-5 shadow-card sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold-dark">
                <Star className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-2xl font-bold text-ink">{formatINR(option.price)}</span>
            </div>
            <h2 className="mt-3 text-lg">{option.label}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{option.blurb}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              30-day billing cycle
            </p>
          </article>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        pageSize={8}
        emptyTitle="No featured requests match"
        emptyDescription="Try clearing the search or selecting a different status."
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by PG, owner or ID…" />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as 'ALL' | FeaturedRequest['status'])}
                options={[
                  { value: 'ALL', label: 'All requests' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>
        }
      />

      {/* -------------------------------------------- add featured request */}
      <Modal
        open={requestOpen}
        title="Add featured request"
        subtitle="Create a featured placement request for a PG property."
        onClose={() => setRequestOpen(false)}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRequestOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="featured-request-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              Submit request
            </button>
          </>
        }
      >
        <form id="featured-request-form" onSubmit={submitRequest} noValidate className="space-y-4">
          <div>
            <label htmlFor="featured-pg" className="form-label">
              Eligible PG (approved listings)<span className="ml-1 text-danger">*</span>
            </label>
            <select
              id="featured-pg"
              className="form-input"
              value={form.pgId}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, pgId: event.target.value }))
                setFormError(null)
              }}
            >
              <option value="">Select a PG property…</option>
              {eligiblePgs.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name} — {pg.ownerName}
                </option>
              ))}
            </select>
            {formError && (
              <span className="form-error" role="alert">
                {formError}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {TIER_META.map((option) => (
              <label
                key={option.tier}
                className={
                  form.tier === option.tier
                    ? 'flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-forest bg-forest-soft/60 p-4'
                    : 'flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-forest/40'
                }
              >
                <input
                  type="radio"
                  name="featured-tier"
                  value={option.tier}
                  checked={form.tier === option.tier}
                  onChange={() => setForm((prev) => ({ ...prev, tier: option.tier }))}
                  className="mt-1 h-4 w-4 accent-[#173D32]"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">{option.label}</span>
                    <span className="text-sm font-bold text-forest">{formatINR(option.price)}/mo</span>
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-soft">{option.blurb}</span>
                </span>
              </label>
            ))}
          </div>

          <p className="rounded-2xl border border-dashed border-forest/30 bg-forest-soft/40 px-4 py-3 text-[12px] leading-relaxed text-forest">
            Featured listing placements highlight approved properties on the public Explore page.
          </p>
        </form>
      </Modal>

      {/* -------------------------------------------------------- history */}
      <Modal
        open={liveDetail !== null}
        title="Featured listing history"
        subtitle={liveDetail ? `${liveDetail.id} · ${liveDetail.pgName}` : undefined}
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
        {liveDetail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={liveDetail.status} />
              {liveDetail.listingStatus && <StatusBadge status={liveDetail.listingStatus} />}
              <span className="rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase text-gold-dark">
                {liveDetail.tier.replace('_', ' ')} · {formatINR(liveDetail.amount)}/mo
              </span>
            </div>
            {liveDetail.rejectReason && (
              <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] leading-relaxed text-danger">
                Rejection reason: {liveDetail.rejectReason}
              </p>
            )}
            <ol className="relative space-y-4 border-l border-line pl-5">
              {liveDetail.history.map((item) => (
                <li key={item.id} className="relative">
                  <span
                    className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-white"
                    aria-hidden
                  />
                  <p className="text-sm leading-snug text-ink-soft">{item.text}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-mute">{item.on}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------------ approve */}
      <Modal
        open={approveTarget !== null}
        title="Approve featured listing"
        subtitle={approveTarget ? `${approveTarget.id} · ${approveTarget.pgName}` : undefined}
        onClose={() => setApproveTarget(null)}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setApproveTarget(null)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmApprove}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Approve & activate
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">Promotion duration</span>
            <div className="flex flex-wrap gap-2.5">
              {[1, 3, 6, 12].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setDuration(months)}
                  className={
                    duration === months
                      ? 'rounded-full bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivory'
                      : 'rounded-full border border-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-soft transition-colors hover:border-forest hover:text-forest'
                  }
                >
                  {months} month{months > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-2xl border border-line bg-ivory/40 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            Start date is today and the listing expires after{' '}
            <strong className="font-semibold text-ink">{duration * 30} days</strong>. The Featured badge
            appears on the public Explore page while the listing is approved and active.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Reject featured request?"
        message={
          <>
            Reject the featured request for{' '}
            <strong className="font-semibold text-ink">{rejectTarget?.pgName}</strong>? The owner can
            submit a new request later.
          </>
        }
        reasonLabel="Rejection reason"
        reasonPlaceholder="e.g. Listing is not approved yet…"
        requireReason
        confirmLabel="Reject request"
        danger
        onConfirm={confirmReject}
        onCancel={() => setRejectTarget(null)}
      />
    </>
  )
}
