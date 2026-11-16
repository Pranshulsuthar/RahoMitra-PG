import type { Request, Response, NextFunction } from 'express'
import { CommunicationService } from './communication.service.js'
import {
  announcementInputSchema,
  complaintCommentSchema,
  complaintPrioritySchema,
  complaintStatusUpdateSchema,
  complaintSubmitSchema,
  sendMessageSchema,
  startConversationSchema,
  studentProfileSchema,
  studentSettingsSchema,
} from './communication.validation.js'

export class CommunicationController {
  /* ------------------------------------------------------------- Messaging */

  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const role = req.user!.role
      const convs = await CommunicationService.getConversations(userId, role)
      res.json({ data: convs })
    } catch (err) {
      next(err)
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const { id } = req.params
      const messages = await CommunicationService.getMessages(userId, id)
      res.json({ data: messages })
    } catch (err) {
      next(err)
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const validated = sendMessageSchema.parse(req.body)
      const message = await CommunicationService.sendMessage(
        userId,
        validated.conversationId,
        validated.text
      )
      res.status(201).json({ data: message })
    } catch (err) {
      next(err)
    }
  }

  static async markConversationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const { id } = req.params
      const result = await CommunicationService.markConversationRead(userId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async getOrCreateConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.user!.sub
      const validated = startConversationSchema.parse(req.body)
      const conv = await CommunicationService.getOrCreateConversation(
        ownerUserId,
        validated.propertyId,
        validated.studentId
      )
      res.json({ data: conv })
    } catch (err) {
      next(err)
    }
  }

  /* ------------------------------------------------------------ Complaints */

  static async getComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const role = req.user!.role
      const propertyId = req.query.propertyId as string | undefined
      const complaints = await CommunicationService.getComplaints(userId, role, propertyId)
      res.json({ data: complaints })
    } catch (err) {
      next(err)
    }
  }

  static async getComplaintById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const { id } = req.params
      const complaint = await CommunicationService.getComplaintById(userId, id)
      res.json({ data: complaint })
    } catch (err) {
      next(err)
    }
  }

  static async submitComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const validated = complaintSubmitSchema.parse(req.body)
      const complaint = await CommunicationService.submitComplaint(
        studentUserId,
        validated
      )
      res.status(201).json({ data: complaint })
    } catch (err) {
      next(err)
    }
  }

  static async updateComplaintStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.user!.sub
      const { id } = req.params
      const validated = complaintStatusUpdateSchema.parse(req.body)
      const updated = await CommunicationService.updateComplaintStatus(
        ownerUserId,
        id,
        validated.status as any,
        validated.note
      )
      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  static async addComplaintComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const { id } = req.params
      const validated = complaintCommentSchema.parse(req.body)
      const updated = await CommunicationService.addComplaintComment(
        userId,
        id,
        validated.body,
        validated.title
      )
      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  static async setComplaintPriority(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.user!.sub
      const { id } = req.params
      const validated = complaintPrioritySchema.parse(req.body)
      const updated = await CommunicationService.setComplaintPriority(
        ownerUserId,
        id,
        validated.priority as any
      )
      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  /* --------------------------------------------------------- Announcements */

  static async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const role = req.user!.role
      const propertyId = req.query.propertyId as string | undefined
      const announcements = await CommunicationService.getAnnouncements(userId, role, propertyId)
      res.json({ data: announcements })
    } catch (err) {
      next(err)
    }
  }

  static async saveAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.user!.sub
      const validated = announcementInputSchema.parse(req.body)
      const publish = req.body.published !== undefined ? Boolean(req.body.published) : true
      const id = await CommunicationService.saveAnnouncement(ownerUserId, validated, publish)
      res.status(201).json({ data: { id } })
    } catch (err) {
      next(err)
    }
  }

  static async toggleAnnouncementPublished(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.user!.sub
      const { id } = req.params
      const result = await CommunicationService.toggleAnnouncementPublished(ownerUserId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerUserId = req.user!.sub
      const { id } = req.params
      const result = await CommunicationService.deleteAnnouncement(ownerUserId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async markAnnouncementRead(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const { id } = req.params
      const result = await CommunicationService.markAnnouncementRead(studentUserId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  /* --------------------------------------------------------- Notifications */

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const notifications = await CommunicationService.getNotifications(userId)
      res.json({ data: notifications })
    } catch (err) {
      next(err)
    }
  }

  static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const { id } = req.params
      const result = await CommunicationService.markNotificationRead(userId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const result = await CommunicationService.markAllNotificationsRead(userId)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  static async clearNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub
      const { id } = req.params
      const result = await CommunicationService.clearNotification(userId, id)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }

  /* --------------------------------- Student Notices, Profile & Settings */

  static async getStudentNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const notices = await CommunicationService.getStudentNotices(studentUserId)
      res.json({ data: notices })
    } catch (err) {
      next(err)
    }
  }

  static async getStudentProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const profile = await CommunicationService.getStudentProfile(studentUserId)
      res.json({ data: profile })
    } catch (err) {
      next(err)
    }
  }

  static async updateStudentProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const validated = studentProfileSchema.parse(req.body)
      const updated = await CommunicationService.updateStudentProfile(studentUserId, validated)
      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  static async getStudentSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const settings = await CommunicationService.getStudentSettings(studentUserId)
      res.json({ data: settings })
    } catch (err) {
      next(err)
    }
  }

  static async updateStudentSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.sub
      const validated = studentSettingsSchema.parse(req.body)
      const updated = await CommunicationService.updateStudentSettings(studentUserId, validated)
      res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }
}
