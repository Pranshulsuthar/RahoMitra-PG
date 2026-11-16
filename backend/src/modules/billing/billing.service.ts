import crypto from 'node:crypto'
import { prisma } from '../../db/client.js'
import { AppError } from '../../utils/errors.js'
import {
  BillStatus,
  type PaymentMethod,
  type RentBill,
  type Payment,
} from '@prisma/client'
import type {
  BillInput,
  PaymentDetailsInput,
  PaymentInput,
} from './billing.validation.js'

export function computeBillStatus(
  bill: {
    draft: boolean
    paidAmount: number
    dueDate: Date | string
    rent: number
    electricity: number
    water: number
    maintenance: number
    food: number
    extra: number
    discount: number
  },
  today = new Date()
): BillStatus {
  if (bill.draft) return BillStatus.DRAFT
  const subtotal =
    bill.rent +
    bill.electricity +
    bill.water +
    bill.maintenance +
    bill.food +
    bill.extra
  const total = Math.max(0, subtotal - bill.discount)
  if (bill.paidAmount >= total && total > 0) return BillStatus.PAID
  if (bill.paidAmount > 0) return BillStatus.PARTIALLY_PAID
  const due = new Date(bill.dueDate)
  if (due < today) return BillStatus.OVERDUE
  return BillStatus.UNPAID
}

export function formatBillResponse(
  bill: RentBill & {
    student?: {
      id: string
      user?: {
        fullName: string
      }
    } | null
    payments?: Payment[]
  }
) {
  const dynamicStatus = computeBillStatus(bill)
  const dueDateStr =
    bill.dueDate instanceof Date
      ? bill.dueDate.toISOString().split('T')[0]
      : String(bill.dueDate).split('T')[0]
  const generatedOnStr =
    bill.generatedOn instanceof Date
      ? bill.generatedOn.toISOString().split('T')[0]
      : String(bill.generatedOn).split('T')[0]

  return {
    id: bill.id,
    propertyId: bill.propertyId,
    studentId: bill.studentId,
    studentName: bill.student?.user?.fullName ?? 'Student',
    roomId: bill.roomId,
    roomNumber: bill.roomNumber,
    bedLabel: bill.bedLabel,
    month: bill.month,
    rent: bill.rent,
    electricity: bill.electricity,
    water: bill.water,
    maintenance: bill.maintenance,
    food: bill.food,
    extra: bill.extra,
    discount: bill.discount,
    dueDate: dueDateStr,
    notes: bill.notes,
    draft: bill.draft,
    paidAmount: bill.paidAmount,
    status: dynamicStatus,
    generatedOn: generatedOnStr,
    payments: bill.payments?.map(formatPaymentResponse) ?? [],
  }
}

export function formatPaymentResponse(
  payment: Payment & {
    student?: {
      user?: {
        fullName: string
      }
    } | null
  }
) {
  const dateStr =
    payment.date instanceof Date
      ? payment.date.toISOString().split('T')[0]
      : String(payment.date).split('T')[0]
  const recordedOnStr =
    payment.recordedOn instanceof Date
      ? payment.recordedOn.toISOString().split('T')[0]
      : String(payment.recordedOn).split('T')[0]

  return {
    id: payment.id,
    billId: payment.billId,
    propertyId: payment.propertyId,
    studentId: payment.studentId,
    studentName: payment.student?.user?.fullName ?? 'Student',
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    date: dateStr,
    notes: payment.notes,
    recordedOn: recordedOnStr,
  }
}

