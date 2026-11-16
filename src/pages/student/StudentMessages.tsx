import { useEffect, useMemo, useState } from 'react'
import { Building2, Mail, MessageSquare, Phone } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuth } from '../../context/AuthContext'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { fetchStudentAccommodation, type StudentAccommodation } from '../../api/student'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatCard } from '../../components/admin/StatCard'
import { EmptyState } from '../../components/common/EmptyState'
import { ChatPanel } from '../../components/communication/ChatPanel'
import { Avatar } from '../../components/ui/Avatar'
import { dayLabel, fmtDate } from '../../types/communication'
import type { Conversation } from '../../types/communication'

/**
 * /student/messages — the student's private thread with their PG owner.
 */
export function StudentMessages() {
  useDocumentTitle('Messages')

  const { user } = useAuth()
  const currentStudentId = user?.id || ''
  const studentName = user?.name || 'Student'
  const todayIso = new Date().toISOString().slice(0, 10)

  const { conversations, messages, sendMessage, markConversationRead, pushToast } =
    useCommunicationStore()

  const [liveAccommodation, setLiveAccommodation] = useState<StudentAccommodation | null>(null)

  useEffect(() => {
    fetchStudentAccommodation()
      .then((acc) => setLiveAccommodation(acc))
      .catch(() => setLiveAccommodation(null))
  }, [])

  const conversation: Conversation | null =
    conversations.find((c) => currentStudentId && c.studentId === currentStudentId) ?? null

  const threadMessages = useMemo(
    () => messages.filter((m) => m.conversationId === conversation?.id),
    [messages, conversation],
  )

  const unread = conversation?.studentUnread ?? 0

  useEffect(() => {
    if (conversation && conversation.studentUnread > 0) {
      markConversationRead(conversation.id, 'STUDENT')
    }
  }, [conversation, markConversationRead])

  const propertyName = liveAccommodation?.property.name || (conversation ? 'PG Accommodation' : 'Not enrolled')
  const ownerName = liveAccommodation?.property.ownerName || 'PG Management'
  const ownerPhone = liveAccommodation?.property.contactPhone || ''
  const ownerEmail = liveAccommodation?.property.contactEmail || ''

  return (
    <div>
      <AdminPageHeader
        title="Messages"
        description="Your direct 1:1 message thread with your PG management."
        actions={
          <span className="rounded-full border border-line bg-white px-4 py-2 text-[12px] font-bold text-ink-soft">
            {threadMessages.length} messages
          </span>
        }
      />

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Unread from owner"
          value={unread}
          icon={MessageSquare}
          tone={unread > 0 ? 'gold' : 'forest'}
          hint="New replies"
        />
        <StatCard
          label="Last message"
          value={conversation ? dayLabel(conversation.lastMessageOn, todayIso) : '—'}
          icon={Mail}
          hint={conversation ? `at ${conversation.lastMessageAt}` : 'No messages yet'}
        />
        <StatCard
          label="Your Accommodation"
          value={liveAccommodation ? `Room ${liveAccommodation.room.roomNumber}` : '—'}
          icon={Building2}
          hint={propertyName}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* owner card */}
        <aside className="h-fit rounded-3xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={ownerName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{ownerName}</p>
              <p className="text-[12px] text-muted">PG Management</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Property</dt>
              <dd className="text-right font-medium text-ink">
                {propertyName}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Room</dt>
              <dd className="font-medium text-ink">
                {liveAccommodation ? liveAccommodation.room.roomNumber : '—'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium text-ink">{ownerPhone || 'Not provided'}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Email</dt>
              <dd className="truncate font-medium text-ink">{ownerEmail || 'Not provided'}</dd>
            </div>
          </dl>

          {(ownerPhone || ownerEmail) && (
            <div className="mt-4 flex gap-2">
              {ownerPhone && (
                <a
                  href={`tel:${ownerPhone}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest/25 bg-white px-3 py-2 text-[12px] font-semibold text-forest transition hover:bg-forest hover:text-ivory"
                >
                  <Phone size={13} /> Call
                </a>
              )}
              {ownerEmail && (
                <a
                  href={`mailto:${ownerEmail}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest/25 bg-white px-3 py-2 text-[12px] font-semibold text-forest transition hover:bg-forest hover:text-ivory"
                >
                  <Mail size={13} /> Email
                </a>
              )}
            </div>
          )}
        </aside>

        {/* chat */}
        <div className="h-[34rem]">
          {conversation ? (
            <ChatPanel
              conversation={conversation}
              messages={threadMessages}
              viewer="STUDENT"
              counterpartName={ownerName}
              counterpartMeta={`${propertyName} · Room ${conversation.roomNumber}`}
              onSend={(text) => {
                sendMessage(conversation.id, 'STUDENT', studentName, text)
                pushToast('Message sent.', 'info')
              }}
              onClose={() => undefined}
              today={todayIso}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border border-line bg-white shadow-card">
              <EmptyState
                icon={<MessageSquare size={40} strokeWidth={1.4} />}
                title="No conversation yet"
                description="Once a conversation starts between you and your PG manager, messages will appear here."
              />
            </div>
          )}
        </div>
      </div>

      {threadMessages.length > 0 && (
        <p className="mt-4 text-[11.5px] text-muted">
          Conversation started {fmtDate(threadMessages[0].date)}.
        </p>
      )}
    </div>
  )
}
