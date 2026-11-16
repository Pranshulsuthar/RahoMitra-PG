import { prisma } from '../../db/client.js'
import { AppError } from '../../utils/errors.js'
import { sanitizeHtml } from '../../utils/sanitize.js'
import { UploadService } from '../upload/upload.service.js'
import {
  ComplaintActor,
  ComplaintEventKind,
  ComplaintPriority,
  ComplaintStatus,
  AnnouncementAudience,
  CommNotificationKind,
  Role,
} from '@prisma/client'

export function formatTime24(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDateIso(d: Date): string {
  return d.toISOString().split('T')[0]
}

export class CommunicationService {
  /* ------------------------------------------------------------- Messaging */

  /** Verify user is participant in conversation */
  private static async verifyConversationParticipant(userId: string, conversationId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        property: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!conv) {
      throw AppError.notFound('Conversation not found')
    }

    const isOwner = conv.property.ownerId === userId
    const isStudent = conv.student.userId === userId

    if (!isOwner && !isStudent) {
      throw AppError.forbidden('You do not have access to this conversation')
    }

    return { conv, isOwner, isStudent }
  }

  /** List conversations for current user */
  static async getConversations(userId: string, role: string) {
    if (role === 'OWNER') {
      const convs = await prisma.conversation.findMany({
        where: {
          property: {
            ownerId: userId,
          },
        },
        include: {
          student: {
            include: {
              user: true,
              room: true,
            },
          },
        },
        orderBy: { lastMessageOn: 'desc' },
      })

      return convs.map((c) => ({
        id: c.id,
        propertyId: c.propertyId,
        studentId: c.studentId,
        studentName: c.student.user.fullName,
        roomId: c.student.roomId ?? '',
        roomNumber: c.student.room?.number ?? '—',
        ownerUnread: c.ownerUnread,
        studentUnread: c.studentUnread,
        lastMessageOn: formatDateIso(c.lastMessageOn),
        lastMessageAt: formatTime24(c.lastMessageOn),
      }))
    } else {
      const student = await prisma.student.findUnique({
        where: { userId },
      })
      if (!student) return []

      const convs = await prisma.conversation.findMany({
        where: {
          studentId: student.id,
        },
        include: {
          property: {
            include: {
              owner: true,
            },
          },
          student: {
            include: {
              user: true,
              room: true,
            },
          },
        },
        orderBy: { lastMessageOn: 'desc' },
      })

      return convs.map((c) => ({
        id: c.id,
        propertyId: c.propertyId,
        studentId: c.studentId,
        studentName: c.property.owner.fullName,
        roomId: c.student.roomId ?? '',
        roomNumber: c.student.room?.number ?? '—',
        ownerUnread: c.ownerUnread,
        studentUnread: c.studentUnread,
        lastMessageOn: formatDateIso(c.lastMessageOn),
        lastMessageAt: formatTime24(c.lastMessageOn),
      }))
    }
  }

  /** Get messages for conversation */
  static async getMessages(userId: string, conversationId: string) {
    await this.verifyConversationParticipant(userId, conversationId)

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      sender: m.sender as 'OWNER' | 'STUDENT',
      senderName: m.senderName,
      text: m.text,
      date: formatDateIso(m.createdAt),
      at: formatTime24(m.createdAt),
      read: m.read,
    }))
  }

  /** Send message in conversation */
  static async sendMessage(userId: string, conversationId: string, text: string) {
    const { conv, isOwner } = await this.verifyConversationParticipant(userId, conversationId)
    const sanitizedText = sanitizeHtml(text.trim())

    if (!sanitizedText) {
      throw AppError.badRequest('Message text cannot be empty')
    }

    const senderUser = await prisma.user.findUnique({ where: { id: userId } })
    const userFullName = senderUser?.fullName || (isOwner ? 'Owner' : 'Student')

    const sender = isOwner ? ComplaintActor.OWNER : ComplaintActor.STUDENT
    const recipientUserId = isOwner ? conv.student.userId : conv.property.ownerId
    const recipientRole = isOwner ? Role.STUDENT : Role.OWNER

    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId,
          sender,
          senderName: userFullName,
          text: sanitizedText,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageOn: new Date(),
          ownerUnread: isOwner ? undefined : { increment: 1 },
          studentUnread: isOwner ? { increment: 1 } : undefined,
        },
      }),
      prisma.notification.create({
        data: {
          userId: recipientUserId,
          role: recipientRole,
          kind: CommNotificationKind.MESSAGE,
          title: `New message from ${userFullName}`,
          body: sanitizedText.length > 80 ? `${sanitizedText.slice(0, 77)}…` : sanitizedText,
          link: isOwner ? '/student/communication' : '/owner/communication',
        },
      }),
    ])

    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: message.sender as 'OWNER' | 'STUDENT',
      senderName: message.senderName,
      text: message.text,
      date: formatDateIso(message.createdAt),
      at: formatTime24(message.createdAt),
      read: message.read,
    }
  }

  /** Mark conversation as read */
  static async markConversationRead(userId: string, conversationId: string) {
    const { isOwner } = await this.verifyConversationParticipant(userId, conversationId)

    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: isOwner ? { ownerUnread: 0 } : { studentUnread: 0 },
      }),
      prisma.chatMessage.updateMany({
        where: {
          conversationId,
          sender: isOwner ? ComplaintActor.STUDENT : ComplaintActor.OWNER,
          read: false,
        },
        data: { read: true },
      }),
    ])

    return { ok: true }
  }

  /** Get or create 1:1 conversation between owner & student */
  static async getOrCreateConversation(ownerUserId: string, propertyId: string, studentId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })
    if (!property || property.ownerId !== ownerUserId) {
      throw AppError.forbidden('Unauthorized access to property')
    }

    const existing = await prisma.conversation.findUnique({
      where: {
        propertyId_studentId: {
          propertyId,
          studentId,
        },
      },
    })
    if (existing) return existing

    return prisma.conversation.create({
      data: {
        propertyId,
        studentId,
      },
    })
  }

  /* ------------------------------------------------------------- Complaints */

  private static async verifyComplaintAccess(userId: string, complaintId: string) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        property: true,
        student: {
          include: {
            user: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!complaint) {
      throw AppError.notFound('Complaint not found')
    }

    const isOwner = complaint.property.ownerId === userId
    const isStudent = complaint.student.userId === userId

    if (!isOwner && !isStudent) {
      throw AppError.forbidden('You do not have access to this complaint')
    }

    return { complaint, isOwner, isStudent }
  }

  static async getComplaints(userId: string, role: string, propertyId?: string) {
    if (role === 'OWNER') {
      const where: any = {
        property: {
          ownerId: userId,
        },
      }
      if (propertyId) where.propertyId = propertyId

      const complaints = await prisma.complaint.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
            },
          },
          events: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { submittedOn: 'desc' },
      })

      return complaints.map(this.formatComplaint)
    } else {
      const student = await prisma.student.findUnique({
        where: { userId },
      })
      if (!student) return []

      const complaints = await prisma.complaint.findMany({
        where: {
          studentId: student.id,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          events: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { submittedOn: 'desc' },
      })

      return complaints.map(this.formatComplaint)
    }
  }

  static async getComplaintById(userId: string, complaintId: string) {
    const { complaint } = await this.verifyComplaintAccess(userId, complaintId)
    return this.formatComplaint(complaint)
  }

  static async submitComplaint(
    studentUserId: string,
    input: {
      propertyId: string
      category: any
      subject: string
      description: string
      priority: any
      image?: string
    }
  ) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        room: true,
        property: true,
        user: true,
      },
    })

    if (!student || student.propertyId !== input.propertyId) {
      throw AppError.badRequest('You are not currently allocated to this property')
    }

    const studentFullName = student.user.fullName || 'Student'

    let safeImageUrl = ''
    if (input.image && input.image.trim()) {
      const uploadRes = UploadService.processImage(input.image)
      safeImageUrl = uploadRes.url
    }

    const sanitizedSubject = sanitizeHtml(input.subject.trim())
    const sanitizedDescription = sanitizeHtml(input.description.trim())

    const complaint = await prisma.$transaction(async (tx) => {
      const c = await tx.complaint.create({
        data: {
          propertyId: input.propertyId,
          studentId: student.id,
          roomId: student.roomId || 'unassigned',
          roomNumber: student.room?.number || '—',
          category: input.category,
          subject: sanitizedSubject,
          description: sanitizedDescription,
          priority: input.priority,
          status: ComplaintStatus.SUBMITTED,
          image: safeImageUrl,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      })

      await tx.complaintEvent.create({
        data: {
          complaintId: c.id,
          actor: ComplaintActor.STUDENT,
          actorName: studentFullName,
          kind: ComplaintEventKind.STATUS,
          title: 'Complaint Submitted',
          body: sanitizedDescription,
          status: ComplaintStatus.SUBMITTED,
        },
      })

      if (student.property) {
        await tx.notification.create({
          data: {
            userId: student.property.ownerId,
            role: Role.OWNER,
            kind: CommNotificationKind.COMPLAINT,
            title: `New complaint from ${studentFullName}`,
            body: sanitizedSubject,
            link: '/owner/complaints',
          },
        })
      }

      return c
    })

    const refreshed = await prisma.complaint.findUnique({
      where: { id: complaint.id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return this.formatComplaint(refreshed!)
  }

  static async updateComplaintStatus(
    ownerUserId: string,
    complaintId: string,
    status: ComplaintStatus,
    note: string
  ) {
    const { complaint } = await this.verifyComplaintAccess(ownerUserId, complaintId)

    if (complaint.property.ownerId !== ownerUserId) {
      throw AppError.forbidden('Only the property owner can update status')
    }

    const sanitizedNote = sanitizeHtml(note.trim())
    const ownerUser = await prisma.user.findUnique({ where: { id: ownerUserId } })
    const actorName = ownerUser?.fullName || 'Owner'

    await prisma.$transaction([
      prisma.complaint.update({
        where: { id: complaintId },
        data: { status },
      }),
      prisma.complaintEvent.create({
        data: {
          complaintId,
          actor: ComplaintActor.OWNER,
          actorName,
          kind: ComplaintEventKind.STATUS,
          title: `Status changed to ${status}`,
          body: sanitizedNote,
          status,
        },
      }),
      prisma.notification.create({
        data: {
          userId: complaint.student.userId,
          role: Role.STUDENT,
          kind: CommNotificationKind.COMPLAINT,
          title: `Complaint status updated: ${status}`,
          body: sanitizedNote || `Your complaint '${complaint.subject}' status was updated to ${status}.`,
          link: '/student/support',
        },
      }),
    ])

    const updated = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return this.formatComplaint(updated!)
  }

  static async addComplaintComment(
    userId: string,
    complaintId: string,
    body: string,
    title: string
  ) {
    const { complaint, isOwner } = await this.verifyComplaintAccess(userId, complaintId)
    const sanitizedBody = sanitizeHtml(body.trim())
    const sanitizedTitle = sanitizeHtml(title.trim())

    const senderUser = await prisma.user.findUnique({ where: { id: userId } })
    const userFullName = senderUser?.fullName || (isOwner ? 'Owner' : 'Student')

    const actor = isOwner ? ComplaintActor.OWNER : ComplaintActor.STUDENT
    const recipientUserId = isOwner ? complaint.student.userId : complaint.property.ownerId
    const recipientRole = isOwner ? Role.STUDENT : Role.OWNER

    await prisma.$transaction([
      prisma.complaintEvent.create({
        data: {
          complaintId,
          actor,
          actorName: userFullName,
          kind: isOwner ? ComplaintEventKind.RESPONSE : ComplaintEventKind.COMMENT,
          title: sanitizedTitle,
          body: sanitizedBody,
        },
      }),
      prisma.notification.create({
        data: {
          userId: recipientUserId,
          role: recipientRole,
          kind: CommNotificationKind.COMPLAINT,
          title: `New update on complaint: ${complaint.subject}`,
          body: sanitizedBody.length > 80 ? `${sanitizedBody.slice(0, 77)}…` : sanitizedBody,
          link: isOwner ? '/student/support' : '/owner/complaints',
        },
      }),
    ])

    const updated = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return this.formatComplaint(updated!)
  }

  static async setComplaintPriority(ownerUserId: string, complaintId: string, priority: ComplaintPriority) {
    const { complaint } = await this.verifyComplaintAccess(ownerUserId, complaintId)
    if (complaint.property.ownerId !== ownerUserId) {
      throw AppError.forbidden('Only property owner can set priority')
    }

    const ownerUser = await prisma.user.findUnique({ where: { id: ownerUserId } })

    await prisma.$transaction([
      prisma.complaint.update({
        where: { id: complaintId },
        data: { priority },
      }),
      prisma.complaintEvent.create({
        data: {
          complaintId,
          actor: ComplaintActor.OWNER,
          actorName: ownerUser?.fullName || 'Owner',
          kind: ComplaintEventKind.PRIORITY,
          title: `Priority changed to ${priority}`,
          body: `Management prioritized this complaint as ${priority}.`,
        },
      }),
    ])

    const updated = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return this.formatComplaint(updated!)
  }

  private static formatComplaint(c: any) {
    return {
      id: c.id,
      propertyId: c.propertyId,
      studentId: c.studentId,
      studentName: c.student?.user?.fullName ?? 'Student',
      roomId: c.roomId,
      roomNumber: c.roomNumber,
      category: c.category,
      subject: c.subject,
      description: c.description,
      priority: c.priority,
      status: c.status,
      submittedOn: formatDateIso(c.submittedOn),
      image: c.image,
      history: c.events?.map((e: any) => ({
        id: e.id,
        actor: e.actor,
        actorName: e.actorName,
        kind: e.kind,
        title: e.title,
        body: e.body,
        date: formatDateIso(e.createdAt),
        at: formatTime24(e.createdAt),
        status: e.status,
      })) ?? [],
    }
  }

  /* ---------------------------------------------------------- Announcements */

  static async getAnnouncements(userId: string, role: string, propertyId?: string) {
    if (role === 'OWNER') {
      const where: any = {
        property: {
          ownerId: userId,
        },
      }
      if (propertyId) where.propertyId = propertyId

      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          reads: true,
        },
        orderBy: { publishedOn: 'desc' },
      })

      return announcements.map((a) => ({
        id: a.id,
        propertyId: a.propertyId,
        title: a.title,
        message: a.message,
        category: a.category,
        priority: a.priority,
        audience: a.audience,
        audienceStudentIds: a.audienceStudentIds,
        publishedOn: formatDateIso(a.publishedOn),
        expiresOn: a.expiresOn ? formatDateIso(a.expiresOn) : '',
        published: a.published,
        readBy: a.reads.map((r) => r.studentId),
      }))
    } else {
      const student = await prisma.student.findUnique({
        where: { userId },
      })
      if (!student || !student.propertyId) return []

      const announcements = await prisma.announcement.findMany({
        where: {
          propertyId: student.propertyId,
          published: true,
          OR: [
            { audience: AnnouncementAudience.ALL },
            { audienceStudentIds: { has: student.id } },
          ],
        },
        include: {
          reads: {
            where: { studentId: student.id },
          },
        },
        orderBy: { publishedOn: 'desc' },
      })

      return announcements.map((a) => ({
        id: a.id,
        propertyId: a.propertyId,
        title: a.title,
        message: a.message,
        category: a.category,
        priority: a.priority,
        audience: a.audience,
        audienceStudentIds: a.audienceStudentIds,
        publishedOn: formatDateIso(a.publishedOn),
        expiresOn: a.expiresOn ? formatDateIso(a.expiresOn) : '',
        published: a.published,
        readBy: a.reads.length > 0 ? [student.id] : [],
      }))
    }
  }

  static async saveAnnouncement(
    ownerUserId: string,
    input: {
      id?: string | null
      propertyId: string
      title: string
      message: string
      category: any
      priority: any
      audience: any
      audienceStudentIds: string[]
      expiresOn?: string
      published?: boolean
    },
    publish = true
  ) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    })
    if (!property || property.ownerId !== ownerUserId) {
      throw AppError.forbidden('Unauthorized access to property')
    }

    const sanitizedTitle = sanitizeHtml(input.title.trim())
    const sanitizedMessage = sanitizeHtml(input.message.trim())
    const expiresDate = input.expiresOn?.trim() ? new Date(input.expiresOn) : null

    if (input.id) {
      const existing = await prisma.announcement.findUnique({
        where: { id: input.id },
      })
      if (!existing || existing.propertyId !== input.propertyId) {
        throw AppError.notFound('Announcement not found')
      }

      const updated = await prisma.announcement.update({
        where: { id: input.id },
        data: {
          title: sanitizedTitle,
          message: sanitizedMessage,
          category: input.category,
          priority: input.priority,
          audience: input.audience,
          audienceStudentIds: input.audienceStudentIds,
          expiresOn: expiresDate,
          published: publish,
        },
      })
      return updated.id
    }

    const created = await prisma.$transaction(async (tx) => {
      const a = await tx.announcement.create({
        data: {
          propertyId: input.propertyId,
          title: sanitizedTitle,
          message: sanitizedMessage,
          category: input.category,
          priority: input.priority,
          audience: input.audience,
          audienceStudentIds: input.audienceStudentIds,
          expiresOn: expiresDate,
          published: publish,
        },
      })

      if (publish) {
        // Send notifications to students in property
        const students = await tx.student.findMany({
          where: { propertyId: input.propertyId },
        })
        for (const s of students) {
          if (
            input.audience === AnnouncementAudience.ALL ||
            input.audienceStudentIds.includes(s.id)
          ) {
            await tx.notification.create({
              data: {
                userId: s.userId,
                role: Role.STUDENT,
                kind: CommNotificationKind.ANNOUNCEMENT,
                title: sanitizedTitle,
                body: sanitizedMessage.length > 80 ? `${sanitizedMessage.slice(0, 77)}…` : sanitizedMessage,
                link: '/student/notices',
              },
            })
          }
        }
      }

      return a
    })

    return created.id
  }

  static async toggleAnnouncementPublished(ownerUserId: string, announcementId: string) {
    const ann = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { property: true },
    })
    if (!ann || ann.property.ownerId !== ownerUserId) {
      throw AppError.forbidden('Unauthorized')
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: { published: !ann.published },
    })
    return { published: updated.published }
  }

  static async deleteAnnouncement(ownerUserId: string, announcementId: string) {
    const ann = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { property: true },
    })
    if (!ann || ann.property.ownerId !== ownerUserId) {
      throw AppError.forbidden('Unauthorized')
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    })
    return { ok: true }
  }

  static async markAnnouncementRead(studentUserId: string, announcementId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    })
    if (!student) return { ok: false }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_studentId: {
          announcementId,
          studentId: student.id,
        },
      },
      create: {
        announcementId,
        studentId: student.id,
      },
      update: {},
    })

    return { ok: true }
  }

  /* ----------------------------------------------------------- Notifications */

  static async getNotifications(userId: string) {
    const notifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return notifs.map((n) => ({
      id: n.id,
      role: n.role as 'OWNER' | 'STUDENT',
      kind: n.kind as any,
      title: n.title,
      body: n.body,
      to: n.link || '#',
      date: formatDateIso(n.createdAt),
      at: formatTime24(n.createdAt),
      read: n.read,
    }))
  }

  static async markNotificationRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    })
    return { ok: true }
  }

  static async markAllNotificationsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    return { ok: true }
  }

  static async clearNotification(userId: string, notificationId: string) {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    })
    return { ok: true }
  }

  /* --------------------------------- Student Notices, Profile & Settings */

  static async getStudentNotices(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    })
    if (!student || !student.propertyId) return []

    const announcements = await prisma.announcement.findMany({
      where: {
        propertyId: student.propertyId,
        published: true,
        OR: [
          { audience: AnnouncementAudience.ALL },
          { audienceStudentIds: { has: student.id } },
        ],
      },
      include: {
        reads: {
          where: { studentId: student.id },
        },
      },
      orderBy: { publishedOn: 'desc' },
    })

    return announcements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.message,
      date: formatDateIso(a.publishedOn),
      category: a.category,
      read: a.reads.length > 0,
    }))
  }

  static async getStudentProfile(studentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: studentUserId },
      include: { studentProfile: true },
    })
    if (!user) throw AppError.notFound('User not found')

    return {
      name: user.fullName,
      email: user.email,
      mobile: user.mobile ?? '',
      college: user.studentProfile?.college ?? '',
      city: user.city ?? user.studentProfile?.city ?? '',
      emergencyContact: user.studentProfile?.emergencyContact ?? '',
    }
  }

  static async updateStudentProfile(
    studentUserId: string,
    patch: {
      name?: string
      mobile?: string | null
      college?: string
      city?: string
      emergencyContact?: string
    }
  ) {
    await prisma.user.update({
      where: { id: studentUserId },
      data: {
        fullName: patch.name ? sanitizeHtml(patch.name.trim()) : undefined,
        mobile: patch.mobile !== undefined ? patch.mobile : undefined,
        city: patch.city ? sanitizeHtml(patch.city.trim()) : undefined,
      },
    })

    if (patch.college !== undefined || patch.emergencyContact !== undefined || patch.city !== undefined) {
      await prisma.student.upsert({
        where: { userId: studentUserId },
        create: {
          userId: studentUserId,
          college: patch.college ? sanitizeHtml(patch.college.trim()) : '',
          city: patch.city ? sanitizeHtml(patch.city.trim()) : '',
          emergencyContact: patch.emergencyContact ? sanitizeHtml(patch.emergencyContact.trim()) : '',
        },
        update: {
          college: patch.college ? sanitizeHtml(patch.college.trim()) : undefined,
          city: patch.city ? sanitizeHtml(patch.city.trim()) : undefined,
          emergencyContact: patch.emergencyContact ? sanitizeHtml(patch.emergencyContact.trim()) : undefined,
        },
      })
    }

    return this.getStudentProfile(studentUserId)
  }

  static async getStudentSettings(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    })

    const defaultSettings = {
      languageEnglish: true,
      showProfileToOwner: true,
      noticeAlerts: true,
      rentReminders: true,
      emailDigest: false,
      compactCards: false,
      reduceMotion: false,
      darkMode: false,
    }

    if (!student || !student.settings) {
      return defaultSettings
    }

    return {
      ...defaultSettings,
      ...(student.settings as object),
    }
  }

  static async updateStudentSettings(studentUserId: string, patch: Record<string, any>) {
    const current = await this.getStudentSettings(studentUserId)
    const nextSettings = { ...current, ...patch }

    await prisma.student.upsert({
      where: { userId: studentUserId },
      create: {
        userId: studentUserId,
        settings: nextSettings,
      },
      update: {
        settings: nextSettings,
      },
    })

    return nextSettings
  }
}
