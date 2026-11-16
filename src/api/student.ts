import { apiClient } from './client'

export interface StudentAdmissionRequest {
  id: string
  propertyId: string
  propertyName: string
  propertyCity: string
  propertyLocality: string
  coverImage?: string
  code: string
  roomPreference: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedOn: string
  decidedOn?: string
  reason?: string
}

export interface StudentAccommodation {
  property: {
    id: string
    name: string
    type: string
    city: string
    locality: string
    address: string
    coverImage: string
    gallery: string[]
    food: string
    facilities: string[]
    rules: string[]
    owner: {
      name: string
      phone: string
      email: string
    }
    ownerName?: string
    contactPhone?: string
    contactEmail?: string
  }
  room: {
    id: string
    number: string
    roomNumber?: string
    floor: number
    type: string
    rent: number
  }
  bed: {
    id: string
    label: string
    bedNumber?: string
    status: string
  }
  membership: string
  admissionDate: string
  roommates: Array<{
    id?: string
    name: string
    bedLabel: string
  }>
}

export async function submitAdmissionCode(data: {
  code: string
  roomPreference?: string
}): Promise<StudentAdmissionRequest> {
  const res = await apiClient.post<{ data: StudentAdmissionRequest }>('/student/admission-code', data)
  return res.data
}

export async function fetchOwnAdmissionRequests(): Promise<StudentAdmissionRequest[]> {
  const res = await apiClient.get<{ data: StudentAdmissionRequest[] }>('/student/admission-requests')
  return res.data
}

export async function fetchStudentAccommodation(): Promise<StudentAccommodation | null> {
  const res = await apiClient.get<{ data: StudentAccommodation | null }>('/student/accommodation')
  if (!res.data) return null
  const d = res.data
  return {
    ...d,
    property: {
      ...d.property,
      ownerName: d.property.ownerName || d.property.owner?.name,
      contactPhone: d.property.contactPhone || d.property.owner?.phone,
      contactEmail: d.property.contactEmail || d.property.owner?.email,
    },
    room: {
      ...d.room,
      roomNumber: d.room.roomNumber || d.room.number,
    },
    bed: {
      ...d.bed,
      bedNumber: d.bed.bedNumber || d.bed.label,
    },
  }
}
