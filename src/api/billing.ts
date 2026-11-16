import { apiClient } from './client'
import type {
  BillInput,
  BillStatus,
  PaymentDetails,
  PaymentInput,
  PaymentRecord,
  RentBill,
} from '../types/billing'

export interface SaveBillResponse {
  data: RentBill
}

export interface RecordPaymentResponse {
  data: {
    bill: RentBill
    payment: PaymentRecord
    statusLabel: BillStatus
  }
}

export interface StudentInvoiceResponse {
  data: {
    bill: RentBill
    property: {
      id: string
      name: string
      address: string
      city: string
      locality: string
    }
    owner: {
      name: string
      phone: string
      email: string
    }
    paymentDetails: PaymentDetails | null
  }
}

/* ------------------------------------------------------------- Owner API */

export async function fetchOwnerBills(propertyId?: string): Promise<RentBill[]> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ''
  const res = await apiClient.get<{ data: RentBill[] }>(`/billing/owner/bills${query}`)
  return res.data
}

export async function fetchOwnerBillById(id: string): Promise<RentBill> {
  const res = await apiClient.get<{ data: RentBill }>(`/billing/owner/bills/${encodeURIComponent(id)}`)
  return res.data
}

export async function saveOwnerBill(input: BillInput & { id?: string | null; draft?: boolean; meta?: any }): Promise<RentBill> {
  const res = await apiClient.post<{ data: RentBill }>('/billing/owner/bills', input)
  return res.data
}

export async function cancelOwnerBill(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(
    `/billing/owner/bills/${encodeURIComponent(id)}`
  )
  return res.data
}

export async function recordOwnerPayment(input: PaymentInput): Promise<{
  bill: RentBill
  payment: PaymentRecord
  statusLabel: BillStatus
}> {
  const res = await apiClient.post<RecordPaymentResponse>('/billing/owner/payments', input)
  return res.data
}

export async function fetchOwnerPayments(propertyId?: string): Promise<PaymentRecord[]> {
  const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ''
  const res = await apiClient.get<{ data: PaymentRecord[] }>(`/billing/owner/payments${query}`)
  return res.data
}

export async function fetchOwnerPaymentDetails(): Promise<PaymentDetails> {
  const res = await apiClient.get<{ data: PaymentDetails }>('/billing/owner/payment-details')
  return res.data
}

export async function updateOwnerPaymentDetails(data: Partial<PaymentDetails>): Promise<PaymentDetails> {
  const res = await apiClient.put<{ data: PaymentDetails }>('/billing/owner/payment-details', data)
  return res.data
}

/* ----------------------------------------------------------- Student API */

export async function fetchStudentBills(): Promise<RentBill[]> {
  const res = await apiClient.get<{ data: RentBill[] }>('/billing/student/bills')
  return res.data
}

export async function fetchStudentInvoice(billId: string): Promise<StudentInvoiceResponse['data']> {
  const res = await apiClient.get<StudentInvoiceResponse>(`/billing/student/bills/${encodeURIComponent(billId)}/invoice`)
  return res.data
}

export async function fetchStudentOwnerPaymentDetails(): Promise<PaymentDetails> {
  const res = await apiClient.get<{ data: PaymentDetails }>('/billing/student/payment-details')
  return res.data
}
