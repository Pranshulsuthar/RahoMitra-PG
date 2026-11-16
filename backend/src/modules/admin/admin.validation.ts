import { z } from 'zod';

export const ownerApplicationDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

export const pgStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING']),
  statusNote: z.string().optional(),
});

export const ownerStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export const studentMembershipSchema = z.object({
  membership: z.enum(['ACTIVE', 'INACTIVE']),
});

export const planCreateSchema = z.object({
  name: z.string().min(2).max(50),
  tagline: z.string().max(200).optional(),
  features: z.array(z.string()).default([]),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  propertyLimit: z.number().int().min(1),
  billing: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  featureToggles: z.array(z.any()).default([]),
  status: z.enum(['ENABLED', 'DISABLED']).default('ENABLED'),
});

export const planUpdateSchema = planCreateSchema.partial();

export const subscriptionUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED', 'TRIAL', 'PENDING']).optional(),
  planId: z.string().optional(),
  extendDays: z.number().int().min(1).max(365).optional(),
  suspended: z.boolean().optional(),
});

export const featuredRequestSubmitSchema = z.object({
  pgId: z.string().min(1),
  tier: z.enum(['FEATURED', 'PREMIUM_FEATURED']),
  amount: z.number().int().min(0),
  durationMonths: z.number().int().min(1).max(12).default(1),
});

export const featuredRequestDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  durationMonths: z.number().int().min(1).max(12).optional(),
  reason: z.string().optional(),
});

export const featuredListingStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED']),
});

export const advertisementCreateSchema = z.object({
  businessName: z.string().min(2),
  category: z.string().min(1),
  title: z.string().min(2),
  description: z.string().default(''),
  destinationUrl: z.string().min(1),
  imagePreview: z.string().default(''),
  targetCity: z.string().min(1),
  targetLocality: z.string().min(1),
  placement: z.string().min(1),
  startOn: z.string().min(1),
  endOn: z.string().min(1),
  price: z.number().int().min(0),
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED', 'DRAFT']).default('DRAFT'),
});

export const advertisementUpdateSchema = advertisementCreateSchema.partial();

export const advertisementStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED', 'DRAFT']),
});

export const ticketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']),
});

export const ticketPrioritySchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export const ticketAssignSchema = z.object({
  staff: z.string().nullable(),
});

export const ticketReplySchema = z.object({
  text: z.string().min(1).max(2000),
  role: z.enum(['Admin', 'User']).default('Admin'),
});

export const platformNotificationSchema = z.object({
  title: z.string().min(2).max(150),
  message: z.string().min(2).max(1000),
  category: z.enum(['PLATFORM', 'SUBSCRIPTION', 'FEATURE', 'MAINTENANCE', 'SUPPORT']).default('PLATFORM'),
  audience: z.enum(['ALL_OWNERS', 'ALL_STUDENTS', 'SELECTED_OWNERS']).default('ALL_OWNERS'),
});
