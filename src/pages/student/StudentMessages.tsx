import { useEffect, useMemo } from 'react'
import { Building2, Mail, MessageSquare, Phone } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useCommunicationStore } from '../../context/CommunicationStore'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DemoBanner } from '../../components/admin/DemoBanner'
import { StatCard } from '../../components/admin/StatCard'
import { EmptyState } from '../../components/common/EmptyState'
import { ChatPanel } from '../../components/communication/ChatPanel'
import { Avatar } from '../../components/ui/Avatar'
import { COMM_TODAY, DEMO_STUDENT_ID, commPropertyName } from '../../data/communicationData'
import { dayLabel, fmtDate } from '../../types/communication'
import type { Conversation } from '../../types/communication'

/**
 * /student/messages — the student's single private thread with their PG
 * owner. Students can never see other students' threads, group chats or
 * student-to-student messaging (by design — demo scope).
 */
export function StudentMessages() {
  useDocumentTitle('Messages')

  const { conversations, messages, sendMessage, markConversationRead, pushToast } =
    useCommunicationStore()

  const studentId = DEMO_STUDENT_ID
  const conversation: Conversation | null =
    conversations.find((c) => c.studentId === studentId) ?? null

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

  const ownerName = 'Rakesh Sharma (PG Owner)'

  return (
    <div>
      <AdminPageHeader
        title="Messages"
        description="Your private chat with the PG owner of your accommodation — demo messages only, nothing is sent over the internet."
        actions={
          <span className="rounded-full border border-line bg-white px-4 py-2 text-[12px] font-bold text-ink-soft">
            {threadMessages.length} messages · demo data
          </span>
        }
      />
      <DemoBanner message="this thread is a scripted sample conversation for interface demonstration — the owner never receives your message." />

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Unread from owner"
          value={unread}
          icon={MessageSquare}
          tone={unread > 0 ? 'gold' : 'forest'}
          hint="New replies waiting"
        />
        <StatCard
          label="Last message"
          value={conversation ? dayLabel(conversation.lastMessageOn, COMM_TODAY) : '—'}
          icon={Mail}
          hint={conversation ? `at ${conversation.lastMessageAt}` : 'No messages yet'}
        />
        <StatCard
          label="Your PG"
          value={conversation ? `Room ${conversation.roomNumber}` : '—'}
          icon={Building2}
          hint={conversation ? commPropertyName(conversation.propertyId) : 'Not allocated'}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* owner card */}
        <aside className="h-fit rounded-3xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={ownerName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{ownerName}</p>
              <p className="text-[12px] text-muted">PG Owner · demo account</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Property</dt>
              <dd className="text-right font-medium text-ink">
                {conversation ? commPropertyName(conversation.propertyId) : '—'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Room</dt>
              <dd className="font-medium text-ink">
                {conversation ? conversation.roomNumber : '—'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Mobile</dt>
              <dd className="font-medium text-ink">98765 43001 (demo)</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Email</dt>
              <dd className="truncate font-medium text-ink">owner@rahomitra.demo</dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <a
              href="tel:+919876543001"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest/25 bg-white px-3 py-2 text-[12px] font-semibold text-forest transition hover:bg-forest hover:text-ivory"
            >
              <Phone size={13} /> Call
            </a>
            <a
              href="mailto:owner@rahomitra.demo"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-forest/25 bg-white px-3 py-2 text-[12px] font-semibold text-forest transition hover:bg-forest hover:text-ivory"
            >
              <Mail size={13} /> Email
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Contact details are fictional demo values (98765 …, @rahomitra.demo).
          </p>
        </aside>

        {/* chat */}
        <div className="h-[34rem]">
          {conversation ? (
            <ChatPanel
              conversation={conversation}
              messages={threadMessages}
              viewer="STUDENT"
              counterpartName={ownerName}
              counterpartMeta={`${commPropertyName(conversation.propertyId)} · Room ${conversation.roomNumber}`}
              onSend={(text) => {
                sendMessage(conversation.id, 'STUDENT', 'Rahul Sharma (demo)', text)
                pushToast('Message added to the demo thread (nothing was sent).', 'info')
              }}
              onClose={() => undefined}
              today={COMM_TODAY}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border border-line bg-white shadow-card">
              <EmptyState
                icon={<MessageSquare size={40} strokeWidth={1.4} />}
                title="No conversation yet"
                description="Once your PG owner starts a chat with you, the thread will appear here (demo)."
              />
            </div>
          )}
        </div>
      </div>

      {threadMessages.length > 0 && (
        <p className="mt-4 text-[11.5px] text-muted">
          Conversation started {fmtDate(threadMessages[0].date)} · demo history, reloaded on refresh.
        </p>
      )}
    </div>
  )
}
