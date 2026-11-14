import { useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarDays, CheckCircle2, Image as ImageIcon, MessageSquare, Send, User } from 'lucide-react'
import { Modal } from '../admin/Modal'
import { ConfirmDialog } from '../admin/ConfirmDialog'
import { StatusBadge } from '../admin/StatusBadge'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { FormSelect, FormTextarea } from '../owner/FormInput'
import { commPropertyName } from '../../data/communicationData'
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  PRIORITY_LABELS,
  fmtDate,
} from '../../types/communication'
import type { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/communication'

/**
 * SECTION 07 — complaint detail modal shared by the owner console and the
 * student portal.
 *  - Owner: change priority, change status, respond, resolve, reject (reason).
 *  - Student: read the full ticket, history and responses, add a comment —
 *    the official status controls are never rendered for students.
 */
interface ComplaintDetailModalProps {
  complaint: Complaint | null
  viewer: 'OWNER' | 'STUDENT'
  viewerName: string
  onClose: () => void
  onStatusChange: (status: ComplaintStatus, note: string) => void
  onPriorityChange: (priority: ComplaintPriority) => void
  onComment: (body: string) => void
}

const STATUS_OPTIONS = (
  Object.keys(COMPLAINT_STATUS_LABELS) as ComplaintStatus[]
).map((value) => ({ value, label: COMPLAINT_STATUS_LABELS[value] }))

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABELS) as ComplaintPriority[]).map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))

