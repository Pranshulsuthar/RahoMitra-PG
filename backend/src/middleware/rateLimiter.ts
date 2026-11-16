import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60000)).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = store.get(key) ?? { timestamps: [] };
    // Filter timestamps within current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= max) {
      const resetTime = Math.ceil((record.timestamps[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', resetTime.toString());
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          details: { retryAfterSeconds: resetTime },
        },
      });
      return;
    }

    record.timestamps.push(now);
    store.set(key, record);

    res.setHeader('RateLimit-Limit', max.toString());
    res.setHeader('RateLimit-Remaining', (max - record.timestamps.length).toString());

    next();
  };
}

// 1. Login limiter: 10 attempts per 15 minutes per IP
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
});

// 2. OTP Request limiter: 5 requests per hour per IP/email
export const otpRequestLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const ip = req.ip || 'unknown';
    return `${ip}:${email}`;
  },
  message: 'Hourly OTP limit reached for this account or IP. Please try again later.',
});

// 3. Forgot password limiter: 3 requests per hour per IP
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. Please try again later.',
});

// 4. Refresh token limiter: 30 requests per 15 min per IP
export const refreshRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many session refresh requests.',
});

// 5. Public API limiter: 120 requests per minute per IP
export const publicApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests to public endpoints. Please slow down and try again.',
});

// 6. Admission code submission limiter: 10 attempts per 15 minutes per IP/User
export const admissionCodeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const userId = (req as any).user?.sub || 'anonymous';
    const ip = req.ip || 'unknown';
    return `${ip}:${userId}`;
  },
  message: 'Too many admission code attempts. Please wait 15 minutes before trying again.',
});
