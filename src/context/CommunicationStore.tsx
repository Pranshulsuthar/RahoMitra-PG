import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  COMM_TODAY,
  SEED_COMM_NOTIFICATIONS,
  SEED_COMPLAINTS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_ANNOUNCEMENTS,
} from '../data/communicationData'
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  ChatMessage,
  CommNotification,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Conversation,
} from '../types/communication'
import { COMPLAINT_STATUS_LABELS } from '../types/communication'
import { ToastStack } from '../components/common/ToastStack'
import type { ToastItem } from '../components/common/ToastStack'

/**
 * ---------------------------------------------------------------------------
 * SECTION 07 — single in-memory demo store for Communication & Complaints.
 * Shared by the owner console and the student portal so a message sent by the
 * student instantly appears for the owner (and vice versa), and every status
 * change the owner makes is reflected on the student's complaint screen.
 * Every mutation is local React state only — reload to restore the seeds.
 * ---------------------------------------------------------------------------
 */

export interface ComplaintSubmitInput {
  propertyId: string
  studentId: string
  category: ComplaintCategory
  subject: string
  description: string
  priority: ComplaintPriority
  image: string
}

export interface AnnouncementInput {
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

interface CommunicationStoreValue {
  /* messaging */
  conversations: Conversation[]
  messages: ChatMessage[]
  sendMessage: (
    conversationId: string,
    sender: 'OWNER' | 'STUDENT',
    senderName: string,
    text: string,
  ) => void
  markConversationRead: (conversationId: string, viewer: 'OWNER' | 'STUDENT') => void

  /* complaints */
  complaints: Complaint[]
  submitComplaint: (input: ComplaintSubmitInput) => Complaint
  addComplaintComment: (
    complaintId: string,
    actor: 'OWNER' | 'STUDENT',
    actorName: string,
    body: string,
    title: string,
  ) => void
  updateComplaintStatus: (
    complaintId: string,
    status: ComplaintStatus,
    note: string,
  ) => void
  setComplaintPriority: (complaintId: string, priority: ComplaintPriority) => void

  /* announcements */
  announcements: Announcement[]
  saveAnnouncement: (id: string | null, input: AnnouncementInput, publish: boolean) => string
  toggleAnnouncementPublished: (id: string) => void
  deleteAnnouncement: (id: string) => void
  markAnnouncementRead: (id: string, studentId: string) => void

