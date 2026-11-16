import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, Mail, MapPin, XCircle } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { ApplicationStatus, OwnerApplication } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'

type PendingAction = { app: OwnerApplication; action: 'APPROVE' | 'REJECT' }

/** /admin/applications — owner application review queue. */
export function OwnerApplications() {
  useDocumentTitle('Owner Applications')

  const { applications, setApplicationStatus, pushToast } = useAdminStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | ApplicationStatus>('ALL')
  const [detail, setDetail] = useState<OwnerApplication | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const counts = useMemo(
    () => ({
      PENDING: applications.filter((a) => a.status === 'PENDING').length,
      APPROVED: applications.filter((a) => a.status === 'APPROVED').length,
      REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
    }),
    [applications],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applications
      .filter(
        (app) =>
          (!q ||
            app.ownerName.toLowerCase().includes(q) ||
            app.pgName.toLowerCase().includes(q) ||
            app.email.toLowerCase().includes(q)) &&
          (status === 'ALL' || app.status === status),
      )
      .sort((a, b) => b.submittedOn.localeCompare(a.submittedOn))
  }, [applications, search, status])

  const confirmAction = (reason?: string) => {
    if (!pending) return
    const { app, action } = pending
    if (action === 'APPROVE') {
      setApplicationStatus(app.id, 'APPROVED')
      pushToast(`Application from “${app.ownerName}” approved.`)
    } else {
      setApplicationStatus(app.id, 'REJECTED', reason)
      pushToast(`Application from “${app.ownerName}” rejected.`, 'error')
    }
    setPending(null)
    setDetail(null)
  }

  const columns: Array<Column<OwnerApplication>> = [
    {
      key: 'owner',
      header: 'Applicant',
      sortValue: (app) => app.ownerName,
      render: (app) => (
        <div>
          <span className="block font-semibold text-ink">{app.ownerName}</span>
          <span className="block text-[11.5px] text-ink-mute">{app.email}</span>
        </div>
      ),
    },
    {
      key: 'pg',
      header: 'PG / Business',
      sortValue: (app) => app.pgName,
      render: (app) => (
        <div>
          <span className="block font-semibold text-ink">{app.pgName}</span>
          <span className="block text-[11.5px] text-ink-mute">
            {app.city} · {app.category}
          </span>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      sortValue: (app) => app.submittedOn,
      render: (app) => <span className="whitespace-nowrap tabular-nums">{app.submittedOn}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (app) => app.status,
      render: (app) => <StatusBadge status={app.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (app) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDetail(app)}
            className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </button>
          {app.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => setPending({ app, action: 'APPROVE' })}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-xs font-bold text-ivory transition-colors hover:bg-forest-light"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setPending({ app, action: 'REJECT' })}
                className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-white px-3.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white"
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Owner Applications"
        description="Review complete owner submissions, approve new applications or reject them with a reason."
        actions={
          <div className="flex flex-wrap gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={
                  status === key
                    ? 'inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-bold text-ivory'
                    : 'inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest'
                }
              >
                {key} · {counts[key]}
              </button>
            ))}
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(app) => app.id}
        pageSize={8}
        emptyTitle="No applications match"
        emptyDescription="Try a different search term or status filter."
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by owner, PG or email…"
            />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as 'ALL' | ApplicationStatus)}
                options={[
                  { value: 'ALL', label: 'All statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
              {status !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStatus('ALL')}
                  className="text-xs font-bold text-forest hover:text-gold-dark"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        }
      />

      {/* ---------------------------------------------- complete application */}
      <Modal
        open={detail !== null}
        title="Complete application"
        subtitle={detail ? `${detail.id} · submitted ${detail.submittedOn}` : undefined}
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
              {detail.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => setPending({ app: detail, action: 'REJECT' })}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-danger/40 bg-white px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending({ app: detail, action: 'APPROVE' })}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Approve application
                  </button>
                </>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-ink-mute">Submitted on {detail.submittedOn}</span>
            </div>

            {detail.status === 'REJECTED' && detail.rejectionReason && (
              <div className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] leading-relaxed text-danger">
                <strong className="font-bold uppercase tracking-wide">Rejection reason:</strong>{' '}
                {detail.rejectionReason}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Owner details
                </h3>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5">
                    <span className="font-semibold text-ink">{detail.ownerName}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-ink-soft">
                    <Mail className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                    {detail.email}
                  </li>
                  <li className="flex items-center gap-2.5 text-ink-soft">
                    <MapPin className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
                    {detail.city}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-line bg-ivory/40 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  PG details
                </h3>
                <ul className="space-y-2.5 text-sm text-ink-soft">
                  <li>
                    <span className="font-semibold text-ink">{detail.pgName}</span>
                  </li>
                  <li>Category: {detail.category}</li>
                  <li>City: {detail.city}</li>
                  <li>Application ID: {detail.id}</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-line p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Submission note
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{detail.note}</p>
            </div>

          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.action === 'APPROVE' ? 'Approve application?' : 'Reject application?'}
        message={
          <>
            {pending?.action === 'APPROVE' ? (
              <>
                Approve the application from{' '}
                <strong className="font-semibold text-ink">{pending?.app.ownerName}</strong> for{' '}
                <strong className="font-semibold text-ink">{pending?.app.pgName}</strong>?
              </>
            ) : (
              <>
                Reject the application from{' '}
                <strong className="font-semibold text-ink">{pending?.app.ownerName}</strong>. A
                rejection reason is required and will be saved with the record.
              </>
            )}
          </>
        }
        confirmLabel={pending?.action === 'APPROVE' ? 'Approve' : 'Reject'}
        danger={pending?.action === 'REJECT'}
        requireReason={pending?.action === 'REJECT'}
        reasonLabel={pending?.action === 'REJECT' ? 'Rejection reason' : undefined}
        reasonPlaceholder="e.g. Incomplete KYC documents"
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
