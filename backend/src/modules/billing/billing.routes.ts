import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireAuth, requireRole } from '../auth/auth.middleware.js'
import { BillingController } from './billing.controller.js'

export const billingRouter = Router()

// All billing endpoints require authentication
billingRouter.use(requireAuth)

/* ------------------------------------------------------------- Owner Routes */
billingRouter.get(
  '/owner/bills',
  requireRole(Role.OWNER),
  BillingController.getOwnerBills
)
billingRouter.get(
  '/owner/bills/:id',
  requireRole(Role.OWNER),
  BillingController.getOwnerBillById
)
billingRouter.post(
  '/owner/bills',
  requireRole(Role.OWNER),
  BillingController.saveBill
)
billingRouter.delete(
  '/owner/bills/:id',
  requireRole(Role.OWNER),
  BillingController.cancelBill
)
billingRouter.post(
  '/owner/payments',
  requireRole(Role.OWNER),
  BillingController.recordPayment
)
billingRouter.get(
  '/owner/payments',
  requireRole(Role.OWNER),
  BillingController.getOwnerPayments
)
billingRouter.get(
  '/owner/payment-details',
  requireRole(Role.OWNER),
  BillingController.getOwnerPaymentDetails
)
billingRouter.put(
  '/owner/payment-details',
  requireRole(Role.OWNER),
  BillingController.updateOwnerPaymentDetails
)

/* ----------------------------------------------------------- Student Routes */
billingRouter.get(
  '/student/bills',
  requireRole(Role.STUDENT),
  BillingController.getStudentBills
)
billingRouter.get(
  '/student/bills/:id/invoice',
  requireRole(Role.STUDENT),
  BillingController.getStudentInvoice
)
billingRouter.get(
  '/student/payment-details',
  requireRole(Role.STUDENT),
  BillingController.getStudentOwnerPaymentDetails
)