  /* notifications */
  notifications: CommNotification[]
  roleNotifications: (role: 'OWNER' | 'STUDENT', studentId?: string) => CommNotification[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (role: 'OWNER' | 'STUDENT', studentId?: string) => void
  clearNotification: (id: string) => void

  /* toasts */
  toasts: ToastItem[]
  pushToast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
}

const CommunicationStoreContext = createContext<CommunicationStoreValue | null>(null)

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

/** HH:mm clock used for demo timestamps of new records. */
function nowAt(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function CommunicationStoreProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS)
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES)
  const [complaints, setComplaints] = useState<Complaint[]>(SEED_COMPLAINTS)
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS)
  const [notifications, setNotifications] = useState<CommNotification[]>(
    SEED_COMM_NOTIFICATIONS,
  )
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toastId = useRef(0)

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /* ------------------------------------------------------------ messaging */

  const sendMessage = useCallback(
    (conversationId: string, sender: 'OWNER' | 'STUDENT', senderName: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const message: ChatMessage = {
        id: uid('MSG'),
        conversationId,
        sender,
        senderName,
        text: trimmed,
        date: COMM_TODAY,
        at: nowAt(),
        read: false,
      }
      setMessages((prev) => [...prev, message])
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessageOn: message.date,
                lastMessageAt: message.at,
                ownerUnread: sender === 'STUDENT' ? c.ownerUnread + 1 : c.ownerUnread,
                studentUnread: sender === 'OWNER' ? c.studentUnread + 1 : c.studentUnread,
              }
            : c,
        ),
      )

      // Notification for the receiver (frontend demo — no push is sent).
      const conv = conversations.find((c) => c.id === conversationId)
      if (conv) {
        const note: CommNotification = {
          id: uid('NTF'),
          role: sender === 'OWNER' ? 'STUDENT' : 'OWNER',
          studentId: sender === 'OWNER' ? conv.studentId : undefined,
          kind: 'MESSAGE',
          title: sender === 'OWNER' ? 'New message from your PG owner' : `New message from ${conv.studentName}`,
          body: trimmed.slice(0, 90),
          to: sender === 'OWNER' ? '/student/messages' : '/owner/communication',
          date: message.date,
          at: message.at,
          read: false,
        }
        setNotifications((prev) => [note, ...prev])
      }
    },
    [conversations],
  )

  const markConversationRead = useCallback(
    (conversationId: string, viewer: 'OWNER' | 'STUDENT') => {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === conversationId && !m.read
            ? m.sender !== viewer
              ? { ...m, read: true }
              : m
            : m,
        ),
      )
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? viewer === 'OWNER'
              ? { ...c, ownerUnread: 0 }
              : { ...c, studentUnread: 0 }
            : c,
        ),
      )
    },
    [],
  )

  /* ------------------------------------------------------------ complaints */

  const pushNotification = useCallback((note: CommNotification) => {
    setNotifications((prev) => [note, ...prev])
  }, [])

  const submitComplaint = useCallback(
    (input: ComplaintSubmitInput): Complaint => {
      const seq = complaints.length + 1
      const id = `CMP-${COMM_TODAY.slice(2).replace(/-/g, '')}-${String(seq).padStart(3, '0')}`
      const complaint: Complaint = {
        id,
        propertyId: input.propertyId,
        studentId: input.studentId,
        studentName: 'Demo Student',
        roomId: '',
        roomNumber: '—',
        category: input.category,
        subject: input.subject.trim(),
        description: input.description.trim(),
        priority: input.priority,
        status: 'SUBMITTED',
        submittedOn: COMM_TODAY,
        image: input.image,
        history: [
          {
            id: uid('EV'),
            actor: 'STUDENT',
            actorName: 'Demo Student',
            kind: 'STATUS',
            title: 'Complaint submitted',
            body: 'Raised from the student portal (demo).',
            date: COMM_TODAY,
            at: nowAt(),
            status: 'SUBMITTED',
          },
        ],
      }
      setComplaints((prev) => [complaint, ...prev])
      pushNotification({
        id: uid('NTF'),
        role: 'OWNER',
        kind: 'COMPLAINT',
        title: 'New complaint submitted',
        body: `${complaint.subject} (${complaint.id})`,
        to: '/owner/complaints',
        date: COMM_TODAY,
        at: complaint.history[0].at,
        read: false,
      })
      return complaint
    },
    [complaints.length, pushNotification],
  )

  const addComplaintComment = useCallback(
    (
      complaintId: string,
      actor: 'OWNER' | 'STUDENT',
      actorName: string,
      body: string,
      title: string,
    ) => {
      const trimmed = body.trim()
      if (!trimmed) return
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                history: [
                  {
                    id: uid('EV'),
                    actor,
                    actorName,
                    kind: actor === 'OWNER' ? 'RESPONSE' : 'COMMENT',
                    title,
                    body: trimmed,
                    date: COMM_TODAY,
                    at: nowAt(),
                  },
                  ...c.history,
                ],
              }
            : c,
        ),
      )
      const complaint = complaints.find((c) => c.id === complaintId)
      if (complaint && actor === 'OWNER') {
        pushNotification({
          id: uid('NTF'),
          role: 'STUDENT',
          studentId: complaint.studentId,
          kind: 'COMPLAINT',
          title: 'Owner responded to your complaint',
          body: trimmed.slice(0, 90),
          to: '/student/complaints',
          date: COMM_TODAY,
          at: nowAt(),
          read: false,
        })
      }
    },
    [complaints, pushNotification],
  )

  const updateComplaintStatus = useCallback(
    (complaintId: string, status: ComplaintStatus, note: string) => {
      const complaint = complaints.find((c) => c.id === complaintId)
      if (!complaint) return
      const at = nowAt()
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status,
                history: [
                  {
                    id: uid('EV'),
                    actor: 'OWNER' as const,
                    actorName: 'Rakesh Sharma (PG Owner)',
                    kind: 'STATUS' as const,
                    title: `Status changed to ${COMPLAINT_STATUS_LABELS[status]}`,
                    body: note.trim() || 'Updated by the PG owner (demo).',
                    date: COMM_TODAY,
                    at,
                    status,
                  },
                  ...c.history,
                ],
              }
            : c,
        ),
      )
      pushNotification({
        id: uid('NTF'),
        role: 'STUDENT',
        studentId: complaint.studentId,
        kind: 'COMPLAINT',
        title: 'Complaint status updated',
        body: `${complaint.subject} → ${COMPLAINT_STATUS_LABELS[status]}`,
        to: '/student/complaints',
        date: COMM_TODAY,
        at,
        read: false,
      })
    },
    [complaints, pushNotification],
  )

  const setComplaintPriority = useCallback(
    (complaintId: string, priority: ComplaintPriority) => {
      const complaint = complaints.find((c) => c.id === complaintId)
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                priority,
                history: [
                  {
                    id: uid('EV'),
                    actor: 'OWNER' as const,
                    actorName: 'Rakesh Sharma (PG Owner)',
                    kind: 'PRIORITY' as const,
                    title: `Priority changed to ${priority}`,
                    body: 'Re-prioritised by the PG owner (demo).',
                    date: COMM_TODAY,
                    at: nowAt(),
                  },
                  ...c.history,
                ],
              }
            : c,
        ),
      )
      if (complaint) pushToast(`Priority updated to ${priority} for ${complaint.id} (demo).`, 'info')
    },
    [complaints, pushToast],
  )

  /* --------------------------------------------------------- announcements */

  const saveAnnouncement = useCallback(
    (id: string | null, input: AnnouncementInput, publish: boolean): string => {
      if (id) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...input,
                  published: publish,
                  readBy: publish ? a.readBy : [],
                }
              : a,
          ),
        )
        return id
      }
      const newId = `ANN-${COMM_TODAY.slice(0, 4)}-${String(announcements.length + 1).padStart(3, '0')}`
      const announcement: Announcement = {
        id: newId,
        ...input,
        published: publish,
        readBy: [],
      }
      setAnnouncements((prev) => [announcement, ...prev])
      if (publish) {
        pushNotification({
          id: uid('NTF'),
          role: 'OWNER',
          kind: 'ANNOUNCEMENT',
          title: 'Announcement published',
          body: `${announcement.title} — ${announcement.propertyId === 'pg-001' ? 'Shree Shyam Boys PG' : 'Ashiana PG'}`,
          to: '/owner/announcements',
          date: COMM_TODAY,
          at: nowAt(),
          read: false,
        })
      }
      return newId
    },
    [announcements.length, pushNotification],
  )

  const toggleAnnouncementPublished = useCallback(
    (id: string) => {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, published: !a.published, readBy: a.published ? [] : a.readBy }
            : a,
        ),
      )
    },
    [],
  )

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const markAnnouncementRead = useCallback((id: string, studentId: string) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id && !a.readBy.includes(studentId)
          ? { ...a, readBy: [...a.readBy, studentId] }
          : a,
      ),
    )
  }, [])

  /* ---------------------------------------------------------- notifications */

  const roleNotifications = useCallback(
    (role: 'OWNER' | 'STUDENT', studentId?: string) =>
      notifications
        .filter((n) => n.role === role && (role === 'OWNER' || n.studentId === studentId))
        .sort((a, b) => (a.date === b.date ? (a.at < b.at ? 1 : -1) : a.date < b.date ? 1 : -1)),
    [notifications],
  )

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(
    (role: 'OWNER' | 'STUDENT', studentId?: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.role === role && (role === 'OWNER' || n.studentId === studentId)
            ? { ...n, read: true }
            : n,
        ),
      )
    },
    [],
  )

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const value = useMemo<CommunicationStoreValue>(
    () => ({
      conversations,
      messages,
      sendMessage,
      markConversationRead,
      complaints,
      submitComplaint,
      addComplaintComment,
      updateComplaintStatus,
      setComplaintPriority,
      announcements,
      saveAnnouncement,
      toggleAnnouncementPublished,
      deleteAnnouncement,
      markAnnouncementRead,
      notifications,
      roleNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      conversations,
      messages,
      sendMessage,
      markConversationRead,
      complaints,
      submitComplaint,
      addComplaintComment,
      updateComplaintStatus,
      setComplaintPriority,
      announcements,
      saveAnnouncement,
      toggleAnnouncementPublished,
      deleteAnnouncement,
      markAnnouncementRead,
      notifications,
      roleNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      toasts,
      pushToast,
      dismissToast,
    ],
  )

  return (
    <CommunicationStoreContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </CommunicationStoreContext.Provider>
  )
}

export function useCommunicationStore(): CommunicationStoreValue {
  const ctx = useContext(CommunicationStoreContext)
  if (!ctx) throw new Error('useCommunicationStore must be used within CommunicationStoreProvider')
  return ctx
}
