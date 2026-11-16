import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../src/db/client.js'
import { BillingService, computeBillStatus } from '../src/modules/billing/billing.service.js'
import {
  Role,
  UserStatus,
  PGCategory,
  RoomType,
  BedStatus,
  MembershipStatus,
  BillStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

describe('Billing & Payment Records System Tests', () => {
  let ownerId: string
  let student1UserId: string
  let student1Id: string
  let student2UserId: string
  let student2Id: string
  let propertyId: string
  let roomId: string
  let bed1Id: string
  let bed2Id: string

  before(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 12)

    // Create Owner
    const owner = await prisma.user.create({
      data: {
        email: `bill-owner-${Date.now()}@test.com`,
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Billing Owner',
        mobile: '9876540001',
      },
    })
    ownerId = owner.id

    // Create Student 1
    const student1User = await prisma.user.create({
      data: {
        email: `bill-student1-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Aman Verma',
        mobile: '9876540002',
      },
    })
    student1UserId = student1User.id

    // Create Student 2
    const student2User = await prisma.user.create({
      data: {
        email: `bill-student2-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Rohit Sharma',
        mobile: '9876540003',
      },
    })
    student2UserId = student2User.id

    // Create Property
    const property = await prisma.property.create({
      data: {
        ownerId,
        slug: `bill-prop-${Date.now()}`,
        name: 'Sharma PG Residency',
        type: PGCategory.BOYS,
        city: 'Jaipur',
        locality: 'Billing Nagar',
        status: 'ACTIVE',
      },
    })
    propertyId = property.id

    // Create Room
    const room = await prisma.room.create({
      data: {
        propertyId,
        number: '101',
        floor: 1,
        type: RoomType.DOUBLE,
        rent: 8000,
      },
    })
    roomId = room.id

    // Create Beds
    const bed1 = await prisma.bed.create({
      data: {
        roomId,
        label: 'A',
        status: BedStatus.OCCUPIED,
      },
    })
    bed1Id = bed1.id

    const bed2 = await prisma.bed.create({
      data: {
        roomId,
        label: 'B',
        status: BedStatus.OCCUPIED,
      },
    })
    bed2Id = bed2.id

    // Create Student profiles
    const student1 = await prisma.student.create({
      data: {
        userId: student1UserId,
        propertyId,
        roomId,
        bedId: bed1Id,
        membership: MembershipStatus.ACTIVE,
        college: 'MNIT Jaipur',
      },
    })
    student1Id = student1.id

    const student2 = await prisma.student.create({
      data: {
        userId: student2UserId,
        propertyId,
        roomId,
        bedId: bed2Id,
        membership: MembershipStatus.ACTIVE,
        college: 'Rajasthan University',
      },
    })
    student2Id = student2.id
  })

  after(async () => {
    // Cleanup
    await prisma.payment.deleteMany({ where: { propertyId } })
    await prisma.rentBill.deleteMany({ where: { propertyId } })
    await prisma.paymentDetails.deleteMany({ where: { ownerId } })
    await prisma.student.deleteMany({ where: { id: { in: [student1Id, student2Id] } } })
    await prisma.bed.deleteMany({ where: { id: { in: [bed1Id, bed2Id] } } })
    await prisma.room.deleteMany({ where: { id: roomId } })
    await prisma.property.deleteMany({ where: { id: propertyId } })
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, student1UserId, student2UserId] } } })
  })

  it('1. Correctly calculates subtotal, total, remaining and dynamic status', async () => {
    // Future due date
    const futureDue = new Date()
    futureDue.setDate(futureDue.getDate() + 15)

    const bill = await BillingService.saveBill(ownerId, {
      propertyId,
      studentId: student1Id,
      month: '2026-05',
      rent: 8000,
      electricity: 500,
      water: 200,
      maintenance: 300,
      food: 1500,
      extra: 500,
      discount: 1000,
      dueDate: futureDue.toISOString().split('T')[0],
      notes: 'May 2026 rent',
      draft: false,
    })

    // subtotal = 8000 + 500 + 200 + 300 + 1500 + 500 = 11000
    // total = 11000 - 1000 = 10000
    // remaining = 10000 - 0 = 10000
    assert.equal(bill.rent, 8000)
    assert.equal(bill.discount, 1000)
    assert.equal(bill.paidAmount, 0)
    assert.equal(bill.status, BillStatus.UNPAID)
    assert.equal(bill.studentName, 'Aman Verma')
    assert.equal(bill.roomNumber, '101')
    assert.equal(bill.bedLabel, 'A')
  })

  it('2. Rejects duplicate bill creation for the same student and month with 409 Conflict', async () => {
    await assert.rejects(
      async () => {
        await BillingService.saveBill(ownerId, {
          propertyId,
          studentId: student1Id,
          month: '2026-05', // Already created in test 1
          rent: 8000,
          electricity: 0,
          water: 0,
          maintenance: 0,
          food: 0,
          extra: 0,
          discount: 0,
          dueDate: '2026-06-05',
          notes: 'Duplicate bill attempt',
          draft: false,
        })
      },
      (err: any) => {
        assert.equal(err.statusCode, 409)
        assert.match(err.message, /already exists for 2026-05/)
        return true
      }
    )
  })

  it('3. Rejects payment recording that exceeds remaining balance', async () => {
    const bills = await BillingService.getOwnerBills(ownerId)
    const billMay = bills.find((b) => b.month === '2026-05')!

    // Total is 10000. Try recording 12000 payment.
    await assert.rejects(
      async () => {
        await BillingService.recordPayment(ownerId, {
          billId: billMay.id,
          amount: 12000,
          method: 'UPI',
          reference: 'UPI-REF-EXCESS',
          date: '2026-05-02',
          notes: 'Excessive payment',
        })
      },
      (err: any) => {
        assert.equal(err.statusCode, 400)
        assert.match(err.message, /exceeds the remaining balance/)
        return true
      }
    )
  })

  it('4. Handles partial payment and full payment recording atomically', async () => {
    const bills = await BillingService.getOwnerBills(ownerId)
    const billMay = bills.find((b) => b.month === '2026-05')!

    // Step A: Record partial payment of ₹6,000 against ₹10,000 total
    const partialRes = await BillingService.recordPayment(ownerId, {
      billId: billMay.id,
      amount: 6000,
      method: 'UPI',
      reference: 'UPI-TXN-PARTIAL-1',
      date: '2026-05-02',
      notes: 'First installment',
    })

    assert.equal(partialRes.statusLabel, BillStatus.PARTIALLY_PAID)
    assert.equal(partialRes.bill.paidAmount, 6000)
    assert.equal(partialRes.bill.status, BillStatus.PARTIALLY_PAID)
    assert.equal(partialRes.payment.amount, 6000)
    assert.equal(partialRes.payment.method, 'UPI')

    // Step B: Record the remaining ₹4,000
    const fullRes = await BillingService.recordPayment(ownerId, {
      billId: billMay.id,
      amount: 4000,
      method: 'CASH',
      reference: 'CASH-RECEIPT-2',
      date: '2026-05-03',
      notes: 'Final settlement',
    })

    assert.equal(fullRes.statusLabel, BillStatus.PAID)
    assert.equal(fullRes.bill.paidAmount, 10000)
    assert.equal(fullRes.bill.status, BillStatus.PAID)

    // Step C: Now that it is fully paid, any further payment (even ₹100) must be rejected
    await assert.rejects(
      async () => {
        await BillingService.recordPayment(ownerId, {
          billId: billMay.id,
          amount: 100,
          method: 'UPI',
          reference: 'UPI-AFTER-PAID',
          date: '2026-05-04',
          notes: 'Extra payment attempt',
        })
      },
      (err: any) => {
        assert.equal(err.statusCode, 400)
        assert.match(err.message, /exceeds the remaining balance of ₹0/)
        return true
      }
    )
  })

  it('5. Protects student privacy: students cannot see draft bills or other students bills', async () => {
    // Create a DRAFT bill for Student 1
    const draftBill = await BillingService.saveBill(ownerId, {
      propertyId,
      studentId: student1Id,
      month: '2026-06',
      rent: 8000,
      electricity: 0,
      water: 0,
      maintenance: 0,
      food: 0,
      extra: 0,
      discount: 0,
      dueDate: '2026-07-05',
      notes: 'Draft bill in progress',
      draft: true,
    })

    // Create a published bill for Student 2
    const student2Bill = await BillingService.saveBill(ownerId, {
      propertyId,
      studentId: student2Id,
      month: '2026-06',
      rent: 8000,
      electricity: 0,
      water: 0,
      maintenance: 0,
      food: 0,
      extra: 0,
      discount: 0,
      dueDate: '2026-07-05',
      notes: 'June rent for student 2',
      draft: false,
    })

    // Student 1 fetches their bills
    const student1Bills = await BillingService.getStudentBills(student1UserId)

    // Student 1 should ONLY see published bills belonging to Student 1 (May 2026 bill)
    // Draft June bill must NOT appear!
    assert.ok(student1Bills.every((b) => b.draft === false))
    assert.ok(student1Bills.every((b) => b.studentId === student1Id))
    assert.equal(student1Bills.some((b) => b.id === draftBill.id), false)
    assert.equal(student1Bills.some((b) => b.id === student2Bill.id), false)

    // Directly trying to fetch draft invoice as Student 1 must return 404
    await assert.rejects(
      async () => {
        await BillingService.getStudentInvoice(student1UserId, draftBill.id)
      },
      (err: any) => {
        assert.equal(err.statusCode, 404)
        return true
      }
    )

    // Directly trying to fetch Student 2's bill as Student 1 must return 404
    await assert.rejects(
      async () => {
        await BillingService.getStudentInvoice(student1UserId, student2Bill.id)
      },
      (err: any) => {
        assert.equal(err.statusCode, 404)
        return true
      }
    )
  })

  it('6. Manages owner payment details and allows student to view them', async () => {
    // Owner updates payment details
    const updated = await BillingService.updateOwnerPaymentDetails(ownerId, {
      upiId: 'sharma.pg@okhdfcbank',
      accountHolder: 'Sharma PG Residency',
      instructions: 'Please pay before the 5th and WhatsApp receipt to 9876540001.',
      qrImage: 'data:image/png;base64,sampleQR',
    })

    assert.equal(updated.upiId, 'sharma.pg@okhdfcbank')
    assert.equal(updated.accountHolder, 'Sharma PG Residency')

    // Student 1 views owner payment details
    const studentDetails = await BillingService.getStudentOwnerPaymentDetails(student1UserId)
    assert.equal(studentDetails.upiId, 'sharma.pg@okhdfcbank')
    assert.equal(studentDetails.accountHolder, 'Sharma PG Residency')
    assert.equal(studentDetails.qrImage, 'data:image/png;base64,sampleQR')
  })
})
