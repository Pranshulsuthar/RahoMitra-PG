import { Router } from 'express';
import { pgController } from './pg.controller.js';
import { publicApiLimiter } from '../../middleware/rateLimiter.js';

export const pgRoutes = Router();
export const localitiesRoutes = Router();

// Apply public rate limiting to both routers
pgRoutes.use(publicApiLimiter);
localitiesRoutes.use(publicApiLimiter);

// PG listings & detail routes
pgRoutes.get('/', (req, res, next) => pgController.listPGs(req, res, next));
pgRoutes.get('/:slug', (req, res, next) => pgController.getPGBySlug(req, res, next));

// Locality suggestions
localitiesRoutes.get('/', (req, res, next) => pgController.getLocalities(req, res, next));
