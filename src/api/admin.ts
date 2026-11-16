import { apiClient } from './client'
import type {
  ActivityItem,
  AdminPg,
  Advertisement,
  ApplicationStatus,
  FeaturedListingStatus,
  FeaturedRequest,
  OwnerApplication,
  OwnerRecord,
  OwnerStatus,
  PaymentRecord,
  PgStatus,
  PlanRecord,
  PlatformNotification,
  PlatformSettings,
  PlatformTicket,
  PlatformTicketStatus,
  StudentRecord,
  SubscriptionRecord,
  SubscriptionStatus,
  TicketPriority,
} from '../types/admin'

/* ------------------------------------------------------------- Applications */

export async function fetchAdminApplications(): Promise<OwnerApplication[]> {
  const res = await apiClient.get<{ data: OwnerApplication[] }>('/admin/applications')
  return res.data
}

export async function decideAdminApplication(
  id: string,
  status: ApplicationStatus,
  reason?: string,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/applications/${encodeURIComponent(id)}/status`,
    { status, reason },
  )
  return { ok: true }
}

/* ---------------------------------------------------------------------- PGs */

export async function fetchAdminPgs(): Promise<AdminPg[]> {
  const res = await apiClient.get<{ data: AdminPg[] }>('/admin/pgs')
  return res.data
}

export async function setAdminPgStatus(
  id: string,
  status: PgStatus,
  statusNote?: string,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(`/admin/pgs/${encodeURIComponent(id)}/status`, {
    status,
    statusNote,
  })
  return { ok: true }
}

/* ------------------------------------------------------- Owners & Students */

export async function fetchAdminOwners(): Promise<OwnerRecord[]> {
  const res = await apiClient.get<{ data: OwnerRecord[] }>('/admin/owners')
  return res.data
}

export async function setAdminOwnerStatus(
  id: string,
  status: OwnerStatus,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/owners/${encodeURIComponent(id)}/status`,
    { status },
  )
  return { ok: true }
}

export async function fetchAdminStudents(): Promise<StudentRecord[]> {
  const res = await apiClient.get<{ data: StudentRecord[] }>('/admin/students')
  return res.data
}

export async function setAdminStudentMembership(
  id: string,
  membership: 'ACTIVE' | 'INACTIVE',
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/students/${encodeURIComponent(id)}/membership`,
    { membership },
  )
  return { ok: true }
}

/* -------------------------------------------------------------------- Plans */

export async function fetchAdminPlans(): Promise<PlanRecord[]> {
  const res = await apiClient.get<{ data: PlanRecord[] }>('/admin/plans')
  return res.data
}

export async function createAdminPlan(plan: Omit<PlanRecord, 'id'>): Promise<PlanRecord> {
  const res = await apiClient.post<{ data: PlanRecord }>('/admin/plans', plan)
  return res.data
}

export async function updateAdminPlan(
  id: string,
  patch: Partial<PlanRecord>,
): Promise<PlanRecord> {
  const res = await apiClient.patch<{ data: PlanRecord }>(
    `/admin/plans/${encodeURIComponent(id)}`,
    patch,
  )
  return res.data
}

export async function deleteAdminPlan(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await apiClient.delete<{ data: { ok: boolean } }>(
      `/admin/plans/${encodeURIComponent(id)}`,
    )
    return res.data
  } catch (err: any) {
    return { ok: false, reason: err.message || 'Cannot delete plan' }
  }
}

/* ----------------------------------------------------------- Subscriptions */

export async function fetchAdminSubscriptions(): Promise<SubscriptionRecord[]> {
  const res = await apiClient.get<{ data: SubscriptionRecord[] }>('/admin/subscriptions')
  return res.data
}

export async function updateAdminSubscription(
  id: string,
  patch: {
    status?: SubscriptionStatus
    planId?: string
    extendDays?: number
    suspended?: boolean
  },
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/subscriptions/${encodeURIComponent(id)}/status`,
    patch,
  )
  return { ok: true }
}

export async function fetchAdminPayments(): Promise<PaymentRecord[]> {
  const res = await apiClient.get<{ data: PaymentRecord[] }>('/admin/payments')
  return res.data
}

/* ------------------------------------------------------- Featured Requests */

export async function fetchAdminFeaturedRequests(): Promise<FeaturedRequest[]> {
  const res = await apiClient.get<{ data: FeaturedRequest[] }>('/admin/featured-requests')
  return res.data
}

