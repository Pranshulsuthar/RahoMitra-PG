import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty')
    .refine(
      (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection URL (postgresql://...)'
    ),

  DIRECT_URL: z.string().optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  CORS_ORIGIN: z
    .string({ required_error: 'CORS_ORIGIN is required' })
    .min(1, 'CORS_ORIGIN cannot be empty')
    .refine((val) => {
      const origins = val.split(',').map((o) => o.trim());
      // Fail fast if wildcard '*' is found or any item is empty or '*'
      return !origins.includes('*') && origins.every((o) => o.length > 0 && o !== '*');
    }, "CORS_ORIGIN must be an explicit comma-separated list of origins; wildcard '*' is not allowed")
    .transform((val) => val.split(',').map((o) => o.trim())),

  JWT_ACCESS_SECRET: z
    .string({ required_error: 'JWT_ACCESS_SECRET is required' })
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long for cryptographic safety'),

  JWT_ISSUER: z.string({ required_error: 'JWT_ISSUER is required' }).min(1, 'JWT_ISSUER is required'),

  JWT_AUDIENCE: z.string({ required_error: 'JWT_AUDIENCE is required' }).min(1, 'JWT_AUDIENCE is required'),

  COOKIE_DOMAIN: z.string({ required_error: 'COOKIE_DOMAIN is required' }).min(1, 'COOKIE_DOMAIN is required'),

  MAIL_HOST: z.string({ required_error: 'MAIL_HOST is required' }).min(1, 'MAIL_HOST is required'),

  MAIL_PORT: z.coerce.number({ required_error: 'MAIL_PORT is required' }).int().positive('MAIL_PORT must be a positive integer'),

  MAIL_USER: z.string({ required_error: 'MAIL_USER is required' }).min(1, 'MAIL_USER is required'),

  MAIL_PASS: z.string({ required_error: 'MAIL_PASS is required' }).min(1, 'MAIL_PASS is required'),

  MAIL_FROM: z.string({ required_error: 'MAIL_FROM is required' }).min(1, 'MAIL_FROM is required'),

  ADMIN_EMAIL: z
    .string({ required_error: 'ADMIN_EMAIL is required' })
    .email('ADMIN_EMAIL must be a valid email address')
    .toLowerCase(),

  ADMIN_PASSWORD: z
    .string({ required_error: 'ADMIN_PASSWORD is required' })
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters long'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.cwd() ? process.env : {});
  if (!result.success) {
    console.error('❌ FATAL: Environment validation failed with missing or invalid variables:');
    const formatted = result.error.format();
    for (const [key, value] of Object.entries(formatted)) {
      if (key !== '_errors' && value && '_errors' in value && (value as { _errors: string[] })._errors.length > 0) {
        console.error(`  - ${key}: ${(value as { _errors: string[] })._errors.join(', ')}`);
      }
    }
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
