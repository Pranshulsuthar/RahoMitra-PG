import { z } from 'zod'

export const billCalculation = (bill: {
  rent: number
  electricity: number
  water: number
  maintenance: number
  food: number
  extra: number
  discount: number
}) => {
  const subtotal = bill.rent + bill.electricity + bill.water + bill.maintenance + bill.food + bill.extra
  const total = Math.max(0, subtotal - bill.discount)
  return { subtotal, total }
}

export const billInputSchema = z.object({
  id: z.string().optional().nullable(),
  propertyId: z.string().min(1, 'Property ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
  rent: z.number().int().min(0, 'Rent must be a non-negative integer'),
  electricity: z.number().int().min(0, 'Electricity must be a non-negative integer').default(0),
  water: z.number().int().min(0, 'Water must be a non-negative integer').default(0),
  maintenance: z.number().int().min(0, 'Maintenance must be a non-negative integer').default(0),
  food: z.number().int().min(0, 'Food must be a non-negative integer').default(0),
  extra: z.number().int().min(0, 'Extra must be a non-negative integer').default(0),
  discount: z.number().int().min(0, 'Discount must be a non-negative integer').default(0),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().default(''),
  draft: z.boolean().default(false),
  meta: z
    .object({
      studentName: z.string().optional(),
      roomId: z.string().optional(),
      roomNumber: z.string().optional(),
      bedLabel: z.string().optional(),
    })
    .optional(),
})

export const updateBillSchema = z.object({
  rent: z.number().int().min(0).optional(),
  electricity: z.number().int().min(0).optional(),
  water: z.number().int().min(0).optional(),
  maintenance: z.number().int().min(0).optional(),
  food: z.number().int().min(0).optional(),
  extra: z.number().int().min(0).optional(),
  discount: z.number().int().min(0).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  draft: z.boolean().optional(),
})

export const paymentInputSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  amount: z.number().int().positive('Payment amount must be greater than zero'),
  method: z.enum(['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER']),
  reference: z.string().default(''),
  date: z.string().min(1, 'Payment date is required'),
  notes: z.string().default(''),
})

export const paymentDetailsSchema = z.object({
  upiId: z.string().default(''),
  accountHolder: z.string().default(''),
  instructions: z.string().default(''),
  qrImage: z.string().default(''),
})

export type BillInput = z.infer<typeof billInputSchema>
export type UpdateBillInput = z.infer<typeof updateBillSchema>
export type PaymentInput = z.infer<typeof paymentInputSchema>
export type PaymentDetailsInput = z.infer<typeof paymentDetailsSchema>
