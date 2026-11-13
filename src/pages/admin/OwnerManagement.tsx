import { useMemo, useState } from 'react'
import { Building2, Eye, Mail, PauseCircle, PlayCircle } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { OwnerRecord, OwnerStatus } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { formatINR } from '../../utils/format'

/** /admin/owners — PG owner account management (fictional demo records). */
export function OwnerManagement() {
  useDocumentTitle('Owner Management')

  const { owners, pgs, plans, subscriptions, setOwnerStatus, pushToast } = useAdminStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | OwnerStatus>('ALL')
  const [detail, setDetail] = useState<OwnerRecord | null>(null)
  const [pending, setPending] = useState<{ owner: OwnerRecord; action: 'SUSPEND' | 'REACTIVATE' } | null>(
    null,
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return owners.filter(
      (o) =>
        (!q || o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q)) &&
        (status === 'ALL' || o.status === status),
    )
  }, [owners, search, status])

  const confirmAction = () => {
    if (!pending) return
    setOwnerStatus(pending.owner.id, pending.action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE')
    pushToast(
      pending.action === 'SUSPEND'
        ? `Owner “${pending.owner.name}” suspended (demo).`
        : `Owner “${pending.owner.name}” reactivated (demo).`,
      pending.action === 'SUSPEND' ? 'error' : 'success',
    )
    setPending(null)
    setDetail(null)
  }

  const columns: Array<Column<OwnerRecord>> = [
    {
      key: 'name',
      header: 'Owner',
      sortValue: (o) => o.name,
      render: (o) => (
        <div>
          <span className="block font-semibold text-ink">{o.name}</span>
          <span className="block text-[11.5px] text-ink-mute">{o.email}</span>
        </div>
      ),
    },
    { key: 'city', header: 'City', sortValue: (o) => o.city, render: (o) => o.city },
    {
      key: 'pgs',
      header: 'PG Properties',
      sortValue: (o) => o.pgIds.length,
      render: (o) => (
        <span className="whitespace-nowrap font-semibold text-ink">{o.pgIds.length}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      sortValue: (o) => o.planId,
      render: (o) => (
        <span className="whitespace-nowrap rounded-full border border-gold/40 bg-gold-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-gold-dark">
          {o.planId}
        </span>
      ),
    },
    {
      key: 'subscription',
      header: 'Subscription',
      sortValue: (o) => o.subscriptionStatus,
      render: (o) => <StatusBadge status={o.subscriptionStatus} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (o) => o.status,
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (o) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDetail(o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
          {o.status === 'ACTIVE' ? (
            <button
              type="button"
              onClick={() => setPending({ owner: o, action: 'SUSPEND' })}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <PauseCircle className="h-3.5 w-3.5" aria-hidden />
              Suspend
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPending({ owner: o, action: 'REACTIVATE' })}
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
            >
              <PlayCircle className="h-3.5 w-3.5" aria-hidden />
              Reactivate
            </button>
          )}
        </div>
      ),
    },
  ]

  const detailPgs = detail ? pgs.filter((pg) => detail.pgIds.includes(pg.id)) : []
  const detailPlan = detail ? plans.find((p) => p.id === detail.planId) : undefined
  const detailSubs = detail
    ? subscriptions.filter((s) => s.ownerName === detail.name)
    : []

  return (
    <>
      <AdminPageHeader
        title="Owner Management"
        description="Search owners, inspect their properties and subscription status, or suspend / reactivate accounts in local demo state."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <Building2 className="h-4 w-4 text-forest" aria-hidden />
            {filtered.length} of {owners.length} owners
          </span>
        }
      />

      <DemoBanner message="owner names and emails are fictional demo records — no real personal details exist here." />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(o) => o.id}
        pageSize={8}
        emptyTitle="No owners match"
        emptyDescription="Adjust the search or status filter to see more demo records."
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search owner by name or email…" />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as 'ALL' | OwnerStatus)}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
            />
          </div>
        }
      />

      <Modal
        open={detail !== null}
        title="Owner details"
        subtitle={detail ? `${detail.id} · joined ${detail.joinedOn}` : undefined}
        onClose={() => setDetail(null)}
        size="lg"
        footer={
          detail && (
            <>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
              >
                Close
              </button>
              {detail.status === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => setPending({ owner: detail, action: 'SUSPEND' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90"
                >
                  <PauseCircle className="h-4 w-4" aria-hidden />
                  Suspend owner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPending({ owner: detail, action: 'REACTIVATE' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden />
                  Reactivate owner
                </button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.subscriptionStatus} />
              <span className="text-xs text-ink-mute">Joined {detail.joinedOn}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Account
                </h3>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5 font-semibold text-ink">{detail.name}</li>
                  <li className="flex items-center gap-2.5 text-ink-soft">
                    <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                    {detail.email}
                  </li>
                  <li className="text-ink-soft">City: {detail.city}</li>
                  <li className="text-ink-soft">
                    Plan:{' '}
                    <span className="font-semibold text-ink">
                      {detailPlan?.name ?? detail.planId}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Subscription
                </h3>
                {detailSubs.length === 0 ? (
                  <p className="text-sm text-ink-mute">No subscription records (demo).</p>
                ) : (
                  <ul className="space-y-2.5 text-sm text-ink-soft">
                    {detailSubs.map((sub) => (
                      <li key={sub.id} className="flex items-center justify-between gap-3">
                        <span>{sub.cycle} · {sub.planId.toUpperCase()}</span>
                        <span>
                          {sub.startOn} → {sub.expiryOn}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-line p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                <Building2 className="h-4 w-4 text-gold-dark" aria-hidden />
                Associated PG properties ({detailPgs.length})
              </h3>
              {detailPgs.length === 0 ? (
                <p className="text-sm text-ink-mute">No linked PG records (demo).</p>
              ) : (
                <ul className="space-y-2.5">
                  {detailPgs.map((pg) => (
                    <li
                      key={pg.id}
                      className="flex items-center gap-3 rounded-xl bg-ivory/60 px-3.5 py-3"
                    >
                      <img
                        src={pg.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {pg.name}
                        </span>
                        <span className="block text-[11.5px] text-ink-mute">
                          {pg.locality}, {pg.city} · {formatINR(pg.rent)}/mo
                        </span>
                      </span>
                      <StatusBadge status={pg.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
              Demo record — no real phone numbers or personal contact details are stored for owners.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.action === 'SUSPEND' ? 'Suspend this owner?' : 'Reactivate this owner?'}
        message={
          <>
            {pending?.action === 'SUSPEND' ? (
              <>
                Suspending <strong className="font-semibold text-ink">{pending?.owner.name}</strong>{' '}
                will flag their account as inactive in this demo. They would normally lose access to
                the owner dashboard (no real session exists).
              </>
            ) : (
              <>
                Reactivating{' '}
                <strong className="font-semibold text-ink">{pending?.owner.name}</strong> restores
                their account to ACTIVE in this demo.
              </>
            )}
          </>
        }
        confirmLabel={pending?.action === 'SUSPEND' ? 'Suspend' : 'Reactivate'}
        danger={pending?.action === 'SUSPEND'}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
