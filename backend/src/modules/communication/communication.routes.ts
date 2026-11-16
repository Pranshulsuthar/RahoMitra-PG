import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireAuth, requireRole } from '../auth/auth.middleware.js'
import { CommunicationController } from './communication.controller.js'

export const communicationRouter = Router()

communicationRouter.use(requireAuth)

/* ------------------------------------------------------------- Messaging */
communicationRouter.get('/conversations', CommunicationController.getConversations)
communicationRouter.get('/conversations/:id/messages', CommunicationController.getMessages)
communicationRouter.post('/messages', CommunicationController.sendMessage)
communicationRouter.post('/conversations/:id/read', CommunicationController.markConversationRead)
communicationRouter.post('/conversations/init', requireRole(Role.OWNER), CommunicationController.getOrCreateConversation)

/* ------------------------------------------------------------ Complaints */
communicationRouter.get('/complaints', CommunicationController.getComplaints)
communicationRouter.get('/complaints/:id', CommunicationController.getComplaintById)
communicationRouter.post('/complaints', requireRole(Role.STUDENT), CommunicationController.submitComplaint)
communicationRouter.patch('/complaints/:id/status', requireRole(Role.OWNER), CommunicationController.updateComplaintStatus)
communicationRouter.post('/complaints/:id/comments', CommunicationController.addComplaintComment)
communicationRouter.patch('/complaints/:id/priority', requireRole(Role.OWNER), CommunicationController.setComplaintPriority)

/* --------------------------------------------------------- Announcements */
communicationRouter.get('/announcements', CommunicationController.getAnnouncements)
communicationRouter.post('/announcements', requireRole(Role.OWNER), CommunicationController.saveAnnouncement)
communicationRouter.patch('/announcements/:id/toggle-publish', requireRole(Role.OWNER), CommunicationController.toggleAnnouncementPublished)
communicationRouter.delete('/announcements/:id', requireRole(Role.OWNER), CommunicationController.deleteAnnouncement)
communicationRouter.post('/announcements/:id/read', requireRole(Role.STUDENT), CommunicationController.markAnnouncementRead)

/* --------------------------------------------------------- Notifications */
communicationRouter.get('/notifications', CommunicationController.getNotifications)
communicationRouter.post('/notifications/:id/read', CommunicationController.markNotificationRead)
communicationRouter.post('/notifications/read-all', CommunicationController.markAllNotificationsRead)
communicationRouter.delete('/notifications/:id', CommunicationController.clearNotification)

/* --------------------------------- Student Notices, Profile & Settings */
communicationRouter.get('/student/notices', requireRole(Role.STUDENT), CommunicationController.getStudentNotices)
communicationRouter.get('/student/profile', requireRole(Role.STUDENT), CommunicationController.getStudentProfile)
communicationRouter.put('/student/profile', requireRole(Role.STUDENT), CommunicationController.updateStudentProfile)
communicationRouter.get('/student/settings', requireRole(Role.STUDENT), CommunicationController.getStudentSettings)
communicationRouter.put('/student/settings', requireRole(Role.STUDENT), CommunicationController.updateStudentSettings)
