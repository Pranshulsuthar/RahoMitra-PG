import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, LifeBuoy, Send, StickyNote } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { TicketPriority, TicketStatus, SupportTicket } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { EmptyState } from '../../components/common/EmptyState'

/** /admin/support — platform complaint & support ticket console (demo). */
export function Support() {
  useDocumentTitle('Complaints & Support')

  const { tickets, setTicketStatus, addTicketNote, pushToast } = useAdminStore()

  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<'ALL' | TicketPriority>('ALL')
  const [status, setStatus] = useState<'ALL' | TicketStatus>('ALL')
  const [detail, setDetail] = useState<SupportTicket | null>(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets
      .filter(
        (t) =>
          (!q ||
            t.subject.toLowerCase().includes(q) ||
            t.raisedBy.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q)) &&
          (priority === 'ALL' || t.priority === priority) &&
          (status === 'ALL' || t.status === status),
      )
      .sort((a, b) => b.createdOn.localeCompare(a.createdOn))
  }, [tickets, search, priority, status])

  /* Live copy of the selected ticket so edits appear instantly. */
  const liveDetail = detail ? tickets.find((t) => t.id === detail.id) ?? detail : null

  const changeStatus = (next: TicketStatus) => {
    if (!liveDetail) return
    setTicketStatus(liveDetail.id, next)
    pushToast(`Ticket ${liveDetail.id} marked ${next.replace('_', ' ')} (demo).`, 'info')
  }

  const submitNote = (event: FormEvent) => {
    event.preventDefault()
    if (note.trim().length < 5) {
      setNoteError('Write at least 5 characters before adding the note.')
      return
    }
    addTicketNote(liveDetail!.id, note.trim())
    setNote('')
    setNoteError(null)
    pushToast('Internal note added to the demo ticket.')
  }

  const columns: Array<Column<SupportTicket>> = [
    {
      key: 'subject',
      header: 'Ticket',
      sortValue: (t) => t.subject,
      render: (t) => (
        <div>
          <span className="block font-semibold text-ink">{t.subject}</span>
          <span className="block text-[11.5px] text-ink-mute">
            {t.id} · {t.category}
          </span>
        </div>
      ),
    },
    {
      key: 'raised',
      header: 'Raised By',
      sortValue: (t) => t.raisedBy,
      render: (t) => (
        <div>
          <span className="block whitespace-nowrap">{t.raisedBy}</span>
          <span className="block text-[11px] text-ink-mute">{t.raisedRole}</span>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      sortValue: (t) => t.createdOn,
      render: (t) => <span className="whitespace-nowrap tabular-nums">{t.createdOn}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortValue: (t) => t.priority,
      render: (t) => <StatusBadge status={t.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (t) => t.status,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <button
          type="button"
          onClick={() => setDetail(t)}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          View
        </button>
      ),
    },
  ]

  const statusCounts = useMemo(
    () => ({
      OPEN: tickets.filter((t) => t.status === 'OPEN').length,
      IN_PROGRESS: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      RESOLVED: tickets.filter((t) => t.status === 'RESOLVED').length,
      CLOSED: tickets.filter((t) => t.status === 'CLOSED').length,
    }),
    [tickets],
  )

  return (
    <>
      <AdminPageHeader
        title="Complaints & Support"
        description="Platform-level support tickets raised by demo owners and students. Search, prioritise, add internal notes and update statuses."
        actions={
          <div className="flex flex-wrap gap-2">
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={
                  status === key
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-ivory'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-soft transition-colors hover:border-forest hover:text-forest'
                }
              >
                {key.replace('_', ' ')} · {statusCounts[key]}
              </button>
            ))}
          </div>
        }
      />

      <DemoBanner message="all complaints and internal notes are fictional examples for interface demonstration." />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(t) => t.id}
        pageSize={8}
        emptyTitle="No tickets match"
        emptyDescription="Adjust the search, priority or status filter."
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tickets…" />
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Priority"
                value={priority}
                onChange={(value) => setPriority(value as 'ALL' | TicketPriority)}
                options={[
                  { value: 'ALL', label: 'All priorities' },
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
              <FilterSelect
                label="Status"
                value={status}
                onChange={(value) => setStatus(value as 'ALL' | TicketStatus)}
                options={[
                  { value: 'ALL', label: 'All statuses' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'IN_PROGRESS', label: 'In progress' },
                  { value: 'RESOLVED', label: 'Resolved' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
              />
            </div>
          </div>
        }
      />

      <Modal
        open={liveDetail !== null}
        title={liveDetail?.subject ?? 'Ticket details'}
        subtitle={liveDetail ? `${liveDetail.id} · created ${liveDetail.createdOn}` : undefined}
        onClose={() => setDetail(null)}
        size="lg"
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
              <StatusBadge status={liveDetail.priority} />
              <span className="rounded-full border border-line bg-ivory px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                {liveDetail.category}
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-ivory/40 p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Complaint details
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{liveDetail.description}</p>
              <p className="mt-3 text-[12px] text-ink-mute">
                Raised by {liveDetail.raisedBy} ({liveDetail.raisedRole}) on {liveDetail.createdOn}
              </p>
            </div>

            <div>
              <h3 className="mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Update status
              </h3>
              <div className="flex flex-wrap gap-2">
                {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => changeStatus(option)}
                    className={
                      liveDetail.status === option
                        ? 'rounded-full bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivory'
                        : 'rounded-full border border-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-soft transition-colors hover:border-forest hover:text-forest'
                    }
                  >
                    {option.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                <StickyNote className="h-4 w-4 text-gold-dark" aria-hidden />
                Internal notes ({liveDetail.notes.length})
              </h3>
              {liveDetail.notes.length === 0 ? (
                <EmptyState
                  title="No internal notes yet"
                  description="Add the first internal note below — it stays in this demo session only."
                  icon={<LifeBuoy className="h-6 w-6" aria-hidden />}
                />
              ) : (
                <ul className="mb-4 space-y-2.5">
                  {liveDetail.notes.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink-soft"
                    >
                      {item.text}
                      <span className="mt-1.5 block text-[11px] text-ink-mute">Added {item.on}</span>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={submitNote} noValidate>
                <label htmlFor="ticket-note" className="form-label">
                  Add internal note
                </label>
                <textarea
                  id="ticket-note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  placeholder="Notes are visible only to admins (demo)…"
                  onChange={(event) => {
                    setNote(event.target.value)
                    setNoteError(null)
                  }}
                  aria-invalid={noteError ? 'true' : undefined}
                  className="form-input resize-y"
                />
                {noteError && (
                  <span className="form-error" role="alert">
                    {noteError}
                  </span>
                )}
                <button
                  type="submit"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Add note
                </button>
              </form>
            </div>

            <p className="rounded-2xl border border-dashed border-gold/60 bg-gold-soft/50 px-4 py-3 text-[12px] leading-relaxed text-gold-dark">
              Frontend demo — notes and status changes are held in memory and disappear on reload.
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
