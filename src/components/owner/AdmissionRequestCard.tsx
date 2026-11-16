import { Building2, CalendarDays, Check, DoorOpen, Mail, Phone, UserRound, X } from 'lucide-react'
import type { AdmissionRequest } from '../../types/owner'
import { StatusBadge } from '../admin/StatusBadge'

interface AdmissionRequestCardProps {
  request: AdmissionRequest
  propertyName: string
  roomNumber: string | null
  onApprove: (request: AdmissionRequest) => void
  onReject: (request: AdmissionRequest) => void
  onView: (request: AdmissionRequest) => void
}

/** Admission request card with approve / reject actions (owner approval required). */
export function AdmissionRequestCard({
  request,
  propertyName,
  roomNumber,
  onApprove,
  onReject,
  onView,
}: AdmissionRequestCardProps) {
  const pending = request.status === 'PENDING'

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-white p-5 shadow-card transition-all duration-300 hover:border-gold/40 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-soft text-forest">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-ink">{request.studentName}</h3>
            <p className="truncate text-[11.5px] text-ink-mute">Code {request.code}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="mt-4 space-y-2 text-[13px]">
        <div className="flex items-center gap-2.5 text-ink-soft">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
          <dt className="sr-only">Property</dt>
          <dd className="truncate">{propertyName}</dd>
        </div>
        <div className="flex items-center gap-2.5 text-ink-soft">
          <DoorOpen className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
          <dt className="sr-only">Room preference</dt>
          <dd>{roomNumber ? `Preferred room ${roomNumber}` : 'No room preference'}</dd>
        </div>
        <div className="flex items-center gap-2.5 text-ink-soft">
          <Mail className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
          <dt className="sr-only">Email</dt>
          <dd className="truncate">{request.studentEmail}</dd>
        </div>
        <div className="flex items-center gap-2.5 text-ink-soft">
          <Phone className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
          <dt className="sr-only">Mobile</dt>
          <dd>{request.studentMobile}</dd>
        </div>
        <div className="flex items-center gap-2.5 text-ink-soft">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gold-dark" aria-hidden />
          <dt className="sr-only">Requested on</dt>
          <dd>Requested on {request.requestedOn}</dd>
        </div>
      </dl>

      {request.status !== 'PENDING' && (
        <p className="mt-3 rounded-xl bg-ivory/60 px-3 py-2 text-[11.5px] leading-relaxed text-ink-mute">
          {request.status === 'APPROVED'
            ? `Approved on ${request.decidedOn} — active membership granted.`
            : `Rejected on ${request.decidedOn} — ${request.reason ?? 'no reason recorded'}`}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3.5">
        <button
          type="button"
          onClick={() => onView(request)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-forest hover:text-forest"
        >
          View details
        </button>
        {pending && (
          <>
            <button
              type="button"
              onClick={() => onApprove(request)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-forest px-3.5 py-2 text-[11.5px] font-bold text-ivory transition-colors hover:bg-forest-light"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(request)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-danger/35 px-3.5 py-2 text-[11.5px] font-bold text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Reject
            </button>
          </>
        )}
      </div>
    </article>
  )
}
