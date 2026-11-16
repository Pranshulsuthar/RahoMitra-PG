import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Image as ImageIcon, Inbox, Plus, Send, X } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatCard } from '../../components/admin/StatCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Modal } from '../../components/admin/Modal'
import { FormInput, FormSelect, FormTextarea } from '../../components/owner/FormInput'
import { ComplaintDetailModal } from '../../components/communication/ComplaintDetailModal'
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  PRIORITY_LABELS,
  fmtDate,
} from '../../types/communication'
import type {
  ComplaintCategory,
  ComplaintPriority,
} from '../../types/communication'

interface SubmitForm {
  category: ComplaintCategory
  subject: string
  description: string
  priority: ComplaintPriority
  image: string
}

const EMPTY_FORM: SubmitForm = {
  category: 'ELECTRICITY',
  subject: '',
  description: '',
  priority: 'MEDIUM',
  image: '',
}

/**
 * /student/complaints — Student ticket desk. The student submits
 * a complaint against their enrolled PG, then tracks status and owner responses.
 */
export function StudentComplaints() {
  useDocumentTitle('My Complaints')

  const { user } = useAuth()
  const currentStudentId = user?.id || ''
  const studentName = user?.fullName || 'Student'

  const {
    complaints,
    submitComplaint,
    addComplaintComment,
    pushToast,
  } = useCommunicationStore()

  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [form, setForm] = useState<SubmitForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStudentAccommodation()
      .then((acc) => setLiveAccommodation(acc))
      .catch(() => setLiveAccommodation(null))
  }, [])

  const propertyId = liveAccommodation?.property.id || ''
  const propertyName = liveAccommodation?.property.name || 'My PG'
  const roomNumber = liveAccommodation?.room.number || 'N/A'

  const myComplaints = useMemo(
    () => (currentStudentId ? complaints.filter((c) => c.studentId === currentStudentId) : []),
    [complaints, currentStudentId],
  )

  const filtered = useMemo(() => {
    if (filter === 'OPEN')
      return myComplaints.filter(
        (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED',
      )
    if (filter === 'CLOSED')
      return myComplaints.filter(
        (c) => c.status === 'RESOLVED' || c.status === 'REJECTED',
      )
    return myComplaints
  }, [myComplaints, filter])

  const selected = complaints.find((c) => c.id === selectedId) ?? null

  const openCount = myComplaints.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED',
  ).length
  const resolvedCount = myComplaints.filter((c) => c.status === 'RESOLVED').length
  const inProgressCount = myComplaints.filter(
    (c) => c.status === 'UNDER_REVIEW' || c.status === 'IN_PROGRESS',
  ).length

  const openSubmit = () => {
    if (!liveAccommodation) {
      pushToast('You must be enrolled in a PG to submit complaints.', 'error')
      return
    }
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitOpen(true)
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.subject.trim()) next.subject = 'Subject is required.'
    else if (form.subject.trim().length < 5) next.subject = 'Subject must be at least 5 characters.'
    if (!form.description.trim()) next.description = 'Describe the problem.'
    else if (form.description.trim().length < 15)
      next.description = 'Please write at least 15 characters so the owner can act.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      pushToast('Only image files can be attached.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      pushToast('Image must be 5 MB or smaller.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, image: String(reader.result ?? '') }))
      pushToast('Image attached.', 'info')
    }
    reader.readAsDataURL(file)
  }

  const submit = () => {
    if (!validate()) return
    const complaint = submitComplaint({
      propertyId: propertyId || 'default-property',
      studentId: currentStudentId,
      category: form.category,
      subject: form.subject.trim(),
      description: form.description.trim(),
      priority: form.priority,
      image: form.image,
    })
    setSubmitOpen(false)
    pushToast(
      `Complaint ${complaint.id} submitted successfully.`,
      'success',
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="My Complaints"
        description="Raise an issue regarding room, food, or amenities, and track owner updates."
        actions={
          <Button variant="gold" size="md" onClick={openSubmit}>
            <Plus size={16} /> Submit Complaint
          </Button>
        }
      />

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Complaints" value={myComplaints.length} icon={Inbox} hint="Raised by you" />
        <StatCard
          label="Open"
          value={openCount}
          icon={Send}
          tone={openCount > 0 ? 'danger' : 'forest'}
          hint="Awaiting resolution"
        />
        <StatCard label="In Progress" value={inProgressCount} icon={Eye} tone="gold" hint="Owner is working on it" />
        <StatCard label="Resolved" value={resolvedCount} icon={ImageIcon} hint="Closed successfully" />
      </div>

      {/* filter pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        {(
          [
            ['ALL', `All (${myComplaints.length})`],
            ['OPEN', `Open (${openCount})`],
            ['CLOSED', `Closed (${resolvedCount})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-2 text-[13px] font-bold transition-all ${
              filter === value
                ? 'border-forest bg-forest text-ivory'
                : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Inbox size={40} strokeWidth={1.4} />}
            title={
              myComplaints.length === 0 ? 'No complaints registered' : 'Nothing here'
            }
            description={
              myComplaints.length === 0
                ? 'If something is damaged or needs maintenance in your PG, raise a complaint to notify management.'
                : 'No complaints match the selected filter.'
            }
            action={
              myComplaints.length === 0 ? (
                <Button variant="gold" size="md" onClick={openSubmit}>
                  <Plus size={16} /> Submit your first complaint
                </Button>
              ) : (
                <Button variant="outline" size="md" onClick={() => setFilter('ALL')}>
                  Show all
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="rounded-3xl border border-line bg-white p-5 shadow-card transition hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                      {c.id}
                    </span>
                    <StatusBadge status={c.status} />
                    <StatusBadge status={c.priority} />
                    <span className="rounded-full border border-line bg-ivory px-2.5 py-0.5 text-[10.5px] font-bold text-ink-soft">
                      {COMPLAINT_CATEGORY_LABELS[c.category]}
                    </span>
                  </div>

                  <h3 className="mt-2 text-[15px] font-semibold text-ink">{c.subject}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                    {c.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
                    <span>Submitted {fmtDate(c.submittedOn)}</span>
                    <span>
                      {propertyName} · Room {c.roomNumber || roomNumber}
                    </span>
                    <span>Status: {COMPLAINT_STATUS_LABELS[c.status]}</span>
                    {c.image !== '' && (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon size={12} /> 1 attachment
                      </span>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => setSelectedId(c.id)}>
                  <Eye size={14} /> View details
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* submit modal */}
      <Modal
        open={submitOpen}
        title="Submit Complaint"
        subtitle={`Raising against ${propertyName} · Room ${roomNumber}`}
        onClose={() => setSubmitOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="md" onClick={submit}>
              <Send size={15} /> Submit complaint
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-ivory/50 px-4 py-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Property
            </p>
            <p className="mt-1 text-[13.5px] font-semibold text-ink">
              {propertyName}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-ivory/50 px-4 py-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-mute">
              Room
            </p>
            <p className="mt-1 text-[13.5px] font-semibold text-ink">Room {roomNumber}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="cmp-category"
            label="Category"
            required
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v as ComplaintCategory }))}
            options={(Object.keys(COMPLAINT_CATEGORY_LABELS) as ComplaintCategory[]).map(
              (value) => ({ value, label: COMPLAINT_CATEGORY_LABELS[value] }),
            )}
          />
          <FormSelect
            id="cmp-priority"
            label="Priority"
            required
            value={form.priority}
            onChange={(v) => setForm((f) => ({ ...f, priority: v as ComplaintPriority }))}
            options={(Object.keys(PRIORITY_LABELS) as ComplaintPriority[]).map((value) => ({
              value,
              label: PRIORITY_LABELS[value],
            }))}
            hint="How urgently does this need attention?"
          />
        </div>

        <div className="mt-4">
          <FormInput
            id="cmp-subject"
            label="Subject"
            required
            value={form.subject}
            onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
            placeholder="e.g. AC not cooling in room"
            error={errors.subject}
            hint={`${form.subject.length}/120 characters`}
          />
        </div>

        <div className="mt-4">
          <FormTextarea
            id="cmp-description"
            label="Description"
            required
            rows={4}
            maxLength={600}
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Describe what is broken, where, and any relevant details…"
            error={errors.description}
          />
        </div>

        {/* optional image */}
        <div className="mt-4">
          <p className="form-label">
            Photo (optional)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            aria-label="Attach a photo"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block w-full cursor-pointer rounded-2xl border border-dashed border-line bg-ivory/40 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-[12px] file:font-semibold file:text-ivory hover:border-gold/60"
          />
          <p className="mt-1.5 text-[11px] text-muted">
            Max 5 MB · JPEG or PNG format.
          </p>

          {form.image && (
            <div className="mt-3 inline-flex items-start gap-3 rounded-2xl border border-line bg-white p-3">
              <img
                src={form.image}
                alt="Attachment preview"
                className="h-20 w-20 rounded-xl border border-line object-cover"
              />
              <div>
                <p className="text-[12.5px] font-semibold text-ink">Attachment ready</p>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, image: '' }))
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-danger transition hover:bg-danger-soft"
                >
                  <X size={11} /> Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* details modal — read-only status for students */}
      <ComplaintDetailModal
        complaint={selected}
        viewer="STUDENT"
        viewerName={studentName}
        onClose={() => setSelectedId(null)}
        onStatusChange={() => undefined}
        onPriorityChange={() => undefined}
        onComment={(body: string) => {
          if (!selected) return
          addComplaintComment(selected.id, 'STUDENT', studentName, body, 'Student commented')
          pushToast('Comment added.', 'success')
        }}
      />
    </div>
  )
}

