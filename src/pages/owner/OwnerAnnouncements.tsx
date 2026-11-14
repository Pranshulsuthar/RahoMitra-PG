import { useMemo, useState } from 'react'
import { CalendarDays, Eye, Megaphone, PencilLine, Plus, Trash2 } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { Modal } from '../../components/admin/Modal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { FormInput, FormSelect, FormTextarea } from '../../components/owner/FormInput'
import { cn } from '../../utils/cn'
import { COMM_TODAY, commPropertyName } from '../../data/communicationData'
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  ANNOUNCEMENT_PRIORITY_LABELS,
  fmtDate,
} from '../../types/communication'
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
} from '../../types/communication'
import type { AnnouncementInput } from '../../context/CommunicationStore'

interface AnnForm {
  propertyId: string
  title: string
  message: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  audience: 'ALL' | 'SELECTED'
  audienceStudentIds: string[]
  publishedOn: string
  expiresOn: string
}

const EMPTY_FORM: AnnForm = {
  propertyId: 'pg-001',
  title: '',
  message: '',
  category: 'GENERAL',
  priority: 'NORMAL',
  audience: 'ALL',
  audienceStudentIds: [],
  publishedOn: COMM_TODAY,
  expiresOn: '',
}

/**
 * /owner/announcements — Section 07 notice board manager. Owners create,
 * edit, publish / unpublish and delete notices for their own properties, pick
 * the audience (everyone or selected students) and inspect who received it.
 * Only published + active announcements reach the student notice board.
 */
