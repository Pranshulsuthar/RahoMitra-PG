import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

describe('Environment Configuration Validation (Fail-Fast)', () => {
  const envSchema = z.object({
    DATABASE_URL: z
      .string({ required_error: 'DATABASE_URL is required' })
      .min(1)
      .refine(
        (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
        'DATABASE_URL must be a valid PostgreSQL connection URL'
      ),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    CORS_ORIGIN: z
      .string({ required_error: 'CORS_ORIGIN is required' })
      .min(1)
      .refine((val) => {
        const origins = val.split(',').map((o) => o.trim());
        return !origins.includes('*') && origins.every((o) => o.length > 0 && o !== '*');
      }, "CORS_ORIGIN must be an explicit list of origins; wildcard '*' is forbidden")
      .transform((val) => val.split(',').map((o) => o.trim())),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),
    COOKIE_DOMAIN: z.string().min(1),
    MAIL_HOST: z.string().min(1),
    MAIL_PORT: z.coerce.number().int().positive(),
    MAIL_USER: z.string().min(1),
    MAIL_PASS: z.string().min(1),
    MAIL_FROM: z.string().min(1),
    ADMIN_EMAIL: z.string().email().toLowerCase(),
    ADMIN_PASSWORD: z.string().min(8),
  });

  it('fails fast when required variables are missing', () => {
    const invalidConfig = {
      NODE_ENV: 'development',
      PORT: '5000',
    };
    const result = envSchema.safeParse(invalidConfig);
    assert.equal(result.success, false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path[0]);
      assert.ok(issues.includes('DATABASE_URL'));
      assert.ok(issues.includes('CORS_ORIGIN'));
      assert.ok(issues.includes('JWT_ACCESS_SECRET'));
      assert.ok(issues.includes('ADMIN_EMAIL'));
      assert.ok(issues.includes('ADMIN_PASSWORD'));
    }
  });

  it('strictly rejects wildcard * in CORS_ORIGIN', () => {
    const wildcardConfig = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rahomitra',
      NODE_ENV: 'development',
      PORT: '5000',
      CORS_ORIGIN: '*',
      JWT_ACCESS_SECRET: 'a_very_long_secret_key_at_least_32_characters_long',
      JWT_ISSUER: 'rahomitra-api',
      JWT_AUDIENCE: 'rahomitra-app',
      COOKIE_DOMAIN: 'localhost',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USER: 'user',
      MAIL_PASS: 'pass',
      MAIL_FROM: 'noreply@rahomitra.com',
      ADMIN_EMAIL: 'admin@rahomitra.com',
      ADMIN_PASSWORD: 'Password123!',
    };
    const result = envSchema.safeParse(wildcardConfig);
    assert.equal(result.success, false);
  });

  it('rejects short JWT secret (must be >= 32 chars)', () => {
    const shortSecretConfig = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rahomitra',
      NODE_ENV: 'development',
      PORT: '5000',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'short_secret',
      JWT_ISSUER: 'rahomitra-api',
      JWT_AUDIENCE: 'rahomitra-app',
      COOKIE_DOMAIN: 'localhost',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USER: 'user',
      MAIL_PASS: 'pass',
      MAIL_FROM: 'noreply@rahomitra.com',
      ADMIN_EMAIL: 'admin@rahomitra.com',
      ADMIN_PASSWORD: 'Password123!',
    };
    const result = envSchema.safeParse(shortSecretConfig);
    assert.equal(result.success, false);
  });

  it('passes and transforms valid configuration correctly', () => {
    const validConfig = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rahomitra',
      NODE_ENV: 'development',
      PORT: '5000',
      CORS_ORIGIN: 'http://localhost:5173, http://localhost:3000',
      JWT_ACCESS_SECRET: 'super_secret_jwt_key_that_is_at_least_32_chars_long',
      JWT_ISSUER: 'rahomitra-api',
      JWT_AUDIENCE: 'rahomitra-app',
      COOKIE_DOMAIN: 'localhost',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USER: 'user',
      MAIL_PASS: 'pass',
      MAIL_FROM: 'noreply@rahomitra.com',
      ADMIN_EMAIL: 'Admin@RahoMitra.com',
      ADMIN_PASSWORD: 'Password123!',
    };
    const result = envSchema.safeParse(validConfig);
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.CORS_ORIGIN, ['http://localhost:5173', 'http://localhost:3000']);
      assert.equal(result.data.ADMIN_EMAIL, 'admin@rahomitra.com');
      assert.equal(result.data.PORT, 5000);
    }
  });
});
