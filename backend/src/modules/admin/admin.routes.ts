import { Router } from 'express';
import { Role } from '@prisma/client';
import { adminController } from './admin.controller.js';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';

export const adminRoutes = Router();

// All admin routes strictly require authentication and ADMIN role
adminRoutes.use(requireAuth, requireRole(Role.ADMIN));

/* ------------------------------------------------------------- Applications */
adminRoutes.get('/applications', (req, res, next) => adminController.getApplications(req, res, next));
adminRoutes.patch('/applications/:id/status', (req, res, next) => adminController.decideApplication(req, res, next));

/* ---------------------------------------------------------------------- PGs */
adminRoutes.get('/pgs', (req, res, next) => adminController.getPgs(req, res, next));
adminRoutes.patch('/pgs/:id/status', (req, res, next) => adminController.setPgStatus(req, res, next));

/* ------------------------------------------------------- Owners & Students */
adminRoutes.get('/owners', (req, res, next) => adminController.getOwners(req, res, next));
adminRoutes.patch('/owners/:id/status', (req, res, next) => adminController.setOwnerStatus(req, res, next));
adminRoutes.get('/students', (req, res, next) => adminController.getStudents(req, res, next));
adminRoutes.patch('/students/:id/membership', (req, res, next) => adminController.setStudentMembership(req, res, next));

/* -------------------------------------------------------------------- Plans */
adminRoutes.get('/plans', (req, res, next) => adminController.getPlans(req, res, next));
adminRoutes.post('/plans', (req, res, next) => adminController.createPlan(req, res, next));
adminRoutes.patch('/plans/:id', (req, res, next) => adminController.updatePlan(req, res, next));
adminRoutes.delete('/plans/:id', (req, res, next) => adminController.deletePlan(req, res, next));

/* ----------------------------------------------------------- Subscriptions */
adminRoutes.get('/subscriptions', (req, res, next) => adminController.getSubscriptions(req, res, next));
adminRoutes.patch('/subscriptions/:id/status', (req, res, next) => adminController.updateSubscription(req, res, next));
adminRoutes.get('/payments', (req, res, next) => adminController.getPayments(req, res, next));

/* ------------------------------------------------------- Featured Requests */
adminRoutes.get('/featured-requests', (req, res, next) => adminController.getFeaturedRequests(req, res, next));
adminRoutes.post('/featured-requests', (req, res, next) => adminController.submitFeaturedRequest(req, res, next));
adminRoutes.patch('/featured-requests/:id/decision', (req, res, next) => adminController.decideFeaturedRequest(req, res, next));
adminRoutes.patch('/featured-requests/:id/listing-status', (req, res, next) => adminController.setFeaturedListingStatus(req, res, next));

/* ---------------------------------------------------------- Advertisements */
adminRoutes.get('/advertisements', (req, res, next) => adminController.getAdvertisements(req, res, next));
adminRoutes.post('/advertisements', (req, res, next) => adminController.createAdvertisement(req, res, next));
adminRoutes.patch('/advertisements/:id', (req, res, next) => adminController.updateAdvertisement(req, res, next));
adminRoutes.patch('/advertisements/:id/status', (req, res, next) => adminController.setAdvertisementStatus(req, res, next));
adminRoutes.delete('/advertisements/:id', (req, res, next) => adminController.deleteAdvertisement(req, res, next));

/* ---------------------------------------------------------------- Settings */
adminRoutes.get('/settings', (req, res, next) => adminController.getSettings(req, res, next));
adminRoutes.put('/settings', (req, res, next) => adminController.saveSettings(req, res, next));
adminRoutes.post('/settings/reset', (req, res, next) => adminController.resetSettings(req, res, next));

/* --------------------------------------------------------- Stats & Activities */
adminRoutes.get('/stats', (req, res, next) => adminController.getStats(req, res, next));
adminRoutes.get('/activities', (req, res, next) => adminController.getActivities(req, res, next));

/* ---------------------------------------------------------- Support Tickets */
adminRoutes.get('/tickets', (req, res, next) => adminController.getTickets(req, res, next));
adminRoutes.patch('/tickets/:id/status', (req, res, next) => adminController.setTicketStatus(req, res, next));
adminRoutes.patch('/tickets/:id/priority', (req, res, next) => adminController.setTicketPriority(req, res, next));
adminRoutes.patch('/tickets/:id/assign', (req, res, next) => adminController.assignTicket(req, res, next));
adminRoutes.post('/tickets/:id/replies', (req, res, next) => adminController.addTicketReply(req, res, next));

/* ---------------------------------------------------- Platform Notifications */
adminRoutes.get('/notifications', (req, res, next) => adminController.getNotifications(req, res, next));
adminRoutes.post('/notifications', (req, res, next) => adminController.createNotification(req, res, next));
