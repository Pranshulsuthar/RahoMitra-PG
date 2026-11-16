import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';
import { AppError } from './errors.js';

const BCRYPT_SALT_ROUNDS = 12;

// Precomputed bcrypt hash for constant-time dummy verification on unknown emails
// Generated with bcryptjs at salt rounds 12 for "$2a$12$e8YvXm8mB9jL7yF2v6W4e.sM6jR8p2c1bQ9wE5t7uI3oP1a2s3d4f"
const DUMMY_BCRYPT_HASH = '$2a$12$7eq6tqQuCb68aCwGCZbOeeUAgdqbbV1P4w68427Fh1lVkWKvi7eZ.';

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
  sid: string; // sessionId
  iss?: string;
  aud?: string;
}

export interface SignupTokenPayload {
  email: string;
  purpose: 'signup';
}

/** Hash password with bcrypt cost >= 12 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/** Compare password against bcrypt hash */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Execute dummy bcrypt check to prevent timing-based user enumeration */
export async function dummyHashComparison(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
}

/** 6 digits from cryptographically secure RNG */
export function generateSecureOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/** Hash string (OTP, refresh token, reset token) with SHA-256 */
export function hashSha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

/** Constant-time comparison for strings of equal or arbitrary length */
export function constantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/** Generate cryptographically random hex token */
export function generateRandomToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/** Sign JWT Access Token pinned strictly to HS256 algorithm with 15m expiry */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
      sid: payload.sid,
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }
  );
}

/** Verify JWT Access Token with pinned HS256 algorithm */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as jwt.JwtPayload;

    if (!decoded.sub || !decoded.role || !decoded.sid) {
      throw AppError.unauthorized('Invalid token payload claims');
    }

    return {
      sub: decoded.sub,
      role: decoded.role as Role,
      sid: decoded.sid,
      iss: decoded.iss,
      aud: typeof decoded.aud === 'string' ? decoded.aud : decoded.aud?.[0],
    };
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid access token', 401, 'INVALID_TOKEN');
  }
}

/** Sign short-lived token for 3-step signup completion (15 min) */
export function signSignupToken(email: string): string {
  return jwt.sign(
    {
      email: email.trim().toLowerCase(),
      purpose: 'signup',
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }
  );
}

/** Verify signup token */
export function verifySignupToken(token: string): SignupTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as SignupTokenPayload;

    if (!decoded.email || decoded.purpose !== 'signup') {
      throw AppError.badRequest('Invalid or malformed signup verification token');
    }

    return decoded;
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw AppError.badRequest('Signup token has expired or is invalid. Please verify OTP again.');
  }
}
