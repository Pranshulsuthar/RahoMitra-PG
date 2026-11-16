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
  }
  room: {
    id: string
    number: string
    floor: number
    type: string
    rent: number
  }
  bed: {
    id: string
    label: string
    status: string
  }
  membership: string
  admissionDate: string
  roommates: Array<{
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
  return res.data
}
