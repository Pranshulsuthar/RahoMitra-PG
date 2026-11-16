import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id;

  // Log error with request ID
  logger.error({
    requestId,
    method: req.method,
    url: req.originalUrl,
    err: {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
  });

  // Handle known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Handle JSON parsing syntax error from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400 && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON_BODY',
        message: 'Malformed JSON payload in request body',
      },
    });
    return;
  }

  // Handle Prisma Known Request Error if any
  const errWithCode = err as { code?: string; meta?: unknown };
  if (errWithCode.code === 'P2002') {
    res.status(409).json({
      error: {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: 'A record with this unique identifier already exists',
        details: env.NODE_ENV !== 'production' ? errWithCode.meta : undefined,
      },
    });
    return;
  }

  // Default fallback for unhandled 500
  const isProd = env.NODE_ENV === 'production';
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProd ? 'An unexpected internal server error occurred' : err.message,
      ...(isProd ? {} : { details: err.stack }),
    },
  });
}
