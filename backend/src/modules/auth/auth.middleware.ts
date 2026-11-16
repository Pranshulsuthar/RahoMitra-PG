import { Request, Response, NextFunction } from 'express';
import { Role, User } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
import { verifyAccessToken, AccessTokenPayload } from '../../utils/crypto.js';
import { prisma } from '../../db/client.js';
import { env } from '../../config/env.js';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      dbUser?: User;
    }
  }
}

/** Authenticate request via Bearer access token */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authorization token is missing', 401, 'TOKEN_MISSING');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new AppError('Authorization token is empty', 401, 'TOKEN_MISSING');
  }

  const payload = verifyAccessToken(token);
  req.user = payload;
  next();
}

/** Ensure user exists and is active fresh from the database */
export async function requireActiveAccount(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });

    if (!user) {
      throw new AppError('User account not found', 401, 'USER_NOT_FOUND');
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'DELETED') {
      throw new AppError('Your account has been deactivated.', 401, 'ACCOUNT_DELETED');
    }

    if (!user.emailVerifiedAt && env.NODE_ENV === 'production' && req.user.role !== Role.ADMIN) {
      throw new AppError('Email verification required before accessing this resource', 403, 'EMAIL_NOT_VERIFIED');
    }

    req.dbUser = user;
    next();
  } catch (err) {
    if (next) {
      next(err);
    }
    if (!next || next.length === 0) {
      throw err;
    }
  }
}

/** Restrict access to specific roles */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('You do not have permission to access this resource', 403, 'FORBIDDEN');
    }

    next();
  };
}

/** CSRF protection for cookie-based endpoints */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // 1. Verify Origin / Referer header if present
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    if (!env.CORS_ORIGIN.includes(origin)) {
      throw new AppError('Cross-site request blocked: Invalid origin', 403, 'CSRF_INVALID_ORIGIN');
    }
  } else if (referer) {
    const isAllowedReferer = env.CORS_ORIGIN.some((allowed) => referer.startsWith(allowed));
    if (!isAllowedReferer && env.NODE_ENV === 'production') {
      throw new AppError('Cross-site request blocked: Invalid referer', 403, 'CSRF_INVALID_REFERER');
    }
  }

  // 2. Custom header check (browser AJAX / Fetch clients provide custom headers; plain forms cannot)
  const customHeader = req.headers['x-requested-with'] || req.headers['x-rahomitra-client'] || req.headers['content-type'];
  if (!customHeader && req.method !== 'GET') {
    throw new AppError('CSRF protection: Custom client header is required', 403, 'CSRF_MISSING_HEADER');
  }

  next();
}