export async function submitAdminFeaturedRequest(input: {
  pgId: string
  tier: FeaturedRequest['tier']
  amount: number
  durationMonths?: number
}): Promise<FeaturedRequest> {
  const res = await apiClient.post<{ data: FeaturedRequest }>(
    '/admin/featured-requests',
    input,
  )
  return res.data
}

export async function decideAdminFeaturedRequest(
  id: string,
  decision: 'APPROVED' | 'REJECTED',
  options?: { durationMonths?: number; reason?: string },
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/featured-requests/${encodeURIComponent(id)}/decision`,
    { decision, ...options },
  )
  return { ok: true }
}

export async function setAdminFeaturedListingStatus(
  id: string,
  status: FeaturedListingStatus,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/featured-requests/${encodeURIComponent(id)}/listing-status`,
    { status },
  )
  return { ok: true }
}

/* ---------------------------------------------------------- Advertisements */

export async function fetchAdminAdvertisements(): Promise<Advertisement[]> {
  const res = await apiClient.get<{ data: Advertisement[] }>('/admin/advertisements')
  return res.data
}

export async function createAdminAdvertisement(
  input: Omit<Advertisement, 'id' | 'createdOn'>,
): Promise<Advertisement> {
  const res = await apiClient.post<{ data: Advertisement }>('/admin/advertisements', input)
  return res.data
}

export async function updateAdminAdvertisement(
  id: string,
  patch: Partial<Advertisement>,
): Promise<Advertisement> {
  const res = await apiClient.patch<{ data: Advertisement }>(
    `/admin/advertisements/${encodeURIComponent(id)}`,
    patch,
  )
  return res.data
}

export async function setAdminAdvertisementStatus(
  id: string,
  status: Advertisement['status'],
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/advertisements/${encodeURIComponent(id)}/status`,
    { status },
  )
  return { ok: true }
}

export async function deleteAdminAdvertisement(id: string): Promise<{ ok: boolean }> {
  const res = await apiClient.delete<{ data: { ok: boolean } }>(
    `/admin/advertisements/${encodeURIComponent(id)}`,
  )
  return res.data
}

/* ---------------------------------------------------------------- Settings */

export async function fetchAdminSettings(): Promise<PlatformSettings> {
  const res = await apiClient.get<{ data: PlatformSettings }>('/admin/settings')
  return res.data
}

export async function saveAdminSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const res = await apiClient.put<{ data: PlatformSettings }>('/admin/settings', patch)
  return res.data
}

export async function resetAdminSettings(): Promise<PlatformSettings> {
  const res = await apiClient.post<{ data: PlatformSettings }>('/admin/settings/reset')
  return res.data
}

/* --------------------------------------------------------- Stats & Activities */

export async function fetchAdminStats(): Promise<any> {
  const res = await apiClient.get<{ data: any }>('/admin/stats')
  return res.data
}

export async function fetchAdminActivities(): Promise<ActivityItem[]> {
  const res = await apiClient.get<{ data: ActivityItem[] }>('/admin/activities')
  return res.data
}

/* ---------------------------------------------------------- Support Tickets */

export async function fetchAdminTickets(): Promise<PlatformTicket[]> {
  const res = await apiClient.get<{ data: PlatformTicket[] }>('/admin/tickets')
  return res.data
}

export async function setAdminTicketStatus(
  id: string,
  status: PlatformTicketStatus,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/tickets/${encodeURIComponent(id)}/status`,
    { status },
  )
  return { ok: true }
}

export async function setAdminTicketPriority(
  id: string,
  priority: TicketPriority,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/tickets/${encodeURIComponent(id)}/priority`,
    { priority },
  )
  return { ok: true }
}

export async function assignAdminTicket(
  id: string,
  staff: string | null,
): Promise<{ ok: boolean }> {
  await apiClient.patch<{ data: any }>(
    `/admin/tickets/${encodeURIComponent(id)}/assign`,
    { staff },
  )
  return { ok: true }
}

export async function addAdminTicketReply(
  id: string,
  text: string,
  role: 'Admin' | 'User',
): Promise<any> {
  const res = await apiClient.post<{ data: any }>(
    `/admin/tickets/${encodeURIComponent(id)}/replies`,
    { text, role },
  )
  return res.data
}

/* ---------------------------------------------------- Platform Notifications */

export async function fetchAdminNotifications(): Promise<PlatformNotification[]> {
  const res = await apiClient.get<{ data: PlatformNotification[] }>('/admin/notifications')
  return res.data
}

export async function createAdminNotification(input: {
  title: string
  message: string
  category: string
  audience: string
}): Promise<PlatformNotification> {
  const res = await apiClient.post<{ data: PlatformNotification }>('/admin/notifications', input)
  return res.data
}
