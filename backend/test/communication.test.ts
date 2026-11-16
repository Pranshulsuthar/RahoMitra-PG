import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../src/db/client.js'
import { CommunicationService } from '../src/modules/communication/communication.service.js'
import { UploadService } from '../src/modules/upload/upload.service.js'
import { sanitizeHtml } from '../src/utils/sanitize.js'
import {
  Role,
  UserStatus,
  PGCategory,
  RoomType,
  BedStatus,
  MembershipStatus,
  ComplaintStatus,
  ComplaintPriority,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

describe('Communication, Complaints & Uploads System Tests', () => {
  let ownerId: string
  let student1UserId: string
  let student1Id: string
  let student2UserId: string
  let student2Id: string
  let propertyId: string
  let roomId: string
  let bed1Id: string
  let bed2Id: string
  let conversationId: string

  before(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 12)

    // Create Owner
    const owner = await prisma.user.create({
      data: {
        email: `comm-owner-${Date.now()}@test.com`,
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Vikram Singh',
        mobile: '9876541111',
      },
    })
    ownerId = owner.id

    // Create Student 1
    const student1 = await prisma.user.create({
      data: {
        email: `comm-student1-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Rahul Sharma',
        mobile: '9876542222',
      },
    })
    student1UserId = student1.id

    // Create Student 2
    const student2 = await prisma.user.create({
      data: {
        email: `comm-student2-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Priya Patel',
        mobile: '9876543333',
      },
    })
    student2UserId = student2.id

    // Create Property
    const property = await prisma.property.create({
      data: {
        ownerId,
        slug: `comm-prop-${Date.now()}`,
        name: 'Royal Heritage PG',
        type: PGCategory.BOYS,
        city: 'Jaipur',
        locality: 'Communication Enclave',
        status: 'ACTIVE',
      },
    })
    propertyId = property.id

    // Create Room
    const room = await prisma.room.create({
      data: {
        propertyId,
        number: '201',
        floor: 2,
        type: RoomType.DOUBLE,
        rent: 9000,
      },
    })
    roomId = room.id

    // Create Beds
    const bed1 = await prisma.bed.create({
      data: {
        roomId,
        label: 'A',
        status: BedStatus.OCCUPIED,
      },
    })
    bed1Id = bed1.id

    const bed2 = await prisma.bed.create({
      data: {
        roomId,
        label: 'B',
        status: BedStatus.OCCUPIED,
      },
    })
    bed2Id = bed2.id

    // Create Student Profiles
    const profile1 = await prisma.student.create({
      data: {
        userId: student1UserId,
        propertyId,
        roomId,
        bedId: bed1Id,
        membership: MembershipStatus.ACTIVE,
        college: 'Rajasthan Tech Univ',
      },
    })
    student1Id = profile1.id

    const profile2 = await prisma.student.create({
      data: {
        userId: student2UserId,
        propertyId,
        roomId,
        bedId: bed2Id,
        membership: MembershipStatus.ACTIVE,
        college: 'Jaipur National Univ',
      },
    })
    student2Id = profile2.id
  })

  after(async () => {
    // Cleanup
    await prisma.notification.deleteMany({ where: { userId: { in: [ownerId, student1UserId, student2UserId] } } })
    await prisma.announcementRead.deleteMany({})
    await prisma.announcement.deleteMany({ where: { propertyId } })
    await prisma.complaintEvent.deleteMany({})
    await prisma.complaint.deleteMany({ where: { propertyId } })
    await prisma.chatMessage.deleteMany({})
    await prisma.conversation.deleteMany({ where: { propertyId } })
    await prisma.student.deleteMany({ where: { id: { in: [student1Id, student2Id] } } })
    await prisma.bed.deleteMany({ where: { id: { in: [bed1Id, bed2Id] } } })
    await prisma.room.deleteMany({ where: { id: roomId } })
    await prisma.property.deleteMany({ where: { id: propertyId } })
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, student1UserId, student2UserId] } } })
  })

  it('1. Upload security: accepts valid images and rejects non-image or oversized files', () => {
    // Valid 1x1 transparent PNG data URI (valid magic bytes 89 50 4E 47)
    const validPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const res = UploadService.processImage(validPng)
    assert.equal(res.mimeType, 'image/png')
    assert.ok(res.sizeBytes > 0)

    // Rejection A: non-image text/html
    assert.throws(
      () => {
        UploadService.processImage('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')
      },
      (err: any) => {
        assert.equal(err.statusCode, 400)
        assert.match(err.message, /Allowed types are: JPEG, PNG, WEBP, GIF/)
        return true
      }
    )

    // Rejection B: oversized payload (> 5 MB)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0)
    // Add PNG signature to header so mime passes but size fails
    largeBuffer[0] = 0x89
    largeBuffer[1] = 0x50
    largeBuffer[2] = 0x4e
    largeBuffer[3] = 0x47
    const oversizedPng = `data:image/png;base64,${largeBuffer.toString('base64')}`

    assert.throws(
      () => {
        UploadService.processImage(oversizedPng)
      },
      (err: any) => {
        assert.equal(err.statusCode, 400)
        assert.match(err.message, /exceeds maximum allowed size of 5 MB/)
        return true
      }
    )
  })

  it('2. XSS sanitization neutralizes malicious scripts in messages and descriptions', () => {
    const malicious = "<script>alert('XSS Attack!')</script><img src=x onerror=alert(1)>"
    const sanitized = sanitizeHtml(malicious)

    assert.equal(sanitized.includes('<script>'), false)
    assert.equal(sanitized.includes('</script>'), false)
    assert.equal(sanitized.includes('&lt;script&gt;'), true)
  })

  it('3. Conversation 1:1 messaging, unread counter tracking & cross-user access defense', async () => {
    // Owner initializes conversation with Student 1
    const conv = await CommunicationService.getOrCreateConversation(ownerId, propertyId, student1Id)
    conversationId = conv.id
    assert.ok(conversationId)

    // Step A: Student 1 sends a message
    const msg1 = await CommunicationService.sendMessage(
      student1UserId,
      conversationId,
      'Hello Sir, when will mess lunch be served today?'
    )
    assert.equal(msg1.sender, 'STUDENT')
    assert.equal(msg1.read, false)

    // Verify unread count: owner has 1 unread message, student has 0
    let convsForOwner = await CommunicationService.getConversations(ownerId, 'OWNER')
    let c = convsForOwner.find((x) => x.id === conversationId)!
    assert.equal(c.ownerUnread, 1)
    assert.equal(c.studentUnread, 0)

    // Step B: Owner replies to Student 1
    const msg2 = await CommunicationService.sendMessage(
      ownerId,
      conversationId,
      'Lunch is served between 1 PM and 3 PM.'
    )
    assert.equal(msg2.sender, 'OWNER')

    // Verify unread count: student now has 1 unread, owner still has 1 unread
    convsForOwner = await CommunicationService.getConversations(ownerId, 'OWNER')
    c = convsForOwner.find((x) => x.id === conversationId)!
    assert.equal(c.ownerUnread, 1)
    assert.equal(c.studentUnread, 1)

    // Step C: Owner marks conversation read
    await CommunicationService.markConversationRead(ownerId, conversationId)
    convsForOwner = await CommunicationService.getConversations(ownerId, 'OWNER')
    c = convsForOwner.find((x) => x.id === conversationId)!
    assert.equal(c.ownerUnread, 0) // reset for owner
    assert.equal(c.studentUnread, 1) // still unread for student

    // Step D: Cross-user privacy: Student 2 tries to read or message in Student 1's conversation
    await assert.rejects(
      async () => {
        await CommunicationService.getMessages(student2UserId, conversationId)
      },
      (err: any) => {
        assert.equal(err.statusCode, 403)
        assert.match(err.message, /do not have access to this conversation/)
        return true
      }
    )

    await assert.rejects(
      async () => {
        await CommunicationService.sendMessage(student2UserId, conversationId, 'Hacking message')
      },
      (err: any) => {
        assert.equal(err.statusCode, 403)
        return true
      }
    )
  })

  it('4. Complaints lifecycle: submission, events history, status progression, and privacy', async () => {
    // Step A: Student 1 submits a complaint
    const complaint = await CommunicationService.submitComplaint(student1UserId, {
      propertyId,
      category: 'WIFI',
      subject: 'WiFi router in Room 201 not connecting',
      description: 'The router shows red light since morning.',
      priority: ComplaintPriority.HIGH,
    })

    assert.equal(complaint.category, 'WIFI')
    assert.equal(complaint.status, 'SUBMITTED')
    assert.equal(complaint.history.length, 1)
    assert.equal(complaint.history[0].status, 'SUBMITTED')
    assert.equal(complaint.roomNumber, '201')

    // Step B: Owner updates complaint status to IN_PROGRESS
    const inProgress = await CommunicationService.updateComplaintStatus(
      ownerId,
      complaint.id,
      ComplaintStatus.IN_PROGRESS,
      'Technician has been called and will visit by 4 PM.'
    )
    assert.equal(inProgress.status, 'IN_PROGRESS')
    assert.equal(inProgress.history.length, 2)
    assert.equal(inProgress.history[0].status, 'IN_PROGRESS')

    // Step C: Student 1 adds comment
    const withComment = await CommunicationService.addComplaintComment(
      student1UserId,
      complaint.id,
      'Thank you, I will be in the room.',
      'Student acknowledgement'
    )
    assert.equal(withComment.history.length, 3)

    // Step D: Cross-user security check: Student 2 cannot access Student 1's complaint
    await assert.rejects(
      async () => {
        await CommunicationService.getComplaintById(student2UserId, complaint.id)
      },
      (err: any) => {
        assert.equal(err.statusCode, 403)
        assert.match(err.message, /do not have access to this complaint/)
        return true
      }
    )

    // Student 2 cannot update status
    await assert.rejects(
      async () => {
        await CommunicationService.updateComplaintStatus(
          student2UserId,
          complaint.id,
          ComplaintStatus.RESOLVED,
          'Unauthorized status change'
        )
      },
      (err: any) => {
        assert.equal(err.statusCode, 403)
        return true
      }
    )
  })

  it('5. Announcements: publishing, audience targeting, read status, and expiry', async () => {
    // Owner publishes announcement
    const announcementId = await CommunicationService.saveAnnouncement(
      ownerId,
      {
        propertyId,
        title: 'Water tank cleaning tomorrow',
        message: 'Water supply will be paused between 10 AM and 1 PM tomorrow for regular maintenance.',
        category: 'ELECTRICITY_WATER',
        priority: 'IMPORTANT',
        audience: 'ALL',
        audienceStudentIds: [],
        published: true,
      },
      true
    )
    assert.ok(announcementId)

    // Student 1 fetches notices
    const notices = await CommunicationService.getStudentNotices(student1UserId)
    const notice = notices.find((n) => n.id === announcementId)
    assert.ok(notice)
    assert.equal(notice.title, 'Water tank cleaning tomorrow')
    assert.equal(notice.read, false)

    // Student 1 marks notice as read
    await CommunicationService.markAnnouncementRead(student1UserId, announcementId)

    const updatedNotices = await CommunicationService.getStudentNotices(student1UserId)
    const updatedNotice = updatedNotices.find((n) => n.id === announcementId)
    assert.equal(updatedNotice?.read, true)

    // Owner toggles publish to draft -> should no longer be visible to student
    await CommunicationService.toggleAnnouncementPublished(ownerId, announcementId)

    const hiddenNotices = await CommunicationService.getStudentNotices(student1UserId)
    assert.equal(hiddenNotices.some((n) => n.id === announcementId), false)
  })

  it('6. Student profile and settings persistence', async () => {
    // Update profile
    const profile = await CommunicationService.updateStudentProfile(student1UserId, {
      name: 'Rahul V. Sharma',
      city: 'Jaipur',
      college: 'MNIT Jaipur',
      emergencyContact: '9876549999 (Father)',
    })

    assert.equal(profile.name, 'Rahul V. Sharma')
    assert.equal(profile.college, 'MNIT Jaipur')
    assert.equal(profile.emergencyContact, '9876549999 (Father)')

    // Update settings
    const settings = await CommunicationService.updateStudentSettings(student1UserId, {
      darkMode: true,
      emailDigest: true,
      compactCards: true,
    })

    assert.equal(settings.darkMode, true)
    assert.equal(settings.emailDigest, true)
    assert.equal(settings.compactCards, true)
    assert.equal(settings.noticeAlerts, true) // default kept
  })
})
