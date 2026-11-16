import { z } from 'zod';
import { Role } from '@prisma/client';

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'admin123',
  'welcome123',
  'rahomitra123',
  'letmein123',
  'iloveyou',
  'pass1234',
  'secret123',
]);

const emailSchema = z
  .string({ required_error: 'Email address is required' })
  .trim()
  .min(1, 'Email cannot be empty')
  .email('Enter a valid email address')
  .toLowerCase();

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .refine(
    (val) => !COMMON_WEAK_PASSWORDS.has(val.toLowerCase()),
    'This password is too common or easily guessable. Please choose a more secure password.'
  );

const mobileSchema = z
  .string({ required_error: 'Mobile number is required' })
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ''))
  .refine(
    (val) => /^[6-9]\d{9}$/.test(val),
    'Enter a valid 10-digit Indian mobile number (must start with 6, 7, 8, or 9)'
  );

// Request OTP Schema
export const requestOtpSchema = z.object({
  email: emailSchema,
  role: z.enum([Role.STUDENT, Role.OWNER], {
    required_error: 'Role is required (STUDENT or OWNER)',
  }),
});

// Verify OTP Schema
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string({ required_error: 'Verification OTP is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
});

// Student Signup Schema
export const studentSignupSchema = z.object({
  signupToken: z.string({ required_error: 'Signup token is required' }).min(1),
  fullName: z.string({ required_error: 'Full name is required' }).trim().min(2, 'Enter your full name'),
  mobile: mobileSchema,
  college: z.string({ required_error: 'College name is required' }).trim().min(2, 'College name is required'),
  city: z.string({ required_error: 'City is required' }).trim().min(2, 'City is required'),
  password: passwordSchema,
});

// PG details for Owner Signup
const pgDetailsSchema = z.object({
  name: z.string({ required_error: 'PG name is required' }).trim().min(3, 'PG name must be at least 3 characters'),
  type: z.enum(['BOYS', 'GIRLS', 'CO_LIVING', 'Boys', 'Girls', 'Co-living'], {
    required_error: 'PG type is required',
  }).transform((val) => {
    if (val.toUpperCase() === 'BOYS') return 'BOYS' as const;
    if (val.toUpperCase() === 'GIRLS') return 'GIRLS' as const;
    return 'CO_LIVING' as const;
  }),
  city: z.string({ required_error: 'City is required' }).trim().min(2, 'City is required'),
  address: z.string({ required_error: 'Address is required' }).trim().min(10, 'Address must be at least 10 characters'),
  count: z.coerce.number().int().min(1, 'Property count must be at least 1').max(999, 'Property count cannot exceed 999'),
});

// Owner Signup Schema
export const ownerSignupSchema = z.object({
  signupToken: z.string({ required_error: 'Signup token is required' }).min(1),
  fullName: z.string({ required_error: 'Full name is required' }).trim().min(2, 'Owner full name is required'),
  mobile: mobileSchema,
  pg: pgDetailsSchema,
  password: passwordSchema,
});

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
  role: z.enum([Role.STUDENT, Role.OWNER, Role.ADMIN], {
    required_error: 'Role is required (STUDENT, OWNER, or ADMIN)',
  }),
  rememberMe: z.boolean().optional().default(false),
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }).min(1),
  password: passwordSchema,
});