export function ComplaintDetailModal({
  complaint,
  viewer,
  viewerName,
  onClose,
  onStatusChange,
  onPriorityChange,
  onComment,
}: ComplaintDetailModalProps) {
  const [statusDraft, setStatusDraft] = useState<string>('')
  const [statusNote, setStatusNote] = useState('')
  const [priorityDraft, setPriorityDraft] = useState<string>('')
  const [comment, setComment] = useState('')
  const [tab, setTab] = useState<'HISTORY' | 'RESPONSE'>('HISTORY')
  const [confirm, setConfirm] = useState<'RESOLVE' | 'REJECT' | null>(null)

  if (!complaint) return null

  const isOwner = viewer === 'OWNER'
  const activeStatus = statusDraft || complaint.status
  const activePriority = priorityDraft || complaint.priority

  const applyStatus = () => {
    const next = activeStatus as ComplaintStatus
    if (next === complaint.status && !statusNote.trim()) return
    onStatusChange(next, statusNote.trim())
    setStatusDraft('')
    setStatusNote('')
  }

  const applyPriority = () => {
    const next = activePriority as ComplaintPriority
    if (next === complaint.priority) return
    onPriorityChange(next)
    setPriorityDraft('')
  }

  const sendComment = () => {
    if (!comment.trim()) return
    onComment(comment.trim())
    setComment('')
    setTab('HISTORY')
  }

  const statusDirty = Boolean(statusDraft) && statusDraft !== complaint.status
  const priorityDirty = Boolean(priorityDraft) && priorityDraft !== complaint.priority

  return (
    <Modal
      open
      title={complaint.subject}
      subtitle={`${complaint.id} · ${COMPLAINT_CATEGORY_LABELS[complaint.category]} · submitted ${fmtDate(complaint.submittedOn)}`}
      onClose={onClose}
      size="xl"
      footer={
        <Button variant="outline" size="md" onClick={onClose}>
          Close
        </Button>
      }
    >
      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Student" value={complaint.studentName} />
        <Fact label="PG" value={commPropertyName(complaint.propertyId)} />
        <Fact label="Room" value={`Room ${complaint.roomNumber}`} />
        <Fact label="Status">
          <StatusBadge status={complaint.status} />
        </Fact>
      </div>

      {/* description */}
      <section className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">Description</h3>
        <p className="mt-2 rounded-2xl border border-line bg-ivory/50 p-4 text-sm leading-relaxed text-ink">
          {complaint.description}
        </p>
        {complaint.image && (
          <img
            src={complaint.image}
            alt="Complaint attachment preview (local demo)"
            className="mt-3 max-h-56 rounded-2xl border border-line object-cover"
          />
        )}
      </section>

      {/* owner controls */}
      {isOwner ? (
        <section className="mt-5 rounded-3xl border border-gold/40 bg-gold-soft/40 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gold-dark">
            Owner actions
          </h3>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <FormSelect
              id={`cmp-status-${complaint.id}`}
              label="Status"
              value={activeStatus}
              onChange={setStatusDraft}
              options={STATUS_OPTIONS}
            />
            <FormSelect
              id={`cmp-priority-${complaint.id}`}
              label="Priority"
              value={activePriority}
              onChange={setPriorityDraft}
              options={PRIORITY_OPTIONS}
            />
          </div>

          <div className="mt-3">
            <FormTextarea
              id={`cmp-note-${complaint.id}`}
              label="Note with status change (optional)"
              value={statusNote}
              onChange={setStatusNote}
              rows={2}
              placeholder="e.g. Technician scheduled for 15 May morning (demo)"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={applyStatus} disabled={!statusDirty && !statusNote.trim()}>
              Update status
            </Button>
            <Button variant="outline" size="sm" onClick={applyPriority} disabled={!priorityDirty}>
              Update priority
            </Button>
            <Button variant="gold" size="sm" onClick={() => setConfirm('RESOLVE')} disabled={complaint.status === 'RESOLVED'}>
              <CheckCircle2 size={14} /> Mark resolved
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirm('REJECT')}
              disabled={complaint.status === 'REJECTED'}
            >
              Reject
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-mute">
            Every change is appended to the history timeline below and notifies the student (demo — no real push sent).
          </p>
        </section>
      ) : (
        <section className="mt-5 rounded-3xl border border-line bg-ivory/40 p-4">
          <p className="text-[12.5px] leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">Official status:</strong>{' '}
            {COMPLAINT_STATUS_LABELS[complaint.status]}. Only the PG owner can change it — you can add
            comments below (demo).
          </p>
        </section>
      )}

      {/* tabs */}
      <div className="mt-5 flex gap-2 border-b border-line">
        {(
          [
            ['HISTORY', `History (${complaint.history.length})`],
            ['RESPONSE', 'Add comment'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-semibold transition ${
              tab === key
                ? 'border-gold text-forest'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'HISTORY' ? (
        complaint.history.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={<MessageSquare size={34} strokeWidth={1.4} />}
              title="No history yet"
              description="Status changes and responses will appear here (demo)."
            />
          </div>
        ) : (
          <ol className="mt-4 space-y-3.5">
            {complaint.history.map((ev) => (
              <li key={ev.id} className="relative pl-6">
                <span
                  aria-hidden
                  className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                    ev.actor === 'OWNER' ? 'bg-forest' : 'bg-gold'
                  }`}
                />
                <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-ink">{ev.title}</p>
                    <span className="text-[11px] text-muted">
                      {fmtDate(ev.date)} · {ev.at}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{ev.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                      <User size={11} /> {ev.actorName}
                    </span>
                    {ev.status && <StatusBadge status={ev.status} />}
                    {ev.kind === 'RESPONSE' && (
                      <span className="rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
                        Response
                      </span>
                    )}
                    {ev.kind === 'COMMENT' && (
                      <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                        Comment
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )
      ) : (
        <div className="mt-4">
          <FormTextarea
            id={`cmp-comment-${complaint.id}`}
            label={isOwner ? 'Response to the student' : 'Add a comment'}
            value={comment}
            onChange={setComment}
            rows={3}
            maxLength={400}
            placeholder={
              isOwner
                ? 'e.g. Technician visited and the AC gas was refilled (demo)…'
                : 'Anything you want to add about this complaint (demo)…'
            }
          />
          <div className="mt-3 flex justify-end">
            <Button variant="gold" size="sm" onClick={sendComment} disabled={!comment.trim()}>
              <Send size={14} /> {isOwner ? 'Send response' : 'Add comment'}
            </Button>
          </div>
          <p className="mt-2 text-right text-[11px] text-muted">
            Signed as {viewerName} · demo only
          </p>
        </div>
      )}

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted">
        <CalendarDays size={12} /> Submitted {fmtDate(complaint.submittedOn)} ·{' '}
        <ImageIcon size={12} className="ml-1" /> attachments stay local to this browser (demo)
      </p>

      <ConfirmDialog
        open={confirm === 'RESOLVE'}
        title="Mark complaint as resolved?"
        message={`“${complaint.subject}” will move to Resolved and the student will be notified (demo).`}
        confirmLabel="Mark resolved"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          onStatusChange('RESOLVED', 'Marked as resolved by the owner (demo).')
          setConfirm(null)
        }}
      />
      <ConfirmDialog
        open={confirm === 'REJECT'}
        title="Reject this complaint?"
        message="A reason is required — the student sees it in the history timeline (demo)."
        confirmLabel="Reject complaint"
        danger
        requireReason
        reasonLabel="Rejection reason"
        reasonPlaceholder="e.g. Could not reproduce the issue after checking (demo)…"
        onCancel={() => setConfirm(null)}
        onConfirm={(reason) => {
          onStatusChange('REJECTED', reason || 'Rejected by the owner (demo).')
          setConfirm(null)
        }}
      />
    </Modal>
  )
}

function Fact({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-ivory/50 px-3.5 py-2.5">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <div className="mt-1 text-[13px] font-semibold text-ink">{children ?? value}</div>
    </div>
  )
}
