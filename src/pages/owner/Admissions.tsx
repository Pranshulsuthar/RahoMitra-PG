import { useMemo, useState } from 'react'
import { ClipboardCheck, Inbox, ShieldAlert } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { FilterSelect } from '../../components/admin/Filters'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { AdmissionCodeGenerator } from '../../components/owner/AdmissionCodeGenerator'
import { AdmissionRequestCard } from '../../components/owner/AdmissionRequestCard'
import { StatisticCard } from '../../components/owner/StatisticCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { EmptyState } from '../../components/common/EmptyState'
import type { AdmissionRequest } from '../../types/owner'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Any status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

/** /owner/admissions — codes, simulated requests and owner approvals. */
export function Admissions() {
  useDocumentTitle('Admission Management')

  const { properties, rooms, requests, codes, scopedPropertyIds, decideRequest } = useOwnerStore()

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [viewing, setViewing] = useState<AdmissionRequest | null>(null)
  const [approving, setApproving] = useState<AdmissionRequest | null>(null)
  const [rejecting, setRejecting] = useState<AdmissionRequest | null>(null)

  const scopedRequests = useMemo(
    () => requests.filter((r) => scopedPropertyIds.includes(r.propertyId)),
    [requests, scopedPropertyIds],
  )
  const scopedCodes = useMemo(
    () => codes.filter((c) => scopedPropertyIds.includes(c.propertyId)),
    [codes, scopedPropertyIds],
  )

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return scopedRequests
    return scopedRequests.filter((r) => r.status === statusFilter)
  }, [scopedRequests, statusFilter])

  const pending = scopedRequests.filter((r) => r.status === 'PENDING').length
  const approved = scopedRequests.filter((r) => r.status === 'APPROVED').length
  const rejected = scopedRequests.filter((r) => r.status === 'REJECTED').length

  const nameOf = (propertyId: string) =>
    properties.find((p) => p.id === propertyId)?.name ?? 'Unknown property'

  const roomNumberOf = (request: AdmissionRequest) => {
    if (!request.roomPreference) return null
    return rooms.find((r) => r.id === request.roomPreference)?.number ?? null
  }

  const confirmApprove = () => {
    if (!approving) return
    decideRequest(approving.id, 'APPROVED')
    setApproving(null)
    setViewing(null)
  }

  const confirmReject = (reason?: string) => {
    if (!rejecting) return
    decideRequest(rejecting.id, 'REJECTED', reason)
    setRejecting(null)
    setViewing(null)
  }

  return (
    <>
      <AdminPageHeader
        title="Admission Management"
        description="Generate demo admission codes, review simulated requests and approve or reject them yourself."
      />

      <DemoBanner message="admission codes are locally simulated — NOT secure, server-validated, single-use or actually distributed. Membership activates only after your approval." />

      {/* Honesty callout */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-dashed border-danger/50 bg-danger-soft/50 px-4 py-3.5 text-[12.5px] leading-relaxed text-danger">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-bold uppercase tracking-wide">Frontend simulation only</strong> —
          entering a code never auto-activates a membership. Owner approval is always required,
          and approval first checks that the property has a free bed (capacity guard).
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatisticCard label="Codes Generated" value={scopedCodes.length} icon={ClipboardCheck} tone="ink" />
        <StatisticCard label="Pending Requests" value={pending} icon={Inbox} tone={pending > 0 ? 'danger' : 'ink'} />
        <StatisticCard label="Approved" value={approved} icon={ClipboardCheck} tone="forest" />
        <StatisticCard label="Rejected" value={rejected} icon={Inbox} tone="gold" />
      </div>

      {/* ------------------------------------------------- code generator */}
      <AdmissionCodeGenerator propertyIds={scopedPropertyIds} />

      {/* ------------------------------------------------------ requests */}
      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg">Admission requests</h2>
          <div className="flex items-center gap-3">
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
            />
            <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
              {filtered.length} total · demo
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No admission requests"
            description="No demo requests match this filter. Use “Simulate request” on an active code to create one and walk through the approval flow."
            icon={<Inbox className="h-6 w-6" aria-hidden />}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((request) => (
              <AdmissionRequestCard
                key={request.id}
                request={request}
                propertyName={nameOf(request.propertyId)}
                roomNumber={roomNumberOf(request)}
                onApprove={setApproving}
                onReject={setRejecting}
                onView={setViewing}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------ request details */}
      <Modal
        open={viewing !== null}
        title="Admission request details"
        subtitle="Frontend demo record — no data was received from any server."
        onClose={() => setViewing(null)}
        footer={
          viewing && (
            <>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-full border border-forest/25 px-5 py-2.5 text-sm font-bold text-forest hover:bg-forest hover:text-ivory"
              >
                Close
              </button>
              {viewing.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => setRejecting(viewing)}
                    className="rounded-full border border-danger/35 px-5 py-2.5 text-sm font-bold text-danger hover:bg-danger hover:text-white"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproving(viewing)}
                    className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-ivory hover:bg-forest-light"
                  >
                    Approve request
                  </button>
                </>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-line bg-ivory/50 px-4 py-3.5">
              <div>
                <p className="text-lg font-bold text-ink">{viewing.studentName}</p>
                <p className="text-[12.5px] text-ink-mute">
                  {viewing.studentEmail} · {viewing.studentMobile} (demo)
                </p>
              </div>
              <StatusBadge status={viewing.status} />
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Admission code', viewing.code],
                ['Selected PG', nameOf(viewing.propertyId)],
                [
                  'Room preference',
                  roomNumberOf(viewing)
                    ? `Room ${roomNumberOf(viewing)}`
                    : 'No preference — any free bed',
                ],
                ['Request date', viewing.requestedOn],
                ['Decided on', viewing.decidedOn ?? '—'],
                ['Status', viewing.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-line bg-white px-4 py-3">
                  <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink-mute">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-[13.5px] font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {viewing.reason && (
              <p className="rounded-2xl bg-danger-soft/60 px-4 py-3 text-[12.5px] text-danger">
                Rejection reason: {viewing.reason}
              </p>
            )}

            {viewing.status === 'PENDING' && (
              <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12.5px] leading-relaxed text-gold-dark">
                Approval will check available capacity, allocate the first free bed (preferred room
                first) and grant an ACTIVE membership in this demo session.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* --------------------------------------------------- approve guard */}
      <ConfirmDialog
        open={approving !== null}
        title="Approve admission request?"
        message={
          <>
            <strong>{approving?.studentName}</strong> will be allocated the first free bed in{' '}
            {approving ? nameOf(approving.propertyId) : ''} (preferred room first) and receive an
            ACTIVE membership. This is a local demo action — approval is blocked automatically if
            no bed is free.
          </>
        }
        confirmLabel="Approve & allocate bed"
        onConfirm={confirmApprove}
        onCancel={() => setApproving(null)}
      />

      {/* ---------------------------------------------------- reject modal */}
      <ConfirmDialog
        open={rejecting !== null}
        title="Reject admission request?"
        message={
          <>
            Reject the request from <strong>{rejecting?.studentName}</strong>. No membership will be
            created.
          </>
        }
        confirmLabel="Reject request"
        danger
        requireReason
        reasonLabel="Rejection reason"
        reasonPlaceholder="e.g. Property full for this month (demo)"
        onConfirm={confirmReject}
        onCancel={() => setRejecting(null)}
      />
    </>
  )
}
