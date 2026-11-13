import { useMemo, useState } from 'react'
import { Building2, Eye, MapPin, PauseCircle, PlayCircle, ShieldCheck, XCircle } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { AdminPg } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { formatINR } from '../../utils/format'

type PendingAction = { pg: AdminPg; action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE' }

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

/** /admin/pgs — full PG moderation interface (local demo state only). */
export function PGManagement() {
  useDocumentTitle('PG Management')

  const { pgs, owners, setPgStatus, pushToast } = useAdminStore()

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('ALL')
  const [type, setType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [detail, setDetail] = useState<AdminPg | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const cities = useMemo(() => ['ALL', ...new Set(pgs.map((p) => p.city))], [pgs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pgs.filter(
      (pg) =>
        (!q || pg.name.toLowerCase().includes(q)) &&
        (city === 'ALL' || pg.city === city) &&
        (type === 'ALL' || pg.category === type) &&
        (status === 'ALL' || pg.status === status),
    )
  }, [pgs, search, city, type, status])

  const confirmAction = (reason?: string) => {
    if (!pending) return
    const { pg, action } = pending
    if (action === 'APPROVE') {
      setPgStatus(pg.id, 'APPROVED', 'Approved from the admin console (demo).')
      pushToast(`“${pg.name}” approved and published (demo).`)
    } else if (action === 'REJECT') {
      setPgStatus(pg.id, 'REJECTED', reason ?? 'Rejected from the admin console (demo).')
      pushToast(`“${pg.name}” rejected (demo).`, 'error')
    } else if (action === 'SUSPEND') {
      setPgStatus(pg.id, 'SUSPENDED', 'Suspended from the admin console (demo).')
      pushToast(`“${pg.name}” suspended (demo).`, 'error')
    } else {
      setPgStatus(pg.id, 'APPROVED', 'Reactivated from the admin console (demo).')
      pushToast(`“${pg.name}” reactivated (demo).`)
    }
    setPending(null)
    if (detail?.id === pg.id) setDetail(null)
  }

  const quickAction = (pg: AdminPg): PendingAction['action'] | null => {
    if (pg.status === 'PENDING' || pg.status === 'REJECTED') return 'APPROVE'
    if (pg.status === 'APPROVED') return 'SUSPEND'
    if (pg.status === 'SUSPENDED') return 'REACTIVATE'
    return null
  }

  const columns: Array<Column<AdminPg>> = [
    {
      key: 'name',
      header: 'PG Name',
      sortValue: (pg) => pg.name,
      render: (pg) => (
        <div className="flex items-center gap-3">
          <img
            src={pg.coverImage}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{pg.name}</span>
            <span className="block text-[11px] text-ink-mute">{pg.locality}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      sortValue: (pg) => pg.ownerName,
      render: (pg) => <span className="whitespace-nowrap">{pg.ownerName}</span>,
    },
    { key: 'city', header: 'City', sortValue: (pg) => pg.city, render: (pg) => pg.city },
    {
      key: 'type',
      header: 'PG Type',
      sortValue: (pg) => pg.category,
      render: (pg) => (
        <span className="whitespace-nowrap rounded-full border border-line bg-ivory px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
          {pg.category}
        </span>
      ),
    },
    {
      key: 'registered',
      header: 'Registration Date',
      sortValue: (pg) => pg.registeredOn,
      render: (pg) => <span className="whitespace-nowrap tabular-nums">{pg.registeredOn}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (pg) => pg.status,
      render: (pg) => <StatusBadge status={pg.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (pg) => {
        const action = quickAction(pg)
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDetail(pg)}
              className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              View
            </button>
            {action === 'APPROVE' && (
              <button
                type="button"
                onClick={() => setPending({ pg, action: 'APPROVE' })}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Approve
              </button>
            )}
            {action === 'SUSPEND' && (
              <button
                type="button"
                onClick={() => setPending({ pg, action: 'SUSPEND' })}
                className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
              >
                <PauseCircle className="h-3.5 w-3.5" aria-hidden />
                Suspend
              </button>
            )}
            {action === 'REACTIVATE' && (
              <button
                type="button"
                onClick={() => setPending({ pg, action: 'REACTIVATE' })}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
              >
                <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                Reactivate
              </button>
            )}
          </div>
        )
      },
    },
  ]

  const detailOwner = detail ? owners.find((o) => o.id === detail.ownerId) : undefined

  return (
    <>
      <AdminPageHeader
        title="PG Management"
        description="Search, filter and moderate every registered property. Status changes are stored in local demo state only."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <Building2 className="h-4 w-4 text-forest" aria-hidden />
            {filtered.length} of {pgs.length} listings
          </span>
        }
      />

      <DemoBanner message="all PG listings shown here are sample properties for interface demonstration." />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(pg) => pg.id}
        pageSize={8}
        emptyTitle="No PGs match these filters"
        emptyDescription="Try clearing the search or selecting a different city, type or status."
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search PG by name…" />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="City"
                value={city}
                onChange={setCity}
                options={cities.map((c) => ({ value: c, label: c === 'ALL' ? 'All cities' : c }))}
              />
              <FilterSelect
                label="Type"
                value={type}
                onChange={setType}
                options={[
                  { value: 'ALL', label: 'All types' },
                  { value: 'Boys', label: 'Boys' },
                  { value: 'Girls', label: 'Girls' },
                  { value: 'Co-living', label: 'Co-living' },
                ]}
              />
              <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_FILTERS} />
            </div>
          </div>
        }
      />

      {/* ------------------------------------------------------ detail modal */}
      <Modal
        open={detail !== null}
        title={detail?.name ?? ''}
        subtitle={detail ? `${detail.id} · demo listing record` : undefined}
        onClose={() => setDetail(null)}
        size="xl"
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
              {detail.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => setPending({ pg: detail, action: 'APPROVE' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Approve listing
                </button>
              )}
              {detail.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => setPending({ pg: detail, action: 'SUSPEND' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90"
                >
                  <PauseCircle className="h-4 w-4" aria-hidden />
                  Suspend listing
                </button>
              )}
              {detail.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => setPending({ pg: detail, action: 'REJECT' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-danger/40 bg-white px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  <XCircle className="h-4 w-4" aria-hidden />
                  Reject listing
                </button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={detail.status} />
              <span className="rounded-full border border-line bg-ivory px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                {detail.category}
              </span>
              <span className="text-xs text-ink-mute">Registered {detail.registeredOn}</span>
            </div>

            {detail.statusNote && (
              <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[13px] text-gold-dark">
                {detail.statusNote}
              </p>
            )}

            {/* Photos */}
            <div>
              <h3 className="mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Uploaded photos
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {detail.gallery.map((src, i) => (
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt={`${detail.name} demo photo ${i + 1}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-2xl border border-line object-cover"
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  PG information
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Name</dt>
                    <dd className="text-right font-semibold text-ink">{detail.name}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Type</dt>
                    <dd className="text-right font-semibold text-ink">{detail.category}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">City</dt>
                    <dd className="text-right font-semibold text-ink">{detail.city}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Locality</dt>
                    <dd className="text-right font-semibold text-ink">{detail.locality}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Rent from</dt>
                    <dd className="text-right font-semibold text-ink">
                      {formatINR(detail.rent)}/mo
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Owner information
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Owner</dt>
                    <dd className="text-right font-semibold text-ink">{detail.ownerName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Email</dt>
                    <dd className="text-right font-semibold text-ink">
                      {detailOwner?.email ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Owner status</dt>
                    <dd className="text-right">
                      <StatusBadge status={detailOwner?.status ?? 'ACTIVE'} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-mute">Owner ID</dt>
                    <dd className="text-right font-semibold text-ink">{detail.ownerId}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-2xl border border-line p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                <MapPin className="h-4 w-4 text-gold-dark" aria-hidden />
                Address
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{detail.address}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{detail.description}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-line p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Facilities
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {detail.facilities.map((facility) => (
                    <li
                      key={facility}
                      className="rounded-full bg-forest-soft px-3 py-1 text-[11.5px] font-semibold text-forest"
                    >
                      {facility}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-line p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Room categories
                </h3>
                <ul className="space-y-2">
                  {detail.roomCategories.map((room) => (
                    <li
                      key={room.label}
                      className="flex items-center justify-between gap-3 rounded-xl bg-ivory/60 px-3.5 py-2.5 text-sm"
                    >
                      <span className="font-semibold text-ink">{room.label}</span>
                      <span className="whitespace-nowrap text-ink-soft">
                        {formatINR(room.rent)}/mo
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* --------------------------------------------------- confirm dialog */}
      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.action === 'APPROVE'
            ? 'Approve this PG listing?'
            : pending?.action === 'REJECT'
              ? 'Reject this PG listing?'
              : pending?.action === 'SUSPEND'
                ? 'Suspend this PG listing?'
                : 'Reactivate this PG listing?'
        }
        message={
          <>
            You are about to mark{' '}
            <strong className="font-semibold text-ink">{pending?.pg.name}</strong>{' '}
            {pending?.action === 'APPROVE'
              ? 'as APPROVED — it will appear live on the public site (demo).'
              : pending?.action === 'REJECT'
                ? 'as REJECTED (demo).'
                : pending?.action === 'SUSPEND'
                  ? 'as SUSPENDED — it will be hidden from the public site (demo).'
                  : 'as APPROVED again (demo).'}
          </>
        }
        confirmLabel={
          pending?.action === 'APPROVE' || pending?.action === 'REACTIVATE'
            ? 'Approve'
            : pending?.action === 'REJECT'
              ? 'Reject'
              : 'Suspend'
        }
        danger={pending?.action === 'REJECT' || pending?.action === 'SUSPEND'}
        requireReason={pending?.action === 'REJECT'}
        reasonLabel={pending?.action === 'REJECT' ? 'Rejection reason' : undefined}
        reasonPlaceholder="e.g. Address proof missing (demo reason)"
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
