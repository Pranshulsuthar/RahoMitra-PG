import { Router } from 'express';
import { Role } from '@prisma/client';
import { studentController } from './student.controller.js';
import { requireAuth, requireActiveAccount, requireRole } from '../auth/auth.middleware.js';
import { admissionCodeLimiter } from '../../middleware/rateLimiter.js';

export const studentRoutes = Router();

// Strictly enforce authenticated ACTIVE STUDENT role for all student endpoints
studentRoutes.use(requireAuth, requireActiveAccount, requireRole(Role.STUDENT));

// 1. Submit admission code (protected by brute-force rate limiter)
studentRoutes.post('/admission-code', admissionCodeLimiter, (req, res, next) =>
  studentController.submitAdmissionCode(req, res, next)
);

// 2. View student's own admission requests
studentRoutes.get('/admission-requests', (req, res, next) =>
  studentController.getOwnAdmissionRequests(req, res, next)
);

// 3. View student's current active accommodation
studentRoutes.get('/accommodation', (req, res, next) =>
  studentController.getAccommodation(req, res, next)
);
