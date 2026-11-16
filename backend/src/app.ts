import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { prisma } from './db/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { pgRoutes, localitiesRoutes } from './modules/pg/pg.routes.js';
import { ownerRoutes } from './modules/owner/owner.routes.js';
import { studentRoutes } from './modules/student/student.routes.js';
import { billingRouter } from './modules/billing/billing.routes.js';
import { communicationRouter } from './modules/communication/communication.routes.js';
import { uploadRouter } from './modules/upload/upload.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy in production for rate limiting and accurate client IP
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // 2. Security HTTP headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 3. Strict CORS configuration (Explicit origins list, credentials enabled, NO wildcard '*')
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Requested-With'],
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // 4. Request ID tagging
  app.use(requestIdMiddleware);

  // 5. Body parsers with hardened size limits
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // 6. Structured logging with Pino HTTP
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || req.id,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
    })
  );

  // 7. Health Check endpoint (checks DB connectivity)
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      // Check database connection by running a ping query
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'CONNECTED',
      });
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : 'Database ping failed';
      logger.error({ err: dbErr }, 'Health check database connectivity check failed');
      res.status(503).json({
        status: 'DEGRADED',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'DISCONNECTED',
        error: env.NODE_ENV === 'production' ? 'Database unreachable' : message,
      });
    }
  });

  // 8. Auth API routes
  app.use('/api/auth', authRoutes);

  // 9. Public PG Listings and Localities API routes
  app.use('/api/pgs', pgRoutes);
  app.use('/api/localities', localitiesRoutes);

  // 10. Owner Module API routes
  app.use('/api/owner', ownerRoutes);

  // 11. Student Module API routes
  app.use('/api/student', studentRoutes);

  // 12. Billing Module API routes
  app.use('/api/billing', billingRouter);

  // 13. Communication, Complaints & Announcements API routes
  app.use('/api/communication', communicationRouter);

  // 14. File/Image Upload API routes
  app.use('/api/upload', uploadRouter);

  // 15. Super Admin Module API routes
  app.use('/api/admin', adminRoutes);

  // 16. 404 handler for unknown routes
  app.use(notFoundHandler);

  // 9. Central error handler
  app.use(errorHandler);

  return app;
}
