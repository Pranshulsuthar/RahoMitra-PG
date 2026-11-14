import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  MessageSquare,
  Send,
  Timer,
} from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useOwnerStore } from '../../context/OwnerStore'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { FilterSelect } from '../../components/admin/Filters'
import { StatCard } from '../../components/admin/StatCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { ButtonLink } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ConversationList } from '../../components/communication/ConversationList'
import { ChatPanel } from '../../components/communication/ChatPanel'
import { cn } from '../../utils/cn'
import { COMM_TODAY } from '../../data/communicationData'
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  PRIORITY_LABELS,
  fmtDate,
} from '../../types/communication'
import type { Complaint } from '../../types/communication'

type TabId = 'MESSAGES' | 'COMPLAINTS'

/**
 * /owner/communication — Section 07 overview: private student conversations
 * plus a complaints snapshot. Owners only ever see threads and tickets that
 * belong to their own properties (demo scoping).
 */
export function OwnerCommunication() {
  useDocumentTitle('Communication')

  const { scopedPropertyIds } = useOwnerStore()
  const {
    conversations,
    messages,
    complaints,
    sendMessage,
    markConversationRead,
  } = useCommunicationStore()

  const [tab, setTab] = useState<TabId>('MESSAGES')
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [readFilter, setReadFilter] = useState('ALL')
  const [activeId, setActiveId] = useState<string | null>(null)

  /* ------------------------------------------------------------ scoping */
  const ownConversations = useMemo(
    () => conversations.filter((c) => scopedPropertyIds.includes(c.propertyId)),
    [conversations, scopedPropertyIds],
  )
  const ownComplaints = useMemo(
    () => complaints.filter((c) => scopedPropertyIds.includes(c.propertyId)),
    [complaints, scopedPropertyIds],
  )

  const propertyScoped = useMemo(
    () =>
      propertyFilter === 'ALL'
        ? ownConversations
        : ownConversations.filter((c) => c.propertyId === propertyFilter),
    [ownConversations, propertyFilter],
  )

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase()
    return propertyScoped.filter((c) => {
      if (readFilter === 'UNREAD' && (c.ownerUnread === 0)) return false
      if (readFilter === 'READ' && c.ownerUnread > 0) return false
      if (
        q &&
        !`${c.studentName} ${c.roomNumber}`.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [propertyScoped, query, readFilter])

  /* selection auto-pick */
  useEffect(() => {
    if (filteredConversations.length === 0) {
      setActiveId(null)
      return
    }
    if (!filteredConversations.some((c) => c.id === activeId)) {
      setActiveId(filteredConversations[0].id)
    }
  }, [filteredConversations, activeId])

  const active = conversations.find((c) => c.id === activeId) ?? null

  /* mark read when a thread is opened */
  useEffect(() => {
    if (active && active.ownerUnread > 0) {
      markConversationRead(active.id, 'OWNER')
    }
  }, [active, markConversationRead])

  const activeMessages = useMemo(
    () => messages.filter((m) => m.conversationId === activeId),
    [messages, activeId],
  )

  const previewFor = (conversationId: string) => {
    const list = messages.filter((m) => m.conversationId === conversationId)
    return list[list.length - 1]?.text ?? 'No messages yet'
  }

  /* -------------------------------------------------------------- stats */
  const unreadMessages = ownConversations.reduce((n, c) => n + c.ownerUnread, 0)
  const openComplaints = ownComplaints.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED',
  ).length
  const resolvedComplaints = ownComplaints.filter((c) => c.status === 'RESOLVED').length
  const pendingComplaints = ownComplaints.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW',
  ).length

  const propertyOptions = [
    { value: 'ALL', label: 'All my properties' },
    ...scopedPropertyIds.map((id) => ({
      value: id,
      label: id === 'pg-001' ? 'Shree Shyam Boys PG' : 'Ashiana PG',
    })),
  ]

  const recentComplaints = [...ownComplaints]
    .sort((a, b) => (a.submittedOn < b.submittedOn ? 1 : -1))
    .slice(0, 5)

  return (
    <div>
      <AdminPageHeader
        title="Communication"
        description="Private one-to-one chats with your students and a live snapshot of their complaints — demo data only."
        actions={
          <ButtonLink to="/owner/complaints" variant="outline" size="md">
            Open complaints <ArrowUpRight size={15} />
          </ButtonLink>
        }
      />
      <DemoBanner message="conversations, messages and complaints below are illustrative samples — nothing here is delivered to a real device." />

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Conversations"
          value={ownConversations.length}
          icon={MessageSquare}
          hint="Private student threads"
        />
        <StatCard
          label="Unread Messages"
          value={unreadMessages}
          icon={Send}
          tone={unreadMessages > 0 ? 'gold' : 'forest'}
          hint="Waiting for your reply"
        />
        <StatCard
          label="Open Complaints"
          value={openComplaints}
          icon={Inbox}
          tone="danger"
          hint="Not yet resolved"
        />
        <StatCard
          label="Resolved"
          value={resolvedComplaints}
          icon={CheckCircle2}
          hint="Closed successfully"
        />
        <StatCard
          label="Pending"
          value={pendingComplaints}
          icon={Timer}
          tone="gold"
          hint="Submitted / under review"
        />
      </div>

      {/* tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Communication views" className="flex gap-2">
          {(
            [
              ['MESSAGES', `Messages (${ownConversations.length})`],
              ['COMPLAINTS', `Complaints (${ownComplaints.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'rounded-full border px-5 py-2 text-[13px] font-bold transition-all',
                tab === id
                  ? 'border-forest bg-forest text-ivory'
                  : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'MESSAGES' && (
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <FilterSelect
              label="Property"
              value={propertyFilter}
              onChange={setPropertyFilter}
              options={propertyOptions}
            />
          </div>
        )}
      </div>

      {tab === 'MESSAGES' ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="h-[34rem]">
            <ConversationList
              conversations={filteredConversations}
              activeId={activeId}
              onSelect={setActiveId}
              search={query}
              onSearch={setQuery}
              filter={readFilter}
              onFilter={setReadFilter}
              filterOptions={[
                { value: 'ALL', label: 'All chats' },
                { value: 'UNREAD', label: 'Unread only' },
                { value: 'READ', label: 'Read only' },
              ]}
              viewer="OWNER"
              today={COMM_TODAY}
              previewFor={previewFor}
              emptyTitle="No conversations found"
              emptyDescription="No demo threads match this search or filter."
            />
          </div>

          <div className="h-[34rem]">
            <ChatPanel
              conversation={active}
              messages={activeMessages}
              viewer="OWNER"
              counterpartName={active?.studentName ?? ''}
              counterpartMeta={
                active
                  ? `Room ${active.roomNumber} · ${
                      active.propertyId === 'pg-001'
                        ? 'Shree Shyam Boys PG'
                        : 'Ashiana PG'
                    }`
                  : ''
              }
              onSend={(text) => active && sendMessage(active.id, 'OWNER', 'Rakesh Sharma (PG Owner)', text)}
              onClose={() => setActiveId(null)}
              today={COMM_TODAY}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {recentComplaints.length === 0 ? (
            <EmptyState
              icon={<Inbox size={40} strokeWidth={1.4} />}
              title="No complaints yet"
              description="Complaints submitted by your students will appear here (demo)."
            />
          ) : (
            <ul className="space-y-3">
              {recentComplaints.map((c) => (
                <ComplaintRow key={c.id} complaint={c} />
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-end">
            <ButtonLink to="/owner/complaints" variant="gold" size="md">
              View all complaints <ArrowUpRight size={15} />
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  )
}

/** Compact complaint row used in the overview tab. */
function ComplaintRow({ complaint }: { complaint: Complaint }) {
  return (
    <li className="rounded-3xl border border-line bg-white p-4 shadow-card transition hover:shadow-card-hover">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              {complaint.id}
            </span>
            <StatusBadge status={complaint.status} />
            <StatusBadge status={complaint.priority} />
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-ink">{complaint.subject}</p>
          <p className="mt-1 text-[12.5px] text-muted">
            {complaint.studentName} · Room {complaint.roomNumber} ·{' '}
            {COMPLAINT_CATEGORY_LABELS[complaint.category]} · {fmtDate(complaint.submittedOn)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11.5px] text-muted sm:inline">
            {PRIORITY_LABELS[complaint.priority]} priority
          </span>
          <ButtonLink to="/owner/complaints" variant="outline" size="sm">
            Review
          </ButtonLink>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">
        {complaint.description}
      </p>
      <p className="mt-2 text-[11px] text-muted">
        Status: {COMPLAINT_STATUS_LABELS[complaint.status]} · demo record
      </p>
    </li>
  )
}
