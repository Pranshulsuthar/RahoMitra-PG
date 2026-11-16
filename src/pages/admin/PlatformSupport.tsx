import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Eye, LifeBuoy, Send, UserCheck } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdminStore } from '../../context/AdminStore'
import type { PlatformTicket, PlatformTicketCategory, PlatformTicketStatus, TicketPriority } from '../../types/admin'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatCard } from '../../components/admin/StatCard'
import { DataTable } from '../../components/admin/DataTable'
import type { Column } from '../../components/admin/DataTable'
import { FilterSelect, SearchInput } from '../../components/admin/Filters'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { Modal } from '../../components/admin/Modal'
import { EmptyState } from '../../components/common/EmptyState'

const CATEGORIES: PlatformTicketCategory[] = [
  'Owner Account',
  'Subscription',
  'PG Listing',
  'Student Account',
  'Billing',
  'Technical Issue',
  'Other',
]

const STATUSES: PlatformTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']

/** /admin/platform-support — centralised platform support console. */
export function PlatformSupport() {
  useDocumentTitle('Platform Support')

  const {
    platformTickets,
    supportStaff,
    assignPlatformTicket,
    setPlatformTicketPriority,
    addPlatformTicketReply,
    setPlatformTicketStatus,
    pushToast,
  } = useAdminStore()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | PlatformTicketStatus>('ALL')
  const [category, setCategory] = useState<'ALL' | PlatformTicketCategory>('ALL')
  const [priority, setPriority] = useState<'ALL' | TicketPriority>('ALL')
  const [detail, setDetail] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)

  const liveDetail = detail ? platformTickets.find((t) => t.id === detail) ?? null : null

  const counts = useMemo(() => {
    const open = platformTickets.filter((t) => t.status === 'OPEN').length
    const inProgress = platformTickets.filter((t) => t.status === 'IN_PROGRESS').length
    const resolved = platformTickets.filter((t) => t.status === 'RESOLVED').length
    const urgent = platformTickets.filter((t) => t.priority === 'URGENT').length
    return { total: platformTickets.length, open, inProgress, resolved, urgent }
  }, [platformTickets])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return platformTickets
      .filter(
        (t) =>
          (!q ||
            t.subject.toLowerCase().includes(q) ||
            t.submittedBy.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q)) &&
          (status === 'ALL' || t.status === status) &&
          (category === 'ALL' || t.category === category) &&
          (priority === 'ALL' || t.priority === priority),
      )
      .sort((a, b) => b.createdOn.localeCompare(a.createdOn))
  }, [platformTickets, search, status, category, priority])

  const submitReply = (event: FormEvent) => {
    event.preventDefault()
    if (!liveDetail) return
    if (reply.trim().length < 5) {
      setReplyError('Write at least 5 characters before sending the response.')
      return
    }
    addPlatformTicketReply(liveDetail.id, reply.trim(), 'Admin')
    setReply('')
    setReplyError(null)
    pushToast(`Response added to ${liveDetail.id}.`)
  }

  const columns: Array<Column<PlatformTicket>> = [
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
      key: 'submitted',
      header: 'Submitted By',
      sortValue: (t) => t.submittedBy,
      render: (t) => (
        <div>
          <span className="block whitespace-nowrap">{t.submittedBy}</span>
          <span className="block text-[11px] text-ink-mute">{t.userRole}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (t) => t.category,
      render: (t) => (
        <span className="whitespace-nowrap rounded-full border border-line bg-ivory px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
          {t.category}
        </span>
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
      key: 'assigned',
      header: 'Assigned To',
      sortValue: (t) => t.assignedTo ?? 'Unassigned',
      render: (t) => (
        <span className="whitespace-nowrap text-[12.5px] text-ink-soft">{t.assignedTo ?? '—'}</span>
      ),
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
          onClick={() => setDetail(t.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-white px-3.5 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          Open
        </button>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Platform Support"
        description="Centralised support dashboard for platform-level tickets — separate from PG-level student complaints. Assign staff, change priority, respond and resolve."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft">
            <LifeBuoy className="h-4 w-4 text-forest" aria-hidden />
            {counts.total} total tickets
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Support Tickets" value={counts.total} icon={LifeBuoy} hint="Total tickets" />
        <StatCard label="Open Tickets" value={counts.open} icon={LifeBuoy} tone="danger" hint="Awaiting action" />
        <StatCard label="In Progress" value={counts.inProgress} icon={LifeBuoy} tone="gold" hint="Being handled" />
        <StatCard label="Resolved Tickets" value={counts.resolved} icon={CheckCircle2} tone="forest" hint="Closed happily" />
        <StatCard label="Urgent Tickets" value={counts.urgent} icon={LifeBuoy} tone="danger" hint="URGENT priority" />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          pageSize={8}
          emptyTitle="No tickets match"
          emptyDescription="Adjust the search or the status, category and priority filters."
          toolbar={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <SearchInput value={search} onChange={setSearch} placeholder="Search tickets…" />
              <div className="flex flex-wrap items-center gap-3">
                <FilterSelect
                  label="Category"
                  value={category}
                  onChange={(value) => setCategory(value as 'ALL' | PlatformTicketCategory)}
                  options={[
                    { value: 'ALL', label: 'All categories' },
                    ...CATEGORIES.map((c) => ({ value: c, label: c })),
                  ]}
                />
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
                  onChange={(value) => setStatus(value as 'ALL' | PlatformTicketStatus)}
                  options={[
                    { value: 'ALL', label: 'All statuses' },
                    ...STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
                  ]}
                />
              </div>
            </div>
          }
        />
      </div>

      {/* ------------------------------------------------------ detail modal */}
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
              <span className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-bold text-ink-soft">
                {liveDetail.userRole}
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-ivory/40 p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{liveDetail.description}</p>
              <p className="mt-3 text-[12px] text-ink-mute">
                Submitted by {liveDetail.submittedBy} ({liveDetail.userRole}) on {liveDetail.createdOn}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Assign to staff member
                </h3>
                <select
                  className="form-input"
                  value={liveDetail.assignedTo ?? ''}
                  onChange={(event) => {
                    assignPlatformTicket(liveDetail.id, event.target.value || null)
                    pushToast(
                      event.target.value
                        ? `${liveDetail.id} assigned to ${event.target.value}.`
                        : `${liveDetail.id} unassigned.`,
                      'info',
                    )
                  }}
                >
                  <option value="">Unassigned</option>
                  {supportStaff.map((staff) => (
                    <option key={staff} value={staff}>
                      {staff}
                    </option>
                  ))}
                </select>
                {liveDetail.assignedTo && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-forest">
                    <UserCheck className="h-3.5 w-3.5" aria-hidden />
                    Currently: {liveDetail.assignedTo}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Change priority
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setPlatformTicketPriority(liveDetail.id, option)
                        pushToast(`${liveDetail.id} priority set to ${option}.`, 'info')
                      }}
                      className={
                        liveDetail.priority === option
                          ? 'rounded-full bg-forest px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ivory'
                          : 'rounded-full border border-line bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft transition-colors hover:border-forest hover:text-forest'
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Change status
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setPlatformTicketStatus(liveDetail.id, option)
                      pushToast(`${liveDetail.id} marked ${option.replace('_', ' ')}.`, 'info')
                    }}
                    className={
                      liveDetail.status === option
                        ? 'rounded-full bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivory'
                        : 'rounded-full border border-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-soft transition-colors hover:border-forest hover:text-forest'
                    }
                  >
                    {option.replace('_', ' ')}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPlatformTicketStatus(liveDetail.id, 'RESOLVED')
                    pushToast(`${liveDetail.id} marked resolved.`)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivory transition-colors hover:bg-forest-light"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Mark resolved
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 text-sm font-bold uppercase tracking-[0.12em] text-ink-soft">
                Conversation history ({liveDetail.replies.length})
              </h3>
              {liveDetail.replies.length === 0 ? (
                <EmptyState
                  title="No conversation yet"
                  description="Add the first response below."
                  icon={<LifeBuoy className="h-6 w-6" aria-hidden />}
                />
              ) : (
                <ul className="mb-4 space-y-2.5">
                  {liveDetail.replies.map((item) => (
                    <li
                      key={item.id}
                      className={
                        item.role === 'Admin'
                          ? 'rounded-2xl border border-forest/25 bg-forest-soft px-4 py-3'
                          : 'rounded-2xl border border-line bg-white px-4 py-3'
                      }
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-ink">{item.author}</span>
                        <span className="text-[11px] text-ink-mute">
                          {item.role} · {item.on}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={submitReply} noValidate>
                <label htmlFor="platform-reply" className="form-label">
                  Add response
                </label>
                <textarea
                  id="platform-reply"
                  rows={3}
                  maxLength={500}
                  value={reply}
                  placeholder="Write a response to the user…"
                  onChange={(event) => {
                    setReply(event.target.value)
                    setReplyError(null)
                  }}
                  aria-invalid={replyError ? 'true' : undefined}
                  className="form-input resize-y"
                />
                {replyError && (
                  <span className="form-error" role="alert">
                    {replyError}
                  </span>
                )}
                <button
                  type="submit"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Send response
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
