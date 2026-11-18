import { Request, Response, NextFunction } from 'express';
import { ownerService } from './owner.service.js';
import {
  createPropertySchema,
  updatePropertySchema,
  setPropertyStatusSchema,
  createRoomSchema,
  updateRoomSchema,
  setBedStatusSchema,
  setMembershipSchema,
  createStaffSchema,
  updateStaffSchema,
  updateProfileSchema,
  generateCodeSchema,
  decideRequestSchema,
} from './owner.validation.js';

export class OwnerController {
  private getOwnerId(req: Request): string {
    return req.user!.sub;
  }

  async selectSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId, cycle, method } = req.body as { planId?: string; cycle?: string; method?: string };
      if (!planId || !cycle || !method) {
        res.status(400).json({ error: { code: 'INVALID_SUBSCRIPTION_REQUEST', message: 'Plan, billing cycle and payment method are required.' } });
        return;
      }
      if (!['MONTHLY', 'YEARLY'].includes(cycle) || !['UPI', 'CASH'].includes(method)) {
        res.status(400).json({ error: { code: 'INVALID_SUBSCRIPTION_REQUEST', message: 'Invalid billing cycle or payment method.' } });
        return;
      }
      const data = await ownerService.selectSubscription(this.getOwnerId(req), planId, cycle as 'MONTHLY' | 'YEARLY', method as 'UPI' | 'CASH');
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ownerService.getDashboardData(this.getOwnerId(req));
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const properties = await ownerService.getProperties(this.getOwnerId(req));
      res.status(200).json({ data: properties });
    } catch (err) {
      next(err);
    }
  }

  async createProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createPropertySchema.parse(req.body);
      const property = await ownerService.createProperty(this.getOwnerId(req), validated);
      res.status(201).json({ data: property });
    } catch (err) {
      next(err);
    }
  }

  async updateProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updatePropertySchema.parse(req.body);
      const updated = await ownerService.updateProperty(this.getOwnerId(req), req.params.id, validated);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async setPropertyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = setPropertyStatusSchema.parse(req.body);
      const updated = await ownerService.setPropertyStatus(this.getOwnerId(req), req.params.id, validated.status);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await ownerService.getRooms(this.getOwnerId(req), req.query.propertyId as string | undefined);
      res.status(200).json({ data: rooms });
    } catch (err) {
      next(err);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createRoomSchema.parse(req.body);
      const room = await ownerService.createRoom(this.getOwnerId(req), validated);
      res.status(201).json({ data: room });
    } catch (err) {
      next(err);
    }
  }

  async updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateRoomSchema.parse(req.body);
      const updated = await ownerService.updateRoom(this.getOwnerId(req), req.params.id, validated);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ownerService.deleteRoom(this.getOwnerId(req), req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async addBed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bed = await ownerService.addBed(this.getOwnerId(req), req.params.roomId);
      res.status(201).json({ data: bed });
    } catch (err) {
      next(err);
    }
  }

  async setBedStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = setBedStatusSchema.parse(req.body);
      const updated = await ownerService.setBedStatus(this.getOwnerId(req), req.params.id, validated.status);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await ownerService.getStudents(this.getOwnerId(req), req.query.propertyId as string | undefined);
      res.status(200).json({ data: students });
    } catch (err) {
      next(err);
    }
  }

  async setMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = setMembershipSchema.parse(req.body);
      const updated = await ownerService.setStudentMembership(this.getOwnerId(req), req.params.id, validated.status);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await ownerService.getStaff(this.getOwnerId(req), req.query.propertyId as string | undefined);
      res.status(200).json({ data: staff });
    } catch (err) {
      next(err);
    }
  }

  async addStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createStaffSchema.parse(req.body);
      const staff = await ownerService.addStaff(this.getOwnerId(req), validated);
      res.status(201).json({ data: staff });
    } catch (err) {
      next(err);
    }
  }

  async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateStaffSchema.parse(req.body);
      const updated = await ownerService.updateStaff(this.getOwnerId(req), req.params.id, validated);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async removeStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ownerService.removeStaff(this.getOwnerId(req), req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const codes = await ownerService.getAdmissionCodes(this.getOwnerId(req), req.query.propertyId as string | undefined);
      res.status(200).json({ data: codes });
    } catch (err) {
      next(err);
    }
  }

  async generateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = generateCodeSchema.parse(req.body);
      const code = await ownerService.generateAdmissionCode(this.getOwnerId(req), validated);
      res.status(201).json({ data: code });
    } catch (err) {
      next(err);
    }
  }

  async revokeCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ownerService.revokeAdmissionCode(this.getOwnerId(req), req.params.id);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await ownerService.getAdmissionRequests(
        this.getOwnerId(req),
        req.query.propertyId as string | undefined
      );
      res.status(200).json({ data: requests });
    } catch (err) {
      next(err);
    }
  }

  async decideRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = decideRequestSchema.parse(req.body);
      const updated = await ownerService.decideAdmissionRequest(this.getOwnerId(req), req.params.id, validated);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await ownerService.getProfile(this.getOwnerId(req));
      res.status(200).json({ data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const updated = await ownerService.updateProfile(this.getOwnerId(req), validated);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await ownerService.getNotifications(this.getOwnerId(req));
      res.status(200).json({ data: notifications });
    } catch (err) {
      next(err);
    }
  }

  async markNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const read = req.body?.read !== false;
      const updated = await ownerService.markNotificationRead(this.getOwnerId(req), req.params.id, read);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async markAllNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ownerService.markAllNotificationsRead(this.getOwnerId(req));
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async removeNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ownerService.removeNotification(this.getOwnerId(req), req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await ownerService.getActivities(this.getOwnerId(req));
      res.status(200).json({ data: activities });
    } catch (err) {
      next(err);
    }
  }
}

export const ownerController = new OwnerController();
