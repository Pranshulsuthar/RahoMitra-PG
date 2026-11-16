import { z } from 'zod'

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  text: z.string().min(1, 'Message text cannot be empty').max(2000, 'Message text too long'),
})

export const startConversationSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
})

export const complaintSubmitSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  category: z.enum([
    'ELECTRICITY',
    'WATER_SUPPLY',
    'WIFI',
    'FOOD_QUALITY',
    'CLEANLINESS',
    'ROOM_MAINTENANCE',
    'FURNITURE',
    'SECURITY',
    'STAFF_BEHAVIOUR',
    'OTHER',
  ]),
  subject: z.string().min(1, 'Subject is required').max(150, 'Subject is too long'),
  description: z.string().min(1, 'Description is required').max(3000, 'Description is too long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  image: z.string().default(''),
})

export const complaintStatusUpdateSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'UNDER_REVIEW',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED',
  ]),
  note: z.string().default(''),
})

export const complaintCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required').max(2000, 'Comment too long'),
  title: z.string().default('Response from management'),
})

export const complaintPrioritySchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

export const announcementInputSchema = z.object({
  id: z.string().optional().nullable(),
  propertyId: z.string().min(1, 'Property ID is required'),
  title: z.string().min(1, 'Title is required').max(150, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(3000, 'Message is too long'),
  category: z.enum([
    'GENERAL',
    'MAINTENANCE',
    'ELECTRICITY_WATER',
    'FOOD_MESS',
    'RENT_REMINDER',
    'RULES',
    'EMERGENCY',
  ]).default('GENERAL'),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).default('NORMAL'),
  audience: z.enum(['ALL', 'SELECTED']).default('ALL'),
  audienceStudentIds: z.array(z.string()).default([]),
  publishedOn: z.string().optional(),
  expiresOn: z.string().optional().default(''),
  published: z.boolean().default(true),
})

export const studentProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Mobile must be 10 digits starting with 6-9').optional().nullable(),
  college: z.string().max(150).optional().default(''),
  city: z.string().max(100).optional().default(''),
  emergencyContact: z.string().max(100).optional().default(''),
})

export const studentSettingsSchema = z.object({
  languageEnglish: z.boolean().optional(),
  showProfileToOwner: z.boolean().optional(),
  noticeAlerts: z.boolean().optional(),
  rentReminders: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  compactCards: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
  darkMode: z.boolean().optional(),
})