export function OwnerAnnouncements() {
  useDocumentTitle('Announcements')

  const { scopedPropertyIds, students } = useOwnerStore()
  const {
    announcements,
    saveAnnouncement,
    toggleAnnouncementPublished,
    deleteAnnouncement,
    pushToast,
  } = useCommunicationStore()

  const [query, setQuery] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [stateFilter, setStateFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AnnForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<Announcement | null>(null)
  const [audienceFor, setAudienceFor] = useState<Announcement | null>(null)

  const ownAnnouncements = useMemo(
    () => announcements.filter((a) => scopedPropertyIds.includes(a.propertyId)),
    [announcements, scopedPropertyIds],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ownAnnouncements.filter((a) => {
      if (propertyFilter !== 'ALL' && a.propertyId !== propertyFilter) return false
      if (stateFilter === 'PUBLISHED' && !a.published) return false
      if (stateFilter === 'DRAFT' && a.published) return false
      if (q && !`${a.title} ${a.message}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [ownAnnouncements, query, propertyFilter, stateFilter])

  const propertyStudents = useMemo(
    () =>
      students
        .filter((s) => s.propertyId === form.propertyId && s.membership === 'ACTIVE')
        .map((s) => ({ id: s.id, name: s.name })),
    [students, form.propertyId],
  )

  const propertyOptions = [
    { value: 'ALL', label: 'All my properties' },
    ...scopedPropertyIds.map((id) => ({ value: id, label: commPropertyName(id) })),
  ]

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      propertyId:
        propertyFilter !== 'ALL' ? propertyFilter : (scopedPropertyIds[0] ?? 'pg-001'),
    })
    setErrors({})
    setSaving(false)
    setFormOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditingId(a.id)
    setForm({
      propertyId: a.propertyId,
      title: a.title,
      message: a.message,
      category: a.category,
      priority: a.priority,
      audience: a.audience,
      audienceStudentIds: [...a.audienceStudentIds],
      publishedOn: a.publishedOn,
      expiresOn: a.expiresOn,
    })
    setErrors({})
    setSaving(false)
    setFormOpen(true)
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.propertyId) next.propertyId = 'Select a PG property.'
    if (!form.title.trim()) next.title = 'Title is required.'
    else if (form.title.trim().length < 4) next.title = 'Title must be at least 4 characters.'
    if (!form.message.trim()) next.message = 'Message is required.'
    else if (form.message.trim().length < 10) next.message = 'Write at least 10 characters.'
    if (!form.publishedOn) next.publishedOn = 'Publish date is required.'
    if (form.expiresOn && form.expiresOn < form.publishedOn)
      next.expiresOn = 'Expiry cannot be before the publish date.'
    if (form.audience === 'SELECTED' && form.audienceStudentIds.length === 0)
      next.audienceStudentIds = 'Pick at least one student for a selected audience.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = (publish: boolean) => {
    if (!validate()) return
    setSaving(true)
    const input: AnnouncementInput = {
      propertyId: form.propertyId,
      title: form.title.trim(),
      message: form.message.trim(),
      category: form.category,
      priority: form.priority,
      audience: form.audience,
      audienceStudentIds: form.audience === 'SELECTED' ? form.audienceStudentIds : [],
      publishedOn: form.publishedOn,
      expiresOn: form.expiresOn,
    }
    saveAnnouncement(editingId, input, publish)
    setFormOpen(false)
    setSaving(false)
    pushToast(
      publish
        ? `Announcement ${editingId ? 'updated and published' : 'published'} to ${input.audience === 'ALL' ? 'all students' : `${input.audienceStudentIds.length} selected student(s)`} (demo).`
        : `Announcement saved as draft (demo).`,
      'success',
    )
  }

  const togglePublish = (a: Announcement) => {
    toggleAnnouncementPublished(a.id)
    pushToast(
      a.published
        ? `"${a.title}" unpublished — students no longer see it (demo).`
        : `"${a.title}" published to students (demo).`,
      a.published ? 'info' : 'success',
    )
  }

  const confirmDelete = () => {
    if (!removing) return
    deleteAnnouncement(removing.id)
    pushToast(`Announcement "${removing.title}" deleted (demo).`, 'error')
    setRemoving(null)
  }

  const toggleStudent = (id: string) =>
    setForm((f) => ({
      ...f,
      audienceStudentIds: f.audienceStudentIds.includes(id)
        ? f.audienceStudentIds.filter((s) => s !== id)
        : [...f.audienceStudentIds, id],
    }))

  const publishedCount = ownAnnouncements.filter((a) => a.published).length
  const draftCount = ownAnnouncements.length - publishedCount

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description={`${publishedCount} published · ${draftCount} draft — notices reach only the students of the chosen property and audience (demo).`}
        actions={
          <Button variant="gold" size="md" onClick={openCreate}>
            <Plus size={16} /> New announcement
          </Button>
        }
      />
      <DemoBanner message="announcements are illustrative samples — publishing one never sends an email, SMS or push notification." />

      {/* quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Published" value={publishedCount} tone="forest" />
        <MiniStat label="Drafts" value={draftCount} tone="gold" />
        <MiniStat label="Total (my PGs)" value={ownAnnouncements.length} tone="ink" />
      </div>

      {/* toolbar */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search title or message…" />
        <FilterSelect
          label="Property"
          value={propertyFilter}
          onChange={setPropertyFilter}
          options={propertyOptions}
        />
        <FilterSelect
          label="State"
          value={stateFilter}
          onChange={(v) => setStateFilter(v as 'ALL' | 'PUBLISHED' | 'DRAFT')}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'DRAFT', label: 'Drafts' },
          ]}
        />
        <span className="ml-auto text-[12px] font-semibold text-ink-mute">
          {filtered.length} of {ownAnnouncements.length} · demo data
        </span>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Megaphone size={40} strokeWidth={1.4} />}
            title={ownAnnouncements.length === 0 ? 'No announcements yet' : 'No announcements found'}
            description={
              ownAnnouncements.length === 0
                ? 'Create your first notice for your students (demo).'
                : 'No demo announcements match the current search or filters.'
            }
            action={
              ownAnnouncements.length === 0 ? (
                <Button variant="gold" size="md" onClick={openCreate}>
                  <Plus size={16} /> New announcement
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setQuery('')
                    setPropertyFilter('ALL')
                    setStateFilter('ALL')
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((a) => {
            const expired = a.expiresOn !== '' && a.expiresOn < COMM_TODAY
            return (
              <li
                key={a.id}
                className={cn(
                  'rounded-3xl border bg-white p-5 shadow-card transition hover:shadow-card-hover',
                  a.published ? 'border-line' : 'border-dashed border-gold/50 bg-ivory/40',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                        {a.id}
                      </span>
                      <StatusBadge status={a.published ? 'PUBLISHED' : 'DRAFT'} />
                      <StatusBadge status={a.priority} />
                      {expired && <StatusBadge status="EXPIRED" />}
                      <span className="rounded-full border border-line bg-ivory px-2.5 py-0.5 text-[10.5px] font-bold text-ink-soft">
                        {ANNOUNCEMENT_CATEGORY_LABELS[a.category]}
                      </span>
                    </div>

                    <h3 className="mt-2 text-[15px] font-semibold text-ink">{a.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                      {a.message}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} /> Published {fmtDate(a.publishedOn)}
                      </span>
                      <span>
                        {a.expiresOn
                          ? `Expires ${fmtDate(a.expiresOn)}`
                          : 'No expiry'}
                      </span>
                      <span>
                        Audience:{' '}
                        {a.audience === 'ALL'
                          ? 'All students'
                          : `${a.audienceStudentIds.length} selected`}
                      </span>
                      <span>{commPropertyName(a.propertyId)}</span>
                      <span>{a.readBy.length} read</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setAudienceFor(a)}>
                      <Eye size={14} /> Audience
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                      <PencilLine size={14} /> Edit
                    </Button>
                    <Button variant={a.published ? 'light' : 'gold'} size="sm" onClick={() => togglePublish(a)}>
                      {a.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRemoving(a)}>
                      <Trash2 size={14} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* create / edit modal */}
      <Modal
        open={formOpen}
        title={editingId ? 'Edit announcement' : 'New announcement'}
        subtitle="Only published notices are visible to students of the selected audience (demo)."
        onClose={() => setFormOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="light" size="md" onClick={() => save(false)} disabled={saving}>
              Save draft
            </Button>
            <Button variant="gold" size="md" onClick={() => save(true)} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save & publish' : 'Publish'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="ann-property"
            label="Property"
            required
            value={form.propertyId}
            onChange={(v) =>
              setForm((f) => ({ ...f, propertyId: v, audienceStudentIds: [] }))
            }
            options={scopedPropertyIds.map((id) => ({ value: id, label: commPropertyName(id) }))}
            error={errors.propertyId}
          />
          <FormSelect
            id="ann-category"
            label="Category"
            required
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v as AnnouncementCategory }))}
            options={(Object.keys(ANNOUNCEMENT_CATEGORY_LABELS) as AnnouncementCategory[]).map(
              (value) => ({ value, label: ANNOUNCEMENT_CATEGORY_LABELS[value] }),
            )}
          />
        </div>

        <div className="mt-4">
          <FormInput
            id="ann-title"
            label="Title"
            required
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="e.g. Water tank cleaning on Saturday"
            error={errors.title}
            hint={`${form.title.length}/90 characters`}
          />
        </div>

        <div className="mt-4">
          <FormTextarea
            id="ann-message"
            label="Message"
            required
            rows={4}
            maxLength={600}
            value={form.message}
            onChange={(v) => setForm((f) => ({ ...f, message: v }))}
            placeholder="Write the notice students will read (demo)…"
            error={errors.message}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <FormSelect
            id="ann-priority"
            label="Priority"
            required
            value={form.priority}
            onChange={(v) => setForm((f) => ({ ...f, priority: v as AnnouncementPriority }))}
            options={(Object.keys(ANNOUNCEMENT_PRIORITY_LABELS) as AnnouncementPriority[]).map(
              (value) => ({ value, label: ANNOUNCEMENT_PRIORITY_LABELS[value] }),
            )}
          />
          <FormInput
            id="ann-published"
            label="Publish date"
            type="date"
            required
            value={form.publishedOn}
            onChange={(v) => setForm((f) => ({ ...f, publishedOn: v }))}
            error={errors.publishedOn}
          />
          <FormInput
            id="ann-expires"
            label="Expiry (optional)"
            type="date"
            value={form.expiresOn}
            onChange={(v) => setForm((f) => ({ ...f, expiresOn: v }))}
            error={errors.expiresOn}
            hint="Blank = never expires"
          />
        </div>

        {/* audience */}
        <fieldset className="mt-5 rounded-3xl border border-line bg-ivory/40 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
            Audience
          </legend>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['ALL', 'All students of this PG'],
                ['SELECTED', 'Selected students only'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, audience: value }))}
                className={cn(
                  'rounded-full border px-4 py-2 text-[12.5px] font-bold transition-all',
                  form.audience === value
                    ? 'border-forest bg-forest text-ivory'
                    : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {form.audience === 'SELECTED' && (
            <div className="mt-3">
              <p className="text-[12px] text-muted">
                Students of {commPropertyName(form.propertyId)} — pick who receives this notice.
              </p>
              <ul className="mt-2 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                {propertyStudents.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2 text-[13px] transition hover:border-gold/60">
                      <input
                        type="checkbox"
                        checked={form.audienceStudentIds.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="accent-gold"
                      />
                      <span className="truncate text-ink">{s.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {errors.audienceStudentIds && (
                <p role="alert" className="mt-1.5 text-[11.5px] font-semibold text-danger">
                  {errors.audienceStudentIds}
                </p>
              )}
            </div>
          )}
        </fieldset>
      </Modal>

      {/* audience viewer */}
      <Modal
        open={Boolean(audienceFor)}
        title="Announcement audience"
        subtitle={audienceFor ? `${audienceFor.id} · ${audienceFor.title}` : ''}
        onClose={() => setAudienceFor(null)}
        size="md"
        footer={
          <Button variant="outline" size="md" onClick={() => setAudienceFor(null)}>
            Close
          </Button>
        }
      >
        {audienceFor && (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Reach" value={audienceFor.audience === 'ALL' ? 'All' : audienceFor.audienceStudentIds.length} tone="forest" />
              <MiniStat label="Read" value={audienceFor.readBy.length} tone="gold" />
              <MiniStat label="State" value={audienceFor.published ? 'Published' : 'Draft'} tone="ink" />
              <MiniStat label="Property" value={audienceFor.propertyId === 'pg-001' ? 'Shree Shyam' : 'Ashiana'} tone="ink" />
            </div>

            <h4 className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
              {audienceFor.audience === 'ALL'
                ? `Every active student of ${commPropertyName(audienceFor.propertyId)}`
                : 'Selected students'}
            </h4>

            <ul className="mt-2.5 space-y-2">
              {(audienceFor.audience === 'ALL'
                ? students
                    .filter(
                      (s) =>
                        s.propertyId === audienceFor.propertyId &&
                        s.membership === 'ACTIVE',
                    )
                    .map((s) => ({ id: s.id, name: s.name }))
                : audienceFor.audienceStudentIds.map((id) => ({
                    id,
                    name: students.find((s) => s.id === id)?.name ?? id,
                  }))
              ).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-ivory/40 px-3.5 py-2.5 text-[13px]"
                >
                  <span className="font-medium text-ink">{s.name}</span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider',
                      audienceFor.readBy.includes(s.id)
                        ? 'bg-forest-soft text-forest'
                        : 'bg-ivory-deep/60 text-ink-mute',
                    )}
                  >
                    {audienceFor.readBy.includes(s.id) ? 'Read' : 'Unread'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">
              Read state is simulated locally — no real notification was delivered (demo).
            </p>
          </div>
        )}
      </Modal>

      {/* delete confirm */}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete announcement?"
        message={
          removing
            ? `“${removing.title}” will be permanently removed for everyone (demo). This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onCancel={() => setRemoving(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'forest' | 'gold' | 'ink'
}) {
  const tones = {
    forest: 'bg-forest-soft text-forest',
    gold: 'bg-gold-soft text-gold-dark',
    ink: 'bg-ivory text-ink',
  }
  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight ${tones[tone]}`}>{value}</p>
    </div>
  )
}
