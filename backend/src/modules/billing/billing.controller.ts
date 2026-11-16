import type { Request, Response, NextFunction } from 'express'
import {
  BillingService,
} from './billing.service.js'
import {
  billInputSchema,
  paymentDetailsSchema,
  paymentInputSchema,
} from './billing.validation.js'

export class BillingController {
  /* ------------------------------------------------------------- Owner */

  static async getOwnerBills(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const propertyId = req.query.propertyId as string | undefined
      const bills = await BillingService.getOwnerBills(ownerId, propertyId)
      res.json({ data: bills })
    } catch (err) {
      next(err)
    }
  }

  static async getOwnerBillById(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const { id } = req.params
      const bill = await BillingService.getOwnerBillById(ownerId, id)
      res.json({ data: bill })
    } catch (err) {
      next(err)
    }
  }

  static async saveBill(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const validated = billInputSchema.parse(req.body)
      const bill = await BillingService.saveBill(ownerId, validated)
      res.status(200).json({ data: bill })
    } catch (err) {
      next(err)
    }
  }

  static async cancelBill(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const { id } = req.params
      const result = await BillingService.cancelBill(ownerId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const validated = paymentInputSchema.parse(req.body)
      const result = await BillingService.recordPayment(ownerId, validated)
      res.status(201).json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async getOwnerPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const propertyId = req.query.propertyId as string | undefined
      const payments = await BillingService.getOwnerPayments(ownerId, propertyId)
      res.json({ data: payments })
    } catch (err) {
      next(err)
    }
  }

  static async getOwnerPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const details = await BillingService.getOwnerPaymentDetails(ownerId)
      res.json({ data: details })
    } catch (err) {
      next(err)
    }
  }

  static async updateOwnerPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.sub
      const validated = paymentDetailsSchema.parse(req.body)
      const updated = await BillingService.updateOwnerPaymentDetails(ownerId, validated)
      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  /* ----------------------------------------------------------- Student */

  static async getStudentBills(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const bills = await BillingService.getStudentBills(studentUserId)
      res.json({ data: bills })
    } catch (err) {
      next(err)
    }
  }

  static async getStudentInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const { id } = req.params
      const invoice = await BillingService.getStudentInvoice(studentUserId, id)
      res.json({ data: invoice })
    } catch (err) {
      next(err)
    }
  }

  static async getStudentOwnerPaymentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const details = await BillingService.getStudentOwnerPaymentDetails(studentUserId)
      res.json({ data: details })
    } catch (err) {
      next(err)
    }
  }
}
