import { apiClient } from './client'
import type {
  OwnerProperty,
  OwnerRoom,
  RoomBed,
  OwnerStudent,
  AdmissionCode,
  AdmissionRequest,
  StaffMember,
  OwnerProfile,
  OwnerNotification,
  OwnerActivity,
  PropertyStatus,
  RoomType,
  BedStatus,
  MembershipStatus,
} from '../types/owner'

export interface PropertyInput {
  name: string
  type: OwnerProperty['type']
  description: string
  city: string
  address: string
  locality: string
  contactPhone: string
  contactEmail: string
  securityDeposit: number
  facilities: string[]
  food: OwnerProperty['food']
  rules: string[]
  coverImage: string
  gallery: string[]
}

export interface RoomInput {
  propertyId: string
  number: string
  floor: number
  type: RoomType
  rent: number
  capacity?: number
}

export interface OwnerDashboardData {
  owner: OwnerProfile
  properties: OwnerProperty[]
  rooms: OwnerRoom[]
  students: OwnerStudent[]
  staff: StaffMember[]
  codes: AdmissionCode[]
  requests: AdmissionRequest[]
  notifications: OwnerNotification[]
  activities: OwnerActivity[]
}

export async function fetchOwnerDashboard(): Promise<OwnerDashboardData> {
  const res = await apiClient.get<{ data: OwnerDashboardData }>('/owner/dashboard')
  return res.data
}

export async function apiCreateProperty(data: PropertyInput): Promise<OwnerProperty> {
  const res = await apiClient.post<{ data: OwnerProperty }>('/owner/properties', data)
  return res.data
}

export async function apiUpdateProperty(
  id: string,
  patch: Partial<OwnerProperty>
): Promise<OwnerProperty> {
  const res = await apiClient.patch<{ data: OwnerProperty }>(`/owner/properties/${id}`, patch)
  return res.data
}

export async function apiSetPropertyStatus(
  id: string,
  status: PropertyStatus
): Promise<{ id: string; status: PropertyStatus }> {
  const res = await apiClient.patch<{ data: { id: string; status: PropertyStatus } }>(
    `/owner/properties/${id}/status`,
    { status }
  )
  return res.data
}

export async function apiCreateRoom(data: RoomInput): Promise<OwnerRoom> {
  const res = await apiClient.post<{ data: OwnerRoom }>('/owner/rooms', data)
  return res.data
}

export async function apiUpdateRoom(
  id: string,
  patch: { number: string; floor: number; type: RoomType; rent: number }
): Promise<OwnerRoom> {
  const res = await apiClient.patch<{ data: OwnerRoom }>(`/owner/rooms/${id}`, patch)
  return res.data
}

export async function apiDeleteRoom(id: string): Promise<void> {
  await apiClient.delete(`/owner/rooms/${id}`)
}

export async function apiAddBed(roomId: string): Promise<RoomBed> {
  const res = await apiClient.post<{ data: RoomBed }>(`/owner/rooms/${roomId}/beds`)
  return res.data
}

export async function apiSetBedStatus(bedId: string, status: BedStatus): Promise<RoomBed> {
  const res = await apiClient.patch<{ data: RoomBed }>(`/owner/beds/${bedId}/status`, { status })
  return res.data
}

export async function apiSetStudentMembership(
  studentId: string,
  status: MembershipStatus
): Promise<void> {
  await apiClient.patch(`/owner/students/${studentId}/membership`, { status })
}

export async function apiAddStaff(data: {
  propertyId: string
  name: string
  email: string
  mobile: string
  role: string
}): Promise<StaffMember> {
  const res = await apiClient.post<{ data: StaffMember }>('/owner/staff', data)
  return res.data
}

export async function apiUpdateStaff(
  id: string,
  patch: { propertyId: string; name: string; email: string; mobile: string; role: string }
): Promise<StaffMember> {
  const res = await apiClient.patch<{ data: StaffMember }>(`/owner/staff/${id}`, patch)
  return res.data
}

export async function apiRemoveStaff(id: string): Promise<void> {
  await apiClient.delete(`/owner/staff/${id}`)
}

export async function apiGenerateAdmissionCode(data: {
  propertyId: string
  roomPreference: string
  expiresInDays: number
}): Promise<AdmissionCode> {
  const res = await apiClient.post<{ data: AdmissionCode }>('/owner/codes', data)
  return res.data
}

export async function apiRevokeAdmissionCode(codeId: string): Promise<void> {
  await apiClient.patch(`/owner/codes/${codeId}/revoke`)
}

export async function apiDecideAdmissionRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<void> {
  await apiClient.patch(`/owner/requests/${requestId}/decision`, { decision, reason })
}

export async function apiUpdateProfile(patch: Partial<OwnerProfile>): Promise<OwnerProfile> {
  const res = await apiClient.patch<{ data: OwnerProfile }>('/owner/profile', patch)
  return res.data
}

export async function apiMarkNotificationRead(id: string, read: boolean): Promise<void> {
  await apiClient.patch(`/owner/notifications/${id}/read`, { read })
}

export async function apiMarkAllNotificationsRead(): Promise<void> {
  await apiClient.post('/owner/notifications/mark-all-read')
}

export async function apiRemoveNotification(id: string): Promise<void> {
  await apiClient.delete(`/owner/notifications/${id}`)
}
