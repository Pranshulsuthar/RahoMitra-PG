import { apiClient } from './client'
import type {
  Announcement,
  ChatMessage,
  CommNotification,
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  Conversation,
} from '../types/communication'
import type { StudentNotice, StudentProfile, StudentSettings } from '../types/student'

/* ------------------------------------------------------------- Messaging */

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await apiClient.get<{ data: Conversation[] }>('/communication/conversations')
  return res.data
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiClient.get<{ data: ChatMessage[] }>(
    `/communication/conversations/${encodeURIComponent(conversationId)}/messages`
  )
  return res.data
}

export async function sendChatMessage(data: {
  conversationId: string
  text: string
}): Promise<ChatMessage> {
  const res = await apiClient.post<{ data: ChatMessage }>('/communication/messages', data)
  return res.data
}

export async function markConversationAsRead(conversationId: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post<{ data: { ok: boolean } }>(
    `/communication/conversations/${encodeURIComponent(conversationId)}/read`
  )
  return res.data
}

export async function initConversation(data: {
  propertyId: string
  studentId: string
}): Promise<Conversation> {
  const res = await apiClient.post<{ data: Conversation }>('/communication/conversations/init', data)
  return res.data
}

/* ------------------------------------------------------------ Complaints */

export async function fetchComplaints(propertyId?: string): Promise<Complaint[]> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ''
  const res = await apiClient.get<{ data: Complaint[] }>(`/communication/complaints${query}`)
  return res.data
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await apiClient.get<{ data: Complaint }>(`/communication/complaints/${encodeURIComponent(id)}`)
  return res.data
}

export async function submitComplaintApi(data: {
  propertyId: string
  category: string
  subject: string
  description: string
  priority: string
  image?: string
}): Promise<Complaint> {
  const res = await apiClient.post<{ data: Complaint }>('/communication/complaints', data)
  return res.data
}

export async function updateComplaintStatusApi(
  id: string,
  status: ComplaintStatus,
  note: string
): Promise<Complaint> {
  const res = await apiClient.patch<{ data: Complaint }>(
    `/communication/complaints/${encodeURIComponent(id)}/status`,
    { status, note }
  )
  return res.data
}

export async function addComplaintCommentApi(
  id: string,
  body: string,
  title: string
): Promise<Complaint> {
  const res = await apiClient.post<{ data: Complaint }>(
    `/communication/complaints/${encodeURIComponent(id)}/comments`,
    { body, title }
  )
  return res.data
}

export async function setComplaintPriorityApi(
  id: string,
  priority: ComplaintPriority
): Promise<Complaint> {
  const res = await apiClient.patch<{ data: Complaint }>(
    `/communication/complaints/${encodeURIComponent(id)}/priority`,
    { priority }
  )
  return res.data
}

/* --------------------------------------------------------- Announcements */

export async function fetchAnnouncements(propertyId?: string): Promise<Announcement[]> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ''
  const res = await apiClient.get<{ data: Announcement[] }>(`/communication/announcements${query}`)
  return res.data
}

export async function saveAnnouncementApi(
  data: any,
  published = true
): Promise<{ id: string }> {
  const res = await apiClient.post<{ data: { id: string } }>('/communication/announcements', {
    ...data,
    published,
  })
  return res.data
}

export async function toggleAnnouncementPublishedApi(id: string): Promise<{ published: boolean }> {
  const res = await apiClient.patch<{ data: { published: boolean } }>(
    `/communication/announcements/${encodeURIComponent(id)}/toggle-publish`
  )
  return res.data
}

export async function deleteAnnouncementApi(id: string): Promise<{ ok: boolean }> {
  const res = await apiClient.delete<{ data: { ok: boolean } }>(
    `/communication/announcements/${encodeURIComponent(id)}`
  )
  return res.data
}

export async function markAnnouncementReadApi(id: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post<{ data: { ok: boolean } }>(
    `/communication/announcements/${encodeURIComponent(id)}/read`
  )
  return res.data
}

/* --------------------------------------------------------- Notifications */

export async function fetchNotifications(): Promise<CommNotification[]> {
  const res = await apiClient.get<{ data: CommNotification[] }>('/communication/notifications')
  return res.data
}

export async function markNotificationReadApi(id: string): Promise<{ ok: boolean }> {
  const res = await apiClient.post<{ data: { ok: boolean } }>(
    `/communication/notifications/${encodeURIComponent(id)}/read`
  )
  return res.data
}

export async function markAllNotificationsReadApi(): Promise<{ ok: boolean }> {
  const res = await apiClient.post<{ data: { ok: boolean } }>('/communication/notifications/read-all')
  return res.data
}

export async function clearNotificationApi(id: string): Promise<{ ok: boolean }> {
  const res = await apiClient.delete<{ data: { ok: boolean } }>(
    `/communication/notifications/${encodeURIComponent(id)}`
  )
  return res.data
}

/* --------------------------------- Student Notices, Profile & Settings */

export async function fetchStudentNotices(): Promise<StudentNotice[]> {
  const res = await apiClient.get<{ data: StudentNotice[] }>('/communication/student/notices')
  return res.data
}

export async function fetchStudentProfile(): Promise<StudentProfile> {
  const res = await apiClient.get<{ data: StudentProfile }>('/communication/student/profile')
  return res.data
}

export async function updateStudentProfileApi(patch: Partial<StudentProfile>): Promise<StudentProfile> {
  const res = await apiClient.put<{ data: StudentProfile }>('/communication/student/profile', patch)
  return res.data
}

export async function fetchStudentSettings(): Promise<StudentSettings> {
  const res = await apiClient.get<{ data: StudentSettings }>('/communication/student/settings')
  return res.data
}

export async function updateStudentSettingsApi(patch: Partial<StudentSettings>): Promise<StudentSettings> {
  const res = await apiClient.put<{ data: StudentSettings }>('/communication/student/settings', patch)
  return res.data
}
