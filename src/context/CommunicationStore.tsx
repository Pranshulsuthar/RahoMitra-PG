import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
import { useAuth } from './AuthContext'
import {
  fetchAnnouncements,
  fetchComplaints,
  fetchConversations,
  fetchMessages,
  fetchNotifications,
  markAllNotificationsReadApi,
  markAnnouncementReadApi,
  markConversationAsRead,
  markNotificationReadApi,
  clearNotificationApi,
  saveAnnouncementApi,
  sendChatMessage,
  setComplaintPriorityApi,
  submitComplaintApi,
  toggleAnnouncementPublishedApi,
  deleteAnnouncementApi,
  updateComplaintStatusApi,
  addComplaintCommentApi,
} from '../api/communication'

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
  refresh: () => Promise<void>
}

const CommunicationStoreContext = createContext<CommunicationStoreValue | null>(null)

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

function nowAt(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CommunicationStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<CommNotification[]>([])
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

  /* -------------------------------------------------------- Refresh from API */
  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const [convs, cmps, anns, notifs] = await Promise.all([
        fetchConversations().catch(() => null),
        fetchComplaints().catch(() => null),
        fetchAnnouncements().catch(() => null),
        fetchNotifications().catch(() => null),
      ])

      if (convs) {
        setConversations(convs)
        // Also fetch messages for the active or returned conversations
        const allMsgs = await Promise.all(
          convs.map((c) => fetchMessages(c.id).catch(() => []))
        )
        const flattened = allMsgs.flat()
        if (flattened.length > 0) {
          setMessages(flattened)
        }
      }
      if (cmps) setComplaints(cmps)
      if (anns) setAnnouncements(anns)
      if (notifs) setNotifications(notifs)
    } catch {
      // Keep optimistic or seed state on error
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void refresh()
    }
  }, [user, refresh])

  /* ------------------------------------------------------------ messaging */

  const sendMessage = useCallback(
    (conversationId: string, sender: 'OWNER' | 'STUDENT', senderName: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const tempId = uid('MSG')
      const message: ChatMessage = {
        id: tempId,
        conversationId,
        sender,
        senderName,
        text: trimmed,
        date: getTodayIso(),
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

      if (user) {
        sendChatMessage({ conversationId, text: trimmed })
          .then((realMsg) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? realMsg : m))
            )
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to send message', 'error')
          })
      }
    },
    [user, pushToast],
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

      if (user) {
        markConversationAsRead(conversationId).catch(() => {})
      }
    },
    [user],
  )

  /* ------------------------------------------------------------ complaints */

  const submitComplaint = useCallback(
    (input: ComplaintSubmitInput): Complaint => {
      const seq = complaints.length + 1
      const id = `CMP-${getTodayIso().slice(2).replace(/-/g, '')}-${String(seq).padStart(3, '0')}`
      const complaint: Complaint = {
        id,
        propertyId: input.propertyId,
        studentId: input.studentId,
        studentName: user?.fullName || 'Student',
        roomId: '',
        roomNumber: '—',
        category: input.category,
        subject: input.subject.trim(),
        description: input.description.trim(),
        priority: input.priority,
        status: 'SUBMITTED',
        submittedOn: getTodayIso(),
        image: input.image,
        history: [
          {
            id: uid('EV'),
            actor: 'STUDENT',
            actorName: user?.fullName || 'Student',
            kind: 'STATUS',
            title: 'Complaint submitted',
            body: 'Raised from the student portal.',
            date: getTodayIso(),
            at: nowAt(),
            status: 'SUBMITTED',
          },
        ],
      }
      setComplaints((prev) => [complaint, ...prev])

      if (user) {
        submitComplaintApi({
          propertyId: input.propertyId,
          category: input.category,
          subject: input.subject,
          description: input.description,
          priority: input.priority,
          image: input.image || undefined,
        })
          .then((saved) => {
            setComplaints((prev) =>
              prev.map((c) => (c.id === id ? saved : c))
            )
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to submit complaint to server', 'error')
          })
      }

      return complaint
    },
    [complaints.length, user, pushToast],
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
                    date: getTodayIso(),
                    at: nowAt(),
                  },
                  ...c.history,
                ],
              }
            : c,
        ),
      )

      if (user) {
        addComplaintCommentApi(complaintId, trimmed, title)
          .then((updated) => {
            setComplaints((prev) =>
              prev.map((c) => (c.id === complaintId ? updated : c))
            )
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to add comment', 'error')
          })
      }
    },
    [user, pushToast],
  )

  const updateComplaintStatus = useCallback(
    (complaintId: string, status: ComplaintStatus, note: string) => {
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
                    actorName: user?.fullName || 'PG Owner',
                    kind: 'STATUS' as const,
                    title: `Status changed to ${COMPLAINT_STATUS_LABELS[status]}`,
                    body: note.trim() || 'Updated by the PG owner.',
                    date: getTodayIso(),
                    at,
                    status,
                  },
                  ...c.history,
                ],
              }
            : c,
        ),
      )

      if (user) {
        updateComplaintStatusApi(complaintId, status, note)
          .then((updated) => {
            setComplaints((prev) =>
              prev.map((c) => (c.id === complaintId ? updated : c))
            )
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to update complaint status', 'error')
          })
      }
    },
    [user, pushToast],
  )

  const setComplaintPriority = useCallback(
    (complaintId: string, priority: ComplaintPriority) => {
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
                    actorName: user?.fullName || 'PG Owner',
                    kind: 'PRIORITY' as const,
                    title: `Priority changed to ${priority}`,
                    body: 'Re-prioritised by the PG owner.',
                    date: getTodayIso(),
                    at: nowAt(),
                  },
                  ...c.history,
                ],
              }
            : c,
        ),
      )

      if (user) {
        setComplaintPriorityApi(complaintId, priority)
          .then((updated) => {
            setComplaints((prev) =>
              prev.map((c) => (c.id === complaintId ? updated : c))
            )
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to update priority', 'error')
          })
      }
    },
    [user, pushToast],
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

        if (user) {
          saveAnnouncementApi({ ...input, id }, publish).catch((err) => {
            pushToast(err.message || 'Failed to save announcement', 'error')
          })
        }
        return id
      }

      const newId = `ANN-${getTodayIso().slice(0, 4)}-${String(announcements.length + 1).padStart(3, '0')}`
      const announcement: Announcement = {
        id: newId,
        ...input,
        published: publish,
        readBy: [],
      }
      setAnnouncements((prev) => [announcement, ...prev])

      if (user) {
        saveAnnouncementApi(input, publish)
          .then((res) => {
            if (res.id && res.id !== newId) {
              setAnnouncements((prev) =>
                prev.map((a) => (a.id === newId ? { ...a, id: res.id } : a))
              )
            }
          })
          .catch((err) => {
            pushToast(err.message || 'Failed to publish announcement', 'error')
          })
      }

      return newId
    },
    [announcements.length, user, pushToast],
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

      if (user) {
        toggleAnnouncementPublishedApi(id).catch((err) => {
          pushToast(err.message || 'Failed to toggle publish status', 'error')
        })
      }
    },
    [user, pushToast],
  )

  const deleteAnnouncement = useCallback(
    (id: string) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      if (user) {
        deleteAnnouncementApi(id).catch((err) => {
          pushToast(err.message || 'Failed to delete announcement', 'error')
        })
      }
    },
    [user, pushToast],
  )

  const markAnnouncementRead = useCallback(
    (id: string, studentId: string) => {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id && !a.readBy.includes(studentId)
            ? { ...a, readBy: [...a.readBy, studentId] }
            : a,
        ),
      )

      if (user) {
        markAnnouncementReadApi(id).catch(() => {})
      }
    },
    [user],
  )

  /* ---------------------------------------------------------- notifications */

  const roleNotifications = useCallback(
    (role: 'OWNER' | 'STUDENT', studentId?: string) =>
      notifications
        .filter((n) => n.role === role && (role === 'OWNER' || n.studentId === studentId))
        .sort((a, b) => (a.date === b.date ? (a.at < b.at ? 1 : -1) : a.date < b.date ? 1 : -1)),
    [notifications],
  )

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      if (user) {
        markNotificationReadApi(id).catch(() => {})
      }
    },
    [user],
  )

  const markAllNotificationsRead = useCallback(
    (role: 'OWNER' | 'STUDENT', studentId?: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.role === role && (role === 'OWNER' || n.studentId === studentId)
            ? { ...n, read: true }
            : n,
        ),
      )
      if (user) {
        markAllNotificationsReadApi().catch(() => {})
      }
    },
    [user],
  )

  const clearNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (user) {
        clearNotificationApi(id).catch(() => {})
      }
    },
    [user],
  )

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
      refresh,
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
      refresh,
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
