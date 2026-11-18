import { Router } from 'express';
import { Role } from '@prisma/client';
import { ownerController } from './owner.controller.js';
import { requireAuth, requireActiveAccount, requireRole } from '../auth/auth.middleware.js';

export const ownerRoutes = Router();

// Enforce auth + active account + OWNER role on every single owner route
ownerRoutes.use(requireAuth, requireActiveAccount, requireRole(Role.OWNER));

// Bootstrap dashboard data
ownerRoutes.get('/dashboard', (req, res, next) => ownerController.getDashboard(req, res, next));
ownerRoutes.post('/subscription/select', (req, res, next) => ownerController.selectSubscription(req, res, next));

// Properties
ownerRoutes.get('/properties', (req, res, next) => ownerController.getProperties(req, res, next));
ownerRoutes.post('/properties', (req, res, next) => ownerController.createProperty(req, res, next));
ownerRoutes.patch('/properties/:id', (req, res, next) => ownerController.updateProperty(req, res, next));
ownerRoutes.patch('/properties/:id/status', (req, res, next) => ownerController.setPropertyStatus(req, res, next));

// Rooms & Beds
ownerRoutes.get('/rooms', (req, res, next) => ownerController.getRooms(req, res, next));
ownerRoutes.post('/rooms', (req, res, next) => ownerController.createRoom(req, res, next));
ownerRoutes.patch('/rooms/:id', (req, res, next) => ownerController.updateRoom(req, res, next));
ownerRoutes.delete('/rooms/:id', (req, res, next) => ownerController.deleteRoom(req, res, next));
ownerRoutes.post('/rooms/:roomId/beds', (req, res, next) => ownerController.addBed(req, res, next));
ownerRoutes.patch('/beds/:id/status', (req, res, next) => ownerController.setBedStatus(req, res, next));

// Students
ownerRoutes.get('/students', (req, res, next) => ownerController.getStudents(req, res, next));
ownerRoutes.patch('/students/:id/membership', (req, res, next) => ownerController.setMembership(req, res, next));

// Staff
ownerRoutes.get('/staff', (req, res, next) => ownerController.getStaff(req, res, next));
ownerRoutes.post('/staff', (req, res, next) => ownerController.addStaff(req, res, next));
ownerRoutes.patch('/staff/:id', (req, res, next) => ownerController.updateStaff(req, res, next));
ownerRoutes.delete('/staff/:id', (req, res, next) => ownerController.removeStaff(req, res, next));

// Admission Codes & Requests
ownerRoutes.get('/codes', (req, res, next) => ownerController.getCodes(req, res, next));
ownerRoutes.post('/codes', (req, res, next) => ownerController.generateCode(req, res, next));
ownerRoutes.patch('/codes/:id/revoke', (req, res, next) => ownerController.revokeCode(req, res, next));
ownerRoutes.get('/requests', (req, res, next) => ownerController.getRequests(req, res, next));
ownerRoutes.patch('/requests/:id/decision', (req, res, next) => ownerController.decideRequest(req, res, next));

// Profile
ownerRoutes.get('/profile', (req, res, next) => ownerController.getProfile(req, res, next));
ownerRoutes.patch('/profile', (req, res, next) => ownerController.updateProfile(req, res, next));

// Notifications
ownerRoutes.get('/notifications', (req, res, next) => ownerController.getNotifications(req, res, next));
ownerRoutes.patch('/notifications/:id/read', (req, res, next) => ownerController.markNotification(req, res, next));
ownerRoutes.post('/notifications/mark-all-read', (req, res, next) => ownerController.markAllNotifications(req, res, next));
ownerRoutes.delete('/notifications/:id', (req, res, next) => ownerController.removeNotification(req, res, next));

// Activities
ownerRoutes.get('/activities', (req, res, next) => ownerController.getActivities(req, res, next));