export class BillingService {
  /** Verify property belongs to owner */
  static async verifyPropertyOwnership(ownerId: string, propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })
    if (!property || property.ownerId !== ownerId) {
      throw AppError.notFound('Property not found or unauthorized')
    }
    return property
  }

  /** Verify bill belongs to property owned by owner */
  static async verifyBillOwnership(ownerId: string, billId: string) {
    const bill = await prisma.rentBill.findUnique({
      where: { id: billId },
      include: {
        property: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    })
    if (!bill || bill.property.ownerId !== ownerId) {
      throw AppError.notFound('Bill not found or unauthorized')
    }
    return bill
  }

  /** Get all bills for an owner, optionally filtered by property */
  static async getOwnerBills(ownerId: string, propertyId?: string) {
    const where: any = {
      property: {
        ownerId,
      },
    }
    if (propertyId) {
      where.propertyId = propertyId
    }

    const bills = await prisma.rentBill.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        payments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    })

    return bills.map(formatBillResponse)
  }

  /** Get single bill with payments */
  static async getOwnerBillById(ownerId: string, billId: string) {
    const bill = await this.verifyBillOwnership(ownerId, billId)
    const payments = await prisma.payment.findMany({
      where: { billId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return formatBillResponse({ ...bill, payments })
  }

  /** Create or update a bill */
  static async saveBill(ownerId: string, input: BillInput) {
    await this.verifyPropertyOwnership(ownerId, input.propertyId)

    // Verify student belongs to this property
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
      include: {
        room: true,
        bed: true,
        user: true,
      },
    })

    if (!student || student.propertyId !== input.propertyId) {
      throw AppError.badRequest('Student not found or not allocated to this property')
    }

    const roomId = input.meta?.roomId || student.roomId || student.room?.id || ''
    const roomNumber = input.meta?.roomNumber || student.room?.number || '—'
    const bedLabel = input.meta?.bedLabel || student.bed?.label || '—'

    // If updating an existing bill
    if (input.id) {
      const existing = await this.verifyBillOwnership(ownerId, input.id)

      if (input.month !== existing.month) {
        const duplicate = await prisma.rentBill.findUnique({
          where: {
            studentId_month: {
              studentId: input.studentId,
              month: input.month,
            },
          },
        })
        if (duplicate && duplicate.id !== input.id) {
          throw AppError.conflict(
            `A bill for this student already exists for ${input.month} (${duplicate.id}). Edit that bill instead.`
          )
        }
      }

      const updated = await prisma.rentBill.update({
        where: { id: input.id },
        data: {
          month: input.month,
          rent: input.rent,
          electricity: input.electricity,
          water: input.water,
          maintenance: input.maintenance,
          food: input.food,
          extra: input.extra,
          discount: input.discount,
          dueDate: new Date(input.dueDate),
          notes: input.notes,
          draft: input.draft,
          status: computeBillStatus({
            ...input,
            paidAmount: existing.paidAmount,
          }),
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      })

      return formatBillResponse(updated)
    }

    // Creating new bill: check duplicate for same student and month
    const duplicate = await prisma.rentBill.findUnique({
      where: {
        studentId_month: {
          studentId: input.studentId,
          month: input.month,
        },
      },
    })

    if (duplicate) {
      throw AppError.conflict(
        `A bill for this student already exists for ${input.month} (${duplicate.id}). Edit that bill instead.`
      )
    }

    // Generate human-friendly ID like RM-BILL-2611-XXX
    const prefix = `RM-BILL-${input.month.slice(2).replace('-', '')}-`
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase()
    const newBillId = `${prefix}${suffix}`

    const initialStatus = computeBillStatus({
      ...input,
      paidAmount: 0,
    })

    const created = await prisma.rentBill.create({
      data: {
        id: newBillId,
        propertyId: input.propertyId,
        studentId: input.studentId,
        roomId: roomId || 'unassigned',
        roomNumber,
        bedLabel,
        month: input.month,
        rent: input.rent,
        electricity: input.electricity,
        water: input.water,
        maintenance: input.maintenance,
        food: input.food,
        extra: input.extra,
        discount: input.discount,
        dueDate: new Date(input.dueDate),
        notes: input.notes,
        draft: input.draft,
        paidAmount: 0,
        status: initialStatus,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    })

    return formatBillResponse(created)
  }

  /** Delete / cancel a bill */
  static async cancelBill(ownerId: string, billId: string) {
    await this.verifyBillOwnership(ownerId, billId)

    await prisma.rentBill.delete({
      where: { id: billId },
    })

    return { success: true, message: 'Bill cancelled successfully' }
  }

  /** Record offline payment against a bill */
  static async recordPayment(ownerId: string, input: PaymentInput) {
    // IDOR verification
    await this.verifyBillOwnership(ownerId, input.billId)

    // Execute in transaction for concurrency safety and integrity
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.rentBill.findUnique({
        where: { id: input.billId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!bill) {
        throw AppError.notFound('Bill not found')
      }

      const subtotal =
        bill.rent +
        bill.electricity +
        bill.water +
        bill.maintenance +
        bill.food +
        bill.extra
      const total = Math.max(0, subtotal - bill.discount)
      const remaining = Math.max(0, total - bill.paidAmount)

      if (input.amount > remaining) {
        throw AppError.badRequest(
          `Amount exceeds the remaining balance of ₹${remaining.toLocaleString('en-IN')} for this bill.`
        )
      }

      const nextPaid = bill.paidAmount + input.amount
      const nextStatus =
        nextPaid >= total && total > 0
          ? BillStatus.PAID
          : BillStatus.PARTIALLY_PAID

      const updatedBill = await tx.rentBill.update({
        where: { id: bill.id },
        data: {
          paidAmount: nextPaid,
          status: nextStatus,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      })

      const payment = await tx.payment.create({
        data: {
          billId: bill.id,
          propertyId: bill.propertyId,
          studentId: bill.studentId,
          amount: input.amount,
          method: input.method as PaymentMethod,
          reference: input.reference.trim(),
          date: new Date(input.date),
          notes: input.notes.trim(),
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      })

      return {
        bill: formatBillResponse(updatedBill),
        payment: formatPaymentResponse(payment),
        statusLabel: nextStatus,
      }
    })

    return result
  }

  /** Get payment history for owner */
  static async getOwnerPayments(ownerId: string, propertyId?: string) {
    const where: any = {
      property: {
        ownerId,
      },
    }
    if (propertyId) {
      where.propertyId = propertyId
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    return payments.map(formatPaymentResponse)
  }

  /** Owner payment details management */
  static async getOwnerPaymentDetails(ownerId: string) {
    const details = await prisma.paymentDetails.findUnique({
      where: { ownerId },
    })

    if (!details) {
      return {
        upiId: '',
        accountHolder: '',
        instructions: 'Please pay your monthly rent directly via UPI or Bank Transfer using the details provided above, and share the payment confirmation with the PG owner or warden.',
        qrImage: '',
      }
    }

    return {
      upiId: details.upiId,
      accountHolder: details.accountHolder,
      instructions: details.instructions,
      qrImage: details.qrImage,
    }
  }

  static async updateOwnerPaymentDetails(
    ownerId: string,
    input: PaymentDetailsInput
  ) {
    const details = await prisma.paymentDetails.upsert({
      where: { ownerId },
      create: {
        ownerId,
        upiId: input.upiId.trim(),
        accountHolder: input.accountHolder.trim(),
        instructions: input.instructions.trim(),
        qrImage: input.qrImage.trim(),
      },
      update: {
        upiId: input.upiId.trim(),
        accountHolder: input.accountHolder.trim(),
        instructions: input.instructions.trim(),
        qrImage: input.qrImage.trim(),
      },
    })

    return {
      upiId: details.upiId,
      accountHolder: details.accountHolder,
      instructions: details.instructions,
      qrImage: details.qrImage,
    }
  }

  /* ------------------------------------------------ Student Endpoints */

  /** List bills for logged-in student (non-draft only) */
  static async getStudentBills(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    })

    if (!student) {
      return []
    }

    // A student can NEVER see DRAFT bills
    const bills = await prisma.rentBill.findMany({
      where: {
        studentId: student.id,
        draft: false,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        payments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    })

    return bills.map(formatBillResponse)
  }

  /** Get specific invoice for student */
  static async getStudentInvoice(studentUserId: string, billId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    })

    if (!student) {
      throw AppError.notFound('Student profile not found')
    }

    const bill = await prisma.rentBill.findUnique({
      where: { id: billId },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        payments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    // Strict privacy: student cannot see other students' bills or draft bills
    if (!bill || bill.studentId !== student.id || bill.draft) {
      throw AppError.notFound('Invoice not found')
    }

    // Get owner's payment details
    const paymentDetails = await prisma.paymentDetails.findUnique({
      where: { ownerId: bill.property.ownerId },
    })

    return {
      bill: formatBillResponse(bill),
      property: {
        id: bill.property.id,
        name: bill.property.name,
        address: bill.property.address,
        city: bill.property.city,
        locality: bill.property.locality,
      },
      owner: {
        name: bill.property.owner.fullName,
        phone: bill.property.contactPhone || bill.property.owner.mobile,
        email: bill.property.contactEmail || bill.property.owner.email,
      },
      paymentDetails: paymentDetails
        ? {
            upiId: paymentDetails.upiId,
            accountHolder: paymentDetails.accountHolder,
            instructions: paymentDetails.instructions,
            qrImage: paymentDetails.qrImage,
          }
        : null,
    }
  }

  /** Get payment details of student's PG owner */
  static async getStudentOwnerPaymentDetails(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        property: true,
      },
    })

    if (!student || !student.property) {
      return {
        upiId: '',
        accountHolder: '',
        instructions: '',
        qrImage: '',
      }
    }

    const details = await prisma.paymentDetails.findUnique({
      where: { ownerId: student.property.ownerId },
    })

    if (!details) {
      return {
        upiId: '',
        accountHolder: '',
        instructions: 'Please pay your monthly rent directly via UPI or Bank Transfer using the details provided above, and share the payment confirmation with the PG owner.',
        qrImage: '',
      }
    }

    return {
      upiId: details.upiId,
      accountHolder: details.accountHolder,
      instructions: details.instructions,
      qrImage: details.qrImage,
    }
  }
}
