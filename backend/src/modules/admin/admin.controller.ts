import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import {
  advertisementCreateSchema,
  advertisementStatusSchema,
  advertisementUpdateSchema,
  featuredListingStatusSchema,
  featuredRequestDecisionSchema,
  featuredRequestSubmitSchema,
  ownerApplicationDecisionSchema,
  ownerStatusSchema,
  pgStatusSchema,
  planCreateSchema,
  planUpdateSchema,
  platformNotificationSchema,
  studentMembershipSchema,
  subscriptionUpdateSchema,
  ticketAssignSchema,
  ticketPrioritySchema,
  ticketReplySchema,
  ticketStatusSchema,
} from './admin.validation.js';
import { AppError } from '../../utils/errors.js';

export class AdminController {
  /* ------------------------------------------------------------- Applications */
  async getApplications(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getApplications();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async decideApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ownerApplicationDecisionSchema.parse(req.body);
      const data = await AdminService.decideApplication(req.user!.sub, id, parsed.status, parsed.reason);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ---------------------------------------------------------------------- PGs */
  async getPgs(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getPgs();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setPgStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = pgStatusSchema.parse(req.body);
      const data = await AdminService.setPgStatus(req.user!.sub, id, parsed.status, parsed.statusNote);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ------------------------------------------------------- Owners & Students */
  async getOwners(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getOwners();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setOwnerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ownerStatusSchema.parse(req.body);
      const data = await AdminService.setOwnerStatus(req.user!.sub, id, parsed.status);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getStudents(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getStudents();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setStudentMembership(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = studentMembershipSchema.parse(req.body);
      const data = await AdminService.setStudentMembership(req.user!.sub, id, parsed.membership);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* -------------------------------------------------------------------- Plans */
  async getPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getPlans();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = planCreateSchema.parse(req.body);
      const data = await AdminService.createPlan(req.user!.sub, parsed);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = planUpdateSchema.parse(req.body);
      const data = await AdminService.updatePlan(req.user!.sub, id, parsed);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await AdminService.deletePlan(req.user!.sub, id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ----------------------------------------------------------- Subscriptions */
  async getSubscriptions(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getSubscriptions();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = subscriptionUpdateSchema.parse(req.body);
      const data = await AdminService.updateSubscription(req.user!.sub, id, parsed);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getPayments(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getPayments();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ------------------------------------------------------- Featured Requests */
  async getFeaturedRequests(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getFeaturedRequests();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async submitFeaturedRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = featuredRequestSubmitSchema.parse(req.body);
      const data = await AdminService.submitFeaturedRequest(req.user!.sub, req.user!.role, parsed);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async decideFeaturedRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = featuredRequestDecisionSchema.parse(req.body);
      const data = await AdminService.decideFeaturedRequest(req.user!.sub, id, parsed.decision, {
        durationMonths: parsed.durationMonths,
        reason: parsed.reason,
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setFeaturedListingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = featuredListingStatusSchema.parse(req.body);
      const data = await AdminService.setFeaturedListingStatus(req.user!.sub, id, parsed.status);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ---------------------------------------------------------- Advertisements */
  async getAdvertisements(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getAdvertisements();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async createAdvertisement(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = advertisementCreateSchema.parse(req.body);
      const data = await AdminService.createAdvertisement(req.user!.sub, parsed);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async updateAdvertisement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = advertisementUpdateSchema.parse(req.body);
      const data = await AdminService.updateAdvertisement(req.user!.sub, id, parsed);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setAdvertisementStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = advertisementStatusSchema.parse(req.body);
      const data = await AdminService.updateAdvertisement(req.user!.sub, id, { status: parsed.status });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async deleteAdvertisement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await AdminService.deleteAdvertisement(req.user!.sub, id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ---------------------------------------------------------------- Settings */
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getSettings();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async saveSettings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body || typeof req.body !== 'object') {
        throw AppError.badRequest('Settings payload must be an object');
      }
      const data = await AdminService.saveSettings(req.user!.sub, req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async resetSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.resetSettings(req.user!.sub);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* --------------------------------------------------------- Stats & Activities */
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getStats();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getActivities(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getActivities();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ---------------------------------------------------------- Support Tickets */
  async getTickets(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getTickets();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setTicketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ticketStatusSchema.parse(req.body);
      const data = await AdminService.updateTicket(req.user!.sub, id, { status: parsed.status });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async setTicketPriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ticketPrioritySchema.parse(req.body);
      const data = await AdminService.updateTicket(req.user!.sub, id, { priority: parsed.priority });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async assignTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ticketAssignSchema.parse(req.body);
      const data = await AdminService.updateTicket(req.user!.sub, id, { assignedToId: parsed.staff });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async addTicketReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ticketReplySchema.parse(req.body);
      const data = await AdminService.addTicketReply(
        req.user!.sub,
        req.user!.role,
        id,
        parsed.text
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  /* ---------------------------------------------------- Platform Notifications */
  async getNotifications(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getNotifications();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = platformNotificationSchema.parse(req.body);
      const data = await AdminService.createNotification(req.user!.sub, parsed);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
