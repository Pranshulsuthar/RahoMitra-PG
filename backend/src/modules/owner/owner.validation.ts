import { z } from 'zod';
import { PGCategory, PropertyStatus, FoodOption, RoomType, BedStatus, MembershipStatus } from '@prisma/client';

export const createPropertySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  type: z.nativeEnum(PGCategory),
  description: z.string().default(''),
  city: z.string().trim().min(2, 'City is required'),
  address: z.string().default(''),
  locality: z.string().trim().min(2, 'Locality is required'),
  contactPhone: z.string().default(''),
  contactEmail: z.string().default(''),
  securityDeposit: z.number().int().nonnegative().default(0),
  facilities: z.array(z.string()).default([]),
  food: z.nativeEnum(FoodOption).default(FoodOption.NOT_AVAILABLE),
  rules: z.array(z.string()).default([]),
  coverImage: z.string().default(''),
  gallery: z.array(z.string()).default([]),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.nativeEnum(PropertyStatus).optional(),
});

export const setPropertyStatusSchema = z.object({
  status: z.nativeEnum(PropertyStatus),
});

export const createRoomSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  number: z.string().trim().min(1, 'Room number is required'),
  floor: z.number().int().default(0),
  type: z.nativeEnum(RoomType).default(RoomType.SINGLE),
  rent: z.number().int().nonnegative().default(0),
  capacity: z.number().int().min(1).max(10).optional(),
});

export const updateRoomSchema = z.object({
  number: z.string().trim().min(1, 'Room number is required'),
  floor: z.number().int(),
  type: z.nativeEnum(RoomType),
  rent: z.number().int().nonnegative(),
});

export const setBedStatusSchema = z.object({
  status: z.nativeEnum(BedStatus),
});

export const setMembershipSchema = z.object({
  status: z.nativeEnum(MembershipStatus),
});

export const createStaffSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().trim().min(2, 'Staff name is required'),
  email: z.string().trim().email('Invalid email address'),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Mobile must be a valid 10-digit Indian number'),
  role: z.string().trim().min(1, 'Staff role is required'),
});

export const updateStaffSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().trim().min(2, 'Staff name is required'),
  email: z.string().trim().email('Invalid email address'),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Mobile must be a valid 10-digit Indian number'),
  role: z.string().trim().min(1, 'Staff role is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  mobile: z.string().trim().optional(),
  city: z.string().trim().optional(),
  bio: z.string().trim().optional(),
});

export const generateCodeSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  roomPreference: z.string().optional().default(''),
  expiresInDays: z.number().int().min(1).max(90).default(7),
});

export const decideRequestSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});
