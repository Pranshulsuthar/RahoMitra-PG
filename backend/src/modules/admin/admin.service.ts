import {
  ApplicationStatus,
  BillingCycle,
  FeaturedListingStatus,
  FeaturedRequestStatus,
  FeaturedTier,
  PaymentStatus,
  PropertyStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/errors.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

export const DEFAULT_PLATFORM_SETTINGS = {
  platformName: 'RAHO MITRA',
  hindiName: 'रहो मित्र',
  tagline: 'आपके रहने का डिजिटल साथी',
  description: 'RahoMitra is a platform for discovering PG accommodation, managing properties and handling student admissions.',
  supportEmail: 'support@rahomitra.com',
  supportPhone: '+91 98765 43210',
  currency: 'INR (₹)',
  country: 'India',
  timezone: 'Asia/Kolkata',
  logoPreview: '/RahoMitra_logo.png',
  faviconPreview: '/RahoMitra_logo.png',
  brandColors: {
    forest: '#173D32',
    ivory: '#F5F1E7',
    gold: '#C49A52',
    dark: '#252A27',
  },
  websiteTitle: 'RahoMitra — Find your perfect PG',
  footerDescription: 'RahoMitra helps students discover PG accommodation and helps owners manage their properties.',
  trialDurationDays: 14,
  gracePeriodDays: 7,
  featuredPrice: 299,
  premiumFeaturedPrice: 499,
  adPriceBase: 2000,
  notify: {
    newOwnerApplication: true,
    newPgApproval: true,
    newStudentRegistration: false,
    newComplaint: true,
    subscriptionExpiry: true,
    featuredRequest: true,
  },
  maintenanceMode: false,
  maintenanceMessage: 'RahoMitra is undergoing scheduled maintenance. Please check back soon.',
};

export class AdminService {
  /* ------------------------------------------------------------- Activity Logging */
  static async logActivity(
    actorId: string | null,
    action: string,
    entity: string,
    description: string,
    metadata?: any
  ) {
    try {
      return await prisma.activityLog.create({
        data: {
          actorId,
          actorRole: Role.ADMIN,
          action,
          entity,
          description,
          metadata: metadata || {},
        },
      });
    } catch {
      // Activity logging failure shouldn't abort the primary operation
      return null;
    }
  }

  /* ----------------------------------------------------------- Owner Applications */
  static async getApplications() {
    const list = await prisma.ownerApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return list.map((a) => ({
      id: a.id,
      ownerName: a.ownerName,
      email: a.email,
      pgName: a.pgName,
      city: a.city,
      category: a.category,
      submittedOn: a.submittedOn.toISOString().slice(0, 10),
      status: a.status,
      rejectionReason: a.rejectionReason || undefined,
      note: a.note || '',
    }));
  }

  static async decideApplication(adminId: string, id: string, decision: 'APPROVED' | 'REJECTED', reason?: string) {
    const app = await prisma.ownerApplication.findUnique({ where: { id } });
    if (!app) throw AppError.notFound('Owner application not found');

    const updated = await prisma.ownerApplication.update({
      where: { id },
      data: {
        status: decision as ApplicationStatus,
        rejectionReason: decision === 'REJECTED' ? reason || 'Application rejected by Super Admin' : null,
      },
    });

    if (decision === 'APPROVED') {
      // Activate user account if user exists with this email
      await prisma.user.updateMany({
        where: { email: app.email.toLowerCase() },
        data: { status: UserStatus.ACTIVE },
      });
    }

    await this.logActivity(
      adminId,
      `Owner application ${decision.toLowerCase()}`,
      `${app.id} · ${app.pgName}`,
      reason || `Application marked ${decision} by Super Admin`
    );

    return updated;
  }

  /* ---------------------------------------------------------------- PG Management */
  static async getPgs() {
    const properties = await prisma.property.findMany({
      include: {
        owner: { select: { id: true, fullName: true } },
        rooms: { select: { id: true, rent: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p) => {
      const minRent = p.rooms.length > 0 ? Math.min(...p.rooms.map((r) => r.rent)) : 0;
      return {
        id: p.id,
        name: p.name,
        ownerId: p.ownerId,
        ownerName: p.owner.fullName,
        city: p.city,
        locality: p.locality,
        category: p.type,
        registeredOn: p.createdAt.toISOString().slice(0, 10),
        status: p.status === PropertyStatus.ACTIVE ? 'APPROVED' : p.status,
        statusNote: p.statusNote || undefined,
        rent: minRent,
        address: p.address,
        description: p.description,
        facilities: p.facilities,
        roomCategories: p.rooms.map((r) => ({
          label: `${r.type} Sharing`,
          sharing: r.type,
          rent: r.rent,
        })),
        coverImage: p.coverImage,
        gallery: p.gallery,
      };
    });
  }

  static async setPgStatus(adminId: string, id: string, status: string, statusNote?: string) {
    const pg = await prisma.property.findUnique({ where: { id } });
    if (!pg) throw AppError.notFound('Property not found');

    const dbStatus =
      status === 'APPROVED'
        ? PropertyStatus.ACTIVE
        : (status as PropertyStatus);

    const updated = await prisma.property.update({
      where: { id },
      data: {
        status: dbStatus,
        statusNote: statusNote || null,
      },
    });

    await this.logActivity(
      adminId,
      `PG status changed to ${status}`,
      `${pg.id} · ${pg.name}`,
      statusNote || `PG listing status set to ${status}`
    );

    return {
      ...updated,
      status: updated.status === PropertyStatus.ACTIVE ? 'APPROVED' : updated.status,
    };
  }

  /* ----------------------------------------------------- Owners & Students Admin */
  static async getOwners() {
    const owners = await prisma.user.findMany({
      where: { role: Role.OWNER },
      include: {
        properties: { select: { id: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { planId: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return owners.map((o) => {
      const latestSub = o.subscriptions[0];
      return {
        id: o.id,
        name: o.fullName,
        email: o.email,
        city: o.city || 'Jaipur',
        status: o.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED',
        joinedOn: o.createdAt.toISOString().slice(0, 10),
        planId: latestSub?.planId || 'starter',
        subscriptionStatus: latestSub?.status || 'ACTIVE',
        pgIds: o.properties.map((p) => p.id),
      };
    });
  }

  static async setOwnerStatus(adminId: string, id: string, status: 'ACTIVE' | 'SUSPENDED') {
    const owner = await prisma.user.findUnique({ where: { id } });
    if (!owner) throw AppError.notFound('Owner account not found');

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: status === 'ACTIVE' ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
      },
    });

    // If suspended, IMMEDIATELY revoke all sessions and refresh tokens
    if (status === 'SUSPENDED') {
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    await this.logActivity(
      adminId,
      `Owner status set to ${status}`,
      `${owner.id} · ${owner.fullName}`,
      `Owner account ${status.toLowerCase()} by Super Admin`
    );

    return updated;
  }

  static async getStudents() {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, createdAt: true } },
        property: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((s) => ({
      id: s.id,
      name: s.user.fullName,
      email: s.user.email,
      pgId: s.propertyId,
      pgName: s.property?.name || 'Unassigned',
      city: s.city || 'Jaipur',
      membership: s.membership,
      registeredOn: s.user.createdAt.toISOString().slice(0, 10),
    }));
  }

  static async setStudentMembership(adminId: string, id: string, membership: 'ACTIVE' | 'INACTIVE') {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) throw AppError.notFound('Student not found');

    const updated = await prisma.student.update({
      where: { id },
      data: { membership },
    });

    // If inactive, invalidate sessions
    if (membership === 'INACTIVE') {
      await prisma.session.deleteMany({
        where: { userId: student.userId },
      });
    }

    await this.logActivity(
      adminId,
      `Student membership set to ${membership}`,
      `${student.id} · ${student.user.fullName}`,
      `Membership ${membership.toLowerCase()} by Super Admin`
    );

    return updated;
  }

  /* ------------------------------------------------------------- Plans Management */
  static async getPlans() {
    const plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      features: p.features,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      status: p.status,
      propertyLimit: p.propertyLimit,
      billing: p.billing,
      featureToggles: (p.featureToggles as any) || [],
      custom: p.isCustom,
    }));
  }

  static async createPlan(adminId: string, data: any) {
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        tagline: data.tagline || '',
        features: data.features || [],
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        propertyLimit: data.propertyLimit,
        billing: data.billing || BillingCycle.MONTHLY,
        featureToggles: data.featureToggles || [],
        status: data.status || 'ENABLED',
        isCustom: true,
      },
    });

    await this.logActivity(
      adminId,
      'Subscription plan created',
      `${plan.id} · ${plan.name}`,
      `Created custom plan with limit ${plan.propertyLimit}`
    );

    return plan;
  }

  static async updatePlan(adminId: string, id: string, patch: any) {
    const plan = await prisma.plan.update({
      where: { id },
      data: patch,
    });

    await this.logActivity(
      adminId,
      'Subscription plan updated',
      `${plan.id} · ${plan.name}`,
      'Updated plan settings'
    );

    return plan;
  }

  static async deletePlan(adminId: string, id: string) {
    // Check if active subscribers exist
    const activeSubscribers = await prisma.subscription.count({
      where: {
        planId: id,
        status: { in: ['ACTIVE', 'TRIAL', 'PENDING'] },
      },
    });

    if (activeSubscribers > 0) {
      throw AppError.badRequest(`Cannot delete plan with ${activeSubscribers} active subscribers`);
    }

    await prisma.plan.delete({ where: { id } });

    await this.logActivity(
      adminId,
      'Subscription plan deleted',
      id,
      'Plan deleted by Super Admin'
    );

    return { ok: true };
  }

  /* ---------------------------------------------------------------- Subscriptions */
  static async getSubscriptions() {
    const subs = await prisma.subscription.findMany({
      include: {
        owner: { select: { fullName: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subs.map((s) => ({
      id: s.id,
      pgName: 'Property',
      ownerName: s.owner.fullName,
      planId: s.planId,
      cycle: s.cycle,
      startOn: s.startOn.toISOString().slice(0, 10),
      expiryOn: s.expiryOn.toISOString().slice(0, 10),
      status: s.status,
      amount: s.amount,
      suspended: s.suspended,
      events: s.events.map((e) => ({
        id: e.id,
        on: e.createdAt.toISOString().slice(0, 10),
        text: e.text,
      })),
    }));
  }

  static async updateSubscription(adminId: string, id: string, data: any) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw AppError.notFound('Subscription not found');

    const updateData: any = {};
    const auditEvents: string[] = [];

    if (data.status) {
      updateData.status = data.status;
      auditEvents.push(`Status changed to ${data.status}`);
    }

    if (data.planId) {
      updateData.planId = data.planId;
      auditEvents.push(`Plan switched to ${data.planId}`);
    }

    if (typeof data.suspended === 'boolean') {
      updateData.suspended = data.suspended;
      auditEvents.push(data.suspended ? 'Subscription suspended' : 'Subscription reactivated');
    }

    if (data.extendDays && data.extendDays > 0) {
      const currentExpiry = new Date(sub.expiryOn);
      const newExpiry = new Date(currentExpiry.getTime() + data.extendDays * 24 * 60 * 60 * 1000);
      updateData.expiryOn = newExpiry;
      auditEvents.push(`Extended by ${data.extendDays} days`);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    for (const text of auditEvents) {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: id,
          text,
        },
      });
    }

    await this.logActivity(
      adminId,
      'Subscription updated',
      sub.id,
      auditEvents.join('; ') || 'Subscription updated'
    );

    return updated;
  }

  /* ------------------------------------------------------------- SaaS Payments */
  static async getPayments() {
    return prisma.platformPayment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /* --------------------------------------------------- Featured Listings (2 Tiers) */
  static async getFeaturedRequests() {
    // Automatic expiry check
    await prisma.featuredRequest.updateMany({
      where: {
        listingStatus: 'ACTIVE',
        endOn: { lt: new Date() },
      },
      data: { listingStatus: 'EXPIRED' },
    });

    const list = await prisma.featuredRequest.findMany({
      include: {
        property: { select: { name: true } },
        owner: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((r) => ({
      id: r.id,
      pgId: r.propertyId,
      pgName: r.property.name,
      ownerName: r.owner.fullName,
      tier: r.tier,
      amount: r.amount,
      requestedOn: r.requestedOn.toISOString().slice(0, 10),
      status: r.status,
      durationMonths: r.durationMonths,
      startOn: r.startOn?.toISOString().slice(0, 10),
      endOn: r.endOn?.toISOString().slice(0, 10),
      listingStatus: r.listingStatus,
      rejectReason: r.rejectReason || undefined,
      history: (r.history as any) || [],
    }));
  }

  static async submitFeaturedRequest(
    callerId: string,
    callerRole: Role,
    data: { pgId: string; tier: FeaturedTier; amount: number; durationMonths?: number }
  ) {
    // 1. Enforce Tier Pricing on server
    const settings = await this.getSettings();
    const months = data.durationMonths || 1;
    const unitPrice = data.tier === 'PREMIUM_FEATURED' ? settings.premiumFeaturedPrice : settings.featuredPrice;
    const expectedAmount = unitPrice * months;

    if (data.amount !== expectedAmount) {
      throw AppError.badRequest(
        `Invalid price for tier ${data.tier}: expected ₹${expectedAmount} (${months} mo x ₹${unitPrice}) but received ₹${data.amount}`
      );
    }

    // 2. Validate property
    const property = await prisma.property.findUnique({
      where: { id: data.pgId },
    });
    if (!property) throw AppError.notFound('Property not found');
    if (callerRole !== Role.ADMIN && property.ownerId !== callerId) {
      throw AppError.forbidden('You do not own this property');
    }

    const historyEntry = {
      id: `fh-${Date.now()}`,
      on: new Date().toISOString().slice(0, 10),
      text: `${callerRole === Role.ADMIN ? 'Admin' : 'Owner'} requested ${data.tier} for ${months} month(s)`,
    };

    return prisma.featuredRequest.create({
      data: {
        propertyId: data.pgId,
        ownerId: property.ownerId,
        tier: data.tier,
        amount: data.amount,
        durationMonths: months,
        status: FeaturedRequestStatus.PENDING,
        history: [historyEntry],
      },
    });
  }

  static async decideFeaturedRequest(
    adminId: string,
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    options?: { durationMonths?: number; reason?: string }
  ) {
    const req = await prisma.featuredRequest.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!req) throw AppError.notFound('Featured request not found');

    const history = Array.isArray(req.history) ? [...req.history] : [];
    const today = new Date().toISOString().slice(0, 10);

    if (decision === 'APPROVED') {
      const months = options?.durationMonths || req.durationMonths || 1;
      const startOn = new Date();
      const endOn = new Date(startOn.getTime() + months * 30 * 24 * 60 * 60 * 1000);

      history.unshift({
        id: `fh-${Date.now()}`,
        on: today,
        text: `Listing activated for a ${months}-month ${req.tier} run by Super Admin.`,
      });

      const updated = await prisma.featuredRequest.update({
        where: { id },
        data: {
          status: FeaturedRequestStatus.APPROVED,
          durationMonths: months,
          startOn,
          endOn,
          listingStatus: FeaturedListingStatus.ACTIVE,
          history,
        },
      });

      await this.logActivity(
        adminId,
        `Featured request approved (${req.tier})`,
        `${req.id} · ${req.property.name}`,
        `Promoted to ${req.tier} for ${months} month(s)`
      );

      return updated;
    } else {
      const reason = options?.reason || 'Request rejected by Super Admin';
      history.unshift({
        id: `fh-${Date.now()}`,
        on: today,
        text: `Request rejected: ${reason}`,
      });

      const updated = await prisma.featuredRequest.update({
        where: { id },
        data: {
          status: FeaturedRequestStatus.REJECTED,
          rejectReason: reason,
          history,
        },
      });

      await this.logActivity(
        adminId,
        `Featured request rejected (${req.tier})`,
        `${req.id} · ${req.property.name}`,
        reason
      );

      return updated;
    }
  }

  static async setFeaturedListingStatus(adminId: string, id: string, status: FeaturedListingStatus) {
    const req = await prisma.featuredRequest.findUnique({ where: { id } });
    if (!req) throw AppError.notFound('Featured request not found');

    const updated = await prisma.featuredRequest.update({
      where: { id },
      data: { listingStatus: status },
    });

    await this.logActivity(
      adminId,
      `Featured listing status set to ${status}`,
      req.id,
      `Listing state changed to ${status}`
    );

    return updated;
  }

  /* ---------------------------------------------------------- Advertisements */
  static async getAdvertisements() {
    return prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createAdvertisement(adminId: string, data: any) {
    const ad = await prisma.advertisement.create({
      data: {
        businessName: data.businessName,
        category: data.category as any,
        title: data.title,
        description: data.description || '',
        destinationUrl: data.destinationUrl,
        imagePreview: data.imagePreview || '',
        targetCity: data.targetCity,
        targetLocality: data.targetLocality,
        placement: data.placement as any,
        startOn: new Date(data.startOn),
        endOn: new Date(data.endOn),
        price: data.price,
        status: data.status || 'DRAFT',
      },
    });

    await this.logActivity(
      adminId,
      'Advertisement campaign created',
      `${ad.id} · ${ad.businessName}`,
      `Created ad placement ${ad.placement}`
    );

    return ad;
  }

  static async updateAdvertisement(adminId: string, id: string, patch: any) {
    const updateData: any = { ...patch };
    if (patch.startOn) updateData.startOn = new Date(patch.startOn);
    if (patch.endOn) updateData.endOn = new Date(patch.endOn);

    const ad = await prisma.advertisement.update({
      where: { id },
      data: updateData,
    });

    await this.logActivity(
      adminId,
      'Advertisement updated',
      `${ad.id} · ${ad.businessName}`,
      'Campaign settings updated'
    );

    return ad;
  }

  static async deleteAdvertisement(adminId: string, id: string) {
    await prisma.advertisement.delete({ where: { id } });
    await this.logActivity(adminId, 'Advertisement deleted', id, 'Campaign deleted');
    return { ok: true };
  }

  /* ----------------------------------------------------- Platform Settings */
  static async getSettings() {
    const record = await prisma.platformSetting.findUnique({
      where: { key: 'PLATFORM_SETTINGS' },
    });
    if (!record) return { ...DEFAULT_PLATFORM_SETTINGS };
    return { ...DEFAULT_PLATFORM_SETTINGS, ...(record.value as object) };
  }

  static async saveSettings(adminId: string, patch: any) {
    const current = await this.getSettings();
    const merged = { ...current, ...patch };

    await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_SETTINGS' },
      create: { key: 'PLATFORM_SETTINGS', value: merged },
      update: { value: merged },
    });

    await this.logActivity(
      adminId,
      'Platform settings saved',
      'System Configuration',
      'Updated platform settings'
    );

    return merged;
  }

  static async resetSettings(adminId: string) {
    await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_SETTINGS' },
      create: { key: 'PLATFORM_SETTINGS', value: DEFAULT_PLATFORM_SETTINGS },
      update: { value: DEFAULT_PLATFORM_SETTINGS },
    });

    await this.logActivity(
      adminId,
      'Platform settings reset',
      'System Configuration',
      'Restored factory defaults'
    );

    return { ...DEFAULT_PLATFORM_SETTINGS };
  }

  /* ------------------------------------------------------ SQL Aggregates & Stats */
  static async getStats() {
    const [
      pgCounts,
      ownerCount,
      activeOwnerCount,
      studentCount,
      activeStudentCount,
      subCount,
      paymentsAgg,
    ] = await Promise.all([
      prisma.property.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.user.count({ where: { role: Role.OWNER } }),
      prisma.user.count({ where: { role: Role.OWNER, status: UserStatus.ACTIVE } }),
      prisma.student.count(),
      prisma.student.count({ where: { membership: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.platformPayment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
    ]);

    const pgs = {
      APPROVED: 0,
      PENDING: 0,
      REJECTED: 0,
      SUSPENDED: 0,
    };
    for (const item of pgCounts) {
      if (item.status in pgs) {
        pgs[item.status as keyof typeof pgs] = item._count.id;
      }
    }

    return {
      pgs,
      owners: { total: ownerCount, active: activeOwnerCount },
      students: { total: studentCount, active: activeStudentCount },
      activeSubscriptions: subCount,
      totalRevenue: paymentsAgg._sum.amount || 0,
    };
  }

  /* ------------------------------------------------------------- Activity Logs */
  static async getActivities() {
    const list = await prisma.activityLog.findMany({
      include: {
        actor: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return list.map((a) => ({
      id: a.id,
      text: a.description ? `${a.action}: ${a.description}` : a.action,
      time: a.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      kind: (a.entity.toLowerCase().includes('pg')
        ? 'pg'
        : a.entity.toLowerCase().includes('own')
          ? 'owner'
          : a.entity.toLowerCase().includes('stu')
            ? 'student'
            : a.entity.toLowerCase().includes('sub')
              ? 'subscription'
              : 'platform') as any,
      admin: a.actor?.fullName || 'Super Admin',
      action: a.action,
      entity: a.entity,
      description: a.description,
      at: a.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    }));
  }

  /* ----------------------------------------------------------- Support Tickets */
  static async getTickets() {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        submittedBy: { select: { fullName: true } },
        assignedTo: { select: { fullName: true } },
        replies: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      id: t.id,
      submittedBy: t.submittedBy.fullName,
      userRole: t.userRole === Role.OWNER ? 'Owner' : 'Student',
      category: t.category,
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      status: t.status,
      createdOn: t.createdAt.toISOString().slice(0, 10),
      assignedTo: t.assignedTo?.fullName || null,
      replies: t.replies.map((r) => ({
        id: r.id,
        author: r.authorName,
        role: r.role === Role.ADMIN ? 'Admin' : 'User',
        text: r.text,
        on: r.createdAt.toISOString().slice(0, 10),
      })),
    }));
  }

  static async updateTicket(adminId: string, id: string, patch: any) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw AppError.notFound('Support ticket not found');

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: patch,
    });

    await this.logActivity(
      adminId,
      'Support ticket updated',
      ticket.id,
      'Ticket attributes updated'
    );

    return updated;
  }

  static async addTicketReply(authorId: string, role: Role, ticketId: string, text: string) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw AppError.notFound('Support ticket not found');

    const user = await prisma.user.findUnique({ where: { id: authorId }, select: { fullName: true } });
    const authorName = user?.fullName || 'Super Admin';

    const cleanText = sanitizeHtml(text.trim());

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        authorId,
        authorName,
        role,
        text: cleanText,
      },
    });

    if (role === Role.ADMIN) {
      await this.logActivity(
        authorId,
        'Support ticket reply added',
        ticket.id,
        cleanText.slice(0, 60)
      );
    }

    return reply;
  }

  /* ---------------------------------------------------- Platform Notifications */
  static async getNotifications() {
    return prisma.notification.findMany({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createNotification(adminId: string, data: any) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) throw AppError.notFound('Admin not found');

    // Create an announcement/broadcast notification
    const notification = await prisma.notification.create({
      data: {
        userId: adminId,
        role: Role.ADMIN,
        category: data.category,
        title: data.title,
        body: data.message,
      },
    });

    await this.logActivity(
      adminId,
      'Platform notification broadcast',
      data.audience,
      data.title
    );

    return notification;
  }
}
