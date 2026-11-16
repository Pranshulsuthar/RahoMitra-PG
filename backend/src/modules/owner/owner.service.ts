import crypto from 'node:crypto';
import {
  PropertyStatus,
  RoomType,
  BedStatus,
  MembershipStatus,
  AdmissionCodeStatus,
  AdmissionRequestStatus,
  Role,
} from '@prisma/client';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/errors.js';
import {
  createPropertySchema,
  updatePropertySchema,
  createRoomSchema,
  updateRoomSchema,
  createStaffSchema,
  updateStaffSchema,
  updateProfileSchema,
  generateCodeSchema,
  decideRequestSchema,
} from './owner.validation.js';
import { z } from 'zod';

export class OwnerService {
  /* ------------------------------------------------------------------------
   * Multi-Tenant Ownership & Security Guards (Anti-IDOR)
   * ------------------------------------------------------------------------ */

  async verifyPropertyOwnership(ownerId: string, propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw AppError.notFound('Property not found');
    }
    if (property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to access or modify this property');
    }
    return property;
  }

  async verifyRoomOwnership(ownerId: string, roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { property: true },
    });
    if (!room) {
      throw AppError.notFound('Room not found');
    }
    if (room.property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to access or modify this room');
    }
    return room;
  }

  async verifyBedOwnership(ownerId: string, bedId: string) {
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: {
        room: {
          include: { property: true },
        },
      },
    });
    if (!bed) {
      throw AppError.notFound('Bed not found');
    }
    if (bed.room.property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to access or modify this bed');
    }
    return bed;
  }

  async verifyStudentOwnership(ownerId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { property: true },
    });
    if (!student) {
      throw AppError.notFound('Student not found');
    }
    if (!student.property || student.property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to manage this student');
    }
    return student;
  }

  async verifyStaffOwnership(ownerId: string, staffId: string) {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { property: true },
    });
    if (!staff) {
      throw AppError.notFound('Staff member not found');
    }
    if (staff.property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to manage this staff member');
    }
    return staff;
  }

  async verifyCodeOwnership(ownerId: string, codeId: string) {
    const code = await prisma.admissionCode.findUnique({
      where: { id: codeId },
      include: { property: true },
    });
    if (!code) {
      throw AppError.notFound('Admission code not found');
    }
    if (code.property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to manage this admission code');
    }
    return code;
  }

  async verifyRequestOwnership(ownerId: string, requestId: string) {
    const request = await prisma.admissionRequest.findUnique({
      where: { id: requestId },
      include: { property: true },
    });
    if (!request) {
      throw AppError.notFound('Admission request not found');
    }
    if (request.property.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to manage this admission request');
    }
    return request;
  }

  /* ------------------------------------------------------------------------
   * Subscription Limit Check
   * ------------------------------------------------------------------------ */

  async checkPropertyLimit(ownerId: string) {
    const currentCount = await prisma.property.count({
      where: { ownerId },
    });

    // Check active subscription for custom limits; default to 1 (Starter) if not found
    const subscription = await prisma.subscription.findFirst({
      where: {
        ownerId,
        status: 'ACTIVE',
        expiryOn: { gt: new Date() },
      },
      include: { plan: true },
    });

    const allowedLimit = subscription?.plan?.propertyLimit ?? 1;

    if (currentCount >= allowedLimit) {
      throw AppError.badRequest(
        `Property limit reached. Your current plan allows up to ${allowedLimit} property(ies). Please upgrade your subscription to add more.`
      );
    }
  }

  /* ------------------------------------------------------------------------
   * Properties Management
   * ------------------------------------------------------------------------ */

  async getProperties(ownerId: string) {
    const properties = await prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p) => ({
      id: p.id,
      ownerId: p.ownerId,
      name: p.name,
      type: p.type,
      description: p.description,
      city: p.city,
      address: p.address,
      locality: p.locality,
      contactPhone: p.contactPhone,
      contactEmail: p.contactEmail,
      securityDeposit: p.securityDeposit,
      facilities: p.facilities,
      food: p.food,
      rules: p.rules,
      coverImage: p.coverImage,
      gallery: p.gallery,
      status: p.status,
      listedOn: p.createdAt.toISOString().slice(0, 10),
    }));
  }

  async createProperty(ownerId: string, data: z.infer<typeof createPropertySchema>) {
    await this.checkPropertyLimit(ownerId);

    // Create unique slug
    const baseSlug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    // A newly created property starts as PENDING until admin approves it
    const property = await prisma.property.create({
      data: {
        ownerId,
        slug,
        name: data.name,
        type: data.type,
        description: data.description,
        city: data.city,
        address: data.address,
        locality: data.locality,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        securityDeposit: data.securityDeposit,
        facilities: data.facilities,
        food: data.food,
        rules: data.rules,
        coverImage: data.coverImage,
        gallery: data.gallery,
        status: PropertyStatus.PENDING,
      },
    });

    await this.logActivity(ownerId, `Added new property "${property.name}" (Pending Approval)`, 'property', property.id);

    return {
      id: property.id,
      ownerId: property.ownerId,
      name: property.name,
      type: property.type,
      description: property.description,
      city: property.city,
      address: property.address,
      locality: property.locality,
      contactPhone: property.contactPhone,
      contactEmail: property.contactEmail,
      securityDeposit: property.securityDeposit,
      facilities: property.facilities,
      food: property.food,
      rules: property.rules,
      coverImage: property.coverImage,
      gallery: property.gallery,
      status: property.status,
      listedOn: property.createdAt.toISOString().slice(0, 10),
    };
  }

  async updateProperty(ownerId: string, propertyId: string, data: z.infer<typeof updatePropertySchema>) {
    await this.verifyPropertyOwnership(ownerId, propertyId);

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...data,
      },
    });

    await this.logActivity(ownerId, `Updated property details for "${updated.name}"`, 'property', updated.id);

    return {
      id: updated.id,
      ownerId: updated.ownerId,
      name: updated.name,
      type: updated.type,
      description: updated.description,
      city: updated.city,
      address: updated.address,
      locality: updated.locality,
      contactPhone: updated.contactPhone,
      contactEmail: updated.contactEmail,
      securityDeposit: updated.securityDeposit,
      facilities: updated.facilities,
      food: updated.food,
      rules: updated.rules,
      coverImage: updated.coverImage,
      gallery: updated.gallery,
      status: updated.status,
      listedOn: updated.createdAt.toISOString().slice(0, 10),
    };
  }

  async setPropertyStatus(ownerId: string, propertyId: string, status: PropertyStatus) {
    await this.verifyPropertyOwnership(ownerId, propertyId);

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: { status },
    });

    await this.logActivity(ownerId, `Changed status of "${updated.name}" to ${status}`, 'property', updated.id);

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  /* ------------------------------------------------------------------------
   * Rooms & Beds Management
   * ------------------------------------------------------------------------ */

  async getRooms(ownerId: string, propertyId?: string) {
    // If propertyId specified, verify ownership; otherwise find all rooms for all properties owned by owner
    const where: any = {};
    if (propertyId && propertyId !== 'ALL') {
      await this.verifyPropertyOwnership(ownerId, propertyId);
      where.propertyId = propertyId;
    } else {
      where.property = { ownerId };
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        beds: {
          orderBy: { label: 'asc' },
        },
      },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });

    return rooms.map((r) => ({
      id: r.id,
      propertyId: r.propertyId,
      number: r.number,
      floor: r.floor,
      type: r.type,
      rent: r.rent,
      beds: r.beds.map((b) => ({
        id: b.id,
        roomId: b.roomId,
        label: b.label,
        status: b.status,
      })),
    }));
  }

  async createRoom(ownerId: string, data: z.infer<typeof createRoomSchema>) {
    await this.verifyPropertyOwnership(ownerId, data.propertyId);

    const room = await prisma.room.create({
      data: {
        propertyId: data.propertyId,
        number: data.number,
        floor: data.floor,
        type: data.type,
        rent: data.rent,
      },
    });

    // Auto-create beds based on capacity or room type
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const count =
      data.capacity ||
      (data.type === RoomType.SINGLE ? 1 : data.type === RoomType.DOUBLE ? 2 : data.type === RoomType.TRIPLE ? 3 : 4);

    const bedsData = [];
    for (let i = 0; i < count; i++) {
      const label = bedLabels[i] || `Bed ${i + 1}`;
      const bed = await prisma.bed.create({
        data: {
          roomId: room.id,
          label,
          status: BedStatus.AVAILABLE,
        },
      });
      bedsData.push({
        id: bed.id,
        roomId: bed.roomId,
        label: bed.label,
        status: bed.status,
      });
    }

    await this.logActivity(ownerId, `Created room ${room.number} with ${count} beds`, 'room', data.propertyId);

    return {
      id: room.id,
      propertyId: room.propertyId,
      number: room.number,
      floor: room.floor,
      type: room.type,
      rent: room.rent,
      beds: bedsData,
    };
  }

  async updateRoom(ownerId: string, roomId: string, data: z.infer<typeof updateRoomSchema>) {
    const existing = await this.verifyRoomOwnership(ownerId, roomId);

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        number: data.number,
        floor: data.floor,
        type: data.type,
        rent: data.rent,
      },
      include: {
        beds: { orderBy: { label: 'asc' } },
      },
    });

    await this.logActivity(ownerId, `Updated details for room ${updated.number}`, 'room', existing.propertyId);

    return {
      id: updated.id,
      propertyId: updated.propertyId,
      number: updated.number,
      floor: updated.floor,
      type: updated.type,
      rent: updated.rent,
      beds: updated.beds.map((b) => ({
        id: b.id,
        roomId: b.roomId,
        label: b.label,
        status: b.status,
      })),
    };
  }

  async deleteRoom(ownerId: string, roomId: string) {
    const existing = await this.verifyRoomOwnership(ownerId, roomId);

    await prisma.room.delete({
      where: { id: roomId },
    });

    await this.logActivity(ownerId, `Deleted room ${existing.number}`, 'room', existing.propertyId);

    return { success: true };
  }

  async addBed(ownerId: string, roomId: string) {
    const room = await this.verifyRoomOwnership(ownerId, roomId);

    const existingBeds = await prisma.bed.findMany({
      where: { roomId },
      orderBy: { label: 'asc' },
    });

    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const nextLabel = bedLabels[existingBeds.length] || `Bed ${existingBeds.length + 1}`;

    const bed = await prisma.bed.create({
      data: {
        roomId,
        label: nextLabel,
        status: BedStatus.AVAILABLE,
      },
    });

    await this.logActivity(ownerId, `Added bed ${bed.label} to room ${room.number}`, 'room', room.propertyId);

    return {
      id: bed.id,
      roomId: bed.roomId,
      label: bed.label,
      status: bed.status,
    };
  }

  async setBedStatus(ownerId: string, bedId: string, status: BedStatus) {
    const bed = await this.verifyBedOwnership(ownerId, bedId);

    const updated = await prisma.bed.update({
      where: { id: bedId },
      data: { status },
    });

    await this.logActivity(
      ownerId,
      `Changed bed ${bed.label} (Room ${bed.room.number}) status to ${status}`,
      'room',
      bed.room.propertyId
    );

    return {
      id: updated.id,
      roomId: updated.roomId,
      label: updated.label,
      status: updated.status,
    };
  }

  /* ------------------------------------------------------------------------
   * Students Management
   * ------------------------------------------------------------------------ */

  async getStudents(ownerId: string, propertyId?: string) {
    const where: any = {};
    if (propertyId && propertyId !== 'ALL') {
      await this.verifyPropertyOwnership(ownerId, propertyId);
      where.propertyId = propertyId;
    } else {
      where.property = { ownerId };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            mobile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((s) => ({
      id: s.id,
      propertyId: s.propertyId || '',
      roomId: s.roomId || '',
      bedId: s.bedId || '',
      name: s.user.fullName,
      email: s.user.email,
      mobile: s.user.mobile || '',
      college: s.college,
      city: s.city,
      admissionDate: s.admissionDate.toISOString().slice(0, 10),
      membership: s.membership,
    }));
  }

  async setStudentMembership(ownerId: string, studentId: string, status: MembershipStatus) {
    const student = await this.verifyStudentOwnership(ownerId, studentId);

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { membership: status },
      include: {
        user: { select: { fullName: true } },
      },
    });

    await this.logActivity(
      ownerId,
      `Updated membership for ${updated.user.fullName} to ${status}`,
      'student',
      student.propertyId
    );

    return {
      id: updated.id,
      membership: updated.membership,
    };
  }

  /* ------------------------------------------------------------------------
   * Staff Management
   * ------------------------------------------------------------------------ */

  async getStaff(ownerId: string, propertyId?: string) {
    const where: any = {};
    if (propertyId && propertyId !== 'ALL') {
      await this.verifyPropertyOwnership(ownerId, propertyId);
      where.propertyId = propertyId;
    } else {
      where.property = { ownerId };
    }

    const staffList = await prisma.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return staffList.map((s) => ({
      id: s.id,
      propertyId: s.propertyId,
      name: s.name,
      email: s.email,
      mobile: s.mobile,
      role: s.role,
      joinedOn: s.joinedOn.toISOString().slice(0, 10),
    }));
  }

  async addStaff(ownerId: string, data: z.infer<typeof createStaffSchema>) {
    await this.verifyPropertyOwnership(ownerId, data.propertyId);

    const staff = await prisma.staff.create({
      data: {
        propertyId: data.propertyId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
      },
    });

    await this.logActivity(ownerId, `Added staff member ${staff.name} (${staff.role})`, 'staff', data.propertyId);

    return {
      id: staff.id,
      propertyId: staff.propertyId,
      name: staff.name,
      email: staff.email,
      mobile: staff.mobile,
      role: staff.role,
      joinedOn: staff.joinedOn.toISOString().slice(0, 10),
    };
  }

  async updateStaff(ownerId: string, staffId: string, data: z.infer<typeof updateStaffSchema>) {
    await this.verifyStaffOwnership(ownerId, staffId);
    await this.verifyPropertyOwnership(ownerId, data.propertyId);

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        propertyId: data.propertyId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
      },
    });

    await this.logActivity(ownerId, `Updated details for staff member ${updated.name}`, 'staff', updated.propertyId);

    return {
      id: updated.id,
      propertyId: updated.propertyId,
      name: updated.name,
      email: updated.email,
      mobile: updated.mobile,
      role: updated.role,
      joinedOn: updated.joinedOn.toISOString().slice(0, 10),
    };
  }

  async removeStaff(ownerId: string, staffId: string) {
    const staff = await this.verifyStaffOwnership(ownerId, staffId);

    await prisma.staff.delete({
      where: { id: staffId },
    });

    await this.logActivity(ownerId, `Removed staff member ${staff.name}`, 'staff', staff.propertyId);

    return { success: true };
  }

  /* ------------------------------------------------------------------------
   * Admission Codes & Requests
   * ------------------------------------------------------------------------ */

  async getAdmissionCodes(ownerId: string, propertyId?: string) {
    const where: any = {};
    if (propertyId && propertyId !== 'ALL') {
      await this.verifyPropertyOwnership(ownerId, propertyId);
      where.propertyId = propertyId;
    } else {
      where.property = { ownerId };
    }

    const codes = await prisma.admissionCode.findMany({
      where,
      orderBy: { createdOn: 'desc' },
    });

    return codes.map((c) => ({
      id: c.id,
      propertyId: c.propertyId,
      code: c.code,
      roomPreference: c.roomPreference || '',
      expiresOn: c.expiresOn.toISOString().slice(0, 10),
      status: c.status,
      createdOn: c.createdOn.toISOString().slice(0, 10),
    }));
  }

  async generateAdmissionCode(ownerId: string, data: z.infer<typeof generateCodeSchema>) {
    await this.verifyPropertyOwnership(ownerId, data.propertyId);

    // Cryptographically random, unpredictable 32-bit hex code (single-use)
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const codeStr = `ADM-${randomHex}`;
    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + data.expiresInDays);

    const created = await prisma.admissionCode.create({
      data: {
        propertyId: data.propertyId,
        code: codeStr,
        roomPreference: data.roomPreference || null,
        expiresOn,
        status: AdmissionCodeStatus.ACTIVE,
      },
    });

    await this.logActivity(ownerId, `Generated admission code ${codeStr}`, 'admission', data.propertyId);

    return {
      id: created.id,
      propertyId: created.propertyId,
      code: created.code,
      roomPreference: created.roomPreference || '',
      expiresOn: created.expiresOn.toISOString().slice(0, 10),
      status: created.status,
      createdOn: created.createdOn.toISOString().slice(0, 10),
    };
  }

  async revokeAdmissionCode(ownerId: string, codeId: string) {
    const code = await this.verifyCodeOwnership(ownerId, codeId);

    const updated = await prisma.admissionCode.update({
      where: { id: codeId },
      data: { status: AdmissionCodeStatus.REVOKED },
    });

    await this.logActivity(ownerId, `Revoked admission code ${code.code}`, 'admission', code.propertyId);

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async getAdmissionRequests(ownerId: string, propertyId?: string) {
    const where: any = {};
    if (propertyId && propertyId !== 'ALL') {
      await this.verifyPropertyOwnership(ownerId, propertyId);
      where.propertyId = propertyId;
    } else {
      where.property = { ownerId };
    }

    const requests = await prisma.admissionRequest.findMany({
      where,
      orderBy: { requestedOn: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      propertyId: r.propertyId,
      code: r.code,
      roomPreference: r.roomPreference || '',
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      studentMobile: r.studentMobile,
      requestedOn: r.requestedOn.toISOString().slice(0, 10),
      status: r.status,
      decidedOn: r.decidedOn?.toISOString().slice(0, 10),
      reason: r.reason || undefined,
    }));
  }

  async decideAdmissionRequest(ownerId: string, requestId: string, data: z.infer<typeof decideRequestSchema>) {
    const request = await this.verifyRequestOwnership(ownerId, requestId);

    if (request.status !== AdmissionRequestStatus.PENDING) {
      throw AppError.badRequest('This admission request has already been decided');
    }

    if (data.decision === 'REJECTED') {
      const updated = await prisma.admissionRequest.update({
        where: { id: requestId },
        data: {
          status: AdmissionRequestStatus.REJECTED,
          decidedOn: new Date(),
          reason: data.reason || 'Rejected by property owner',
        },
      });

      // Notify student if user exists in system
      const studentUser = await prisma.user.findUnique({
        where: { email: request.studentEmail.toLowerCase() },
      });
      if (studentUser) {
        await prisma.notification.create({
          data: {
            userId: studentUser.id,
            role: Role.STUDENT,
            title: 'Admission Request Update',
            body: `Your admission request for ${request.property.name} was rejected: ${data.reason || 'No reason provided'}`,
          },
        });
      }

      await this.logActivity(
        ownerId,
        `Rejected admission request from ${request.studentName}`,
        'admission',
        request.propertyId
      );

      return {
        id: updated.id,
        status: updated.status,
        decidedOn: updated.decidedOn?.toISOString().slice(0, 10),
        reason: updated.reason,
      };
    }

    // APPROVAL FLOW: Run in ONE strict database transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch code record and verify still usable
      const codeRecord = await tx.admissionCode.findUnique({
        where: { code: request.code },
      });

      if (!codeRecord) {
        throw AppError.badRequest('Admission code associated with this request not found');
      }

      if (codeRecord.status === AdmissionCodeStatus.USED) {
        throw AppError.badRequest('This admission code has already been used by another student');
      }

      if (codeRecord.status === AdmissionCodeStatus.REVOKED) {
        throw AppError.badRequest('This admission code has been revoked by the owner');
      }

      if (codeRecord.status === AdmissionCodeStatus.EXPIRED || codeRecord.expiresOn < new Date()) {
        await tx.admissionCode.update({
          where: { id: codeRecord.id },
          data: { status: AdmissionCodeStatus.EXPIRED },
        });
        throw AppError.badRequest('This admission code has expired');
      }

      // 2. Locate target room and candidate available bed
      let candidateBed: { id: string; roomId: string } | null = null;

      if (request.roomPreference) {
        const bed = await tx.bed.findFirst({
          where: {
            roomId: request.roomPreference,
            status: BedStatus.AVAILABLE,
          },
        });
        if (bed) {
          candidateBed = { id: bed.id, roomId: bed.roomId };
        }
      }

      if (!candidateBed) {
        // Fallback: any available bed in the property
        const bed = await tx.bed.findFirst({
          where: {
            room: { propertyId: request.propertyId },
            status: BedStatus.AVAILABLE,
          },
          include: { room: true },
        });
        if (!bed) {
          throw AppError.badRequest('Approval blocked: No available beds in this property');
        }
        candidateBed = { id: bed.id, roomId: bed.roomId };
      }

      // 3. ATOMIC CONCURRENCY GUARD: Mark bed OCCUPIED strictly where status is STILL AVAILABLE
      const bedUpdateResult = await tx.bed.updateMany({
        where: {
          id: candidateBed.id,
          status: BedStatus.AVAILABLE,
        },
        data: {
          status: BedStatus.OCCUPIED,
        },
      });

      if (bedUpdateResult.count === 0) {
        throw AppError.conflict('The selected bed was just taken by another student. Please retry.');
      }

      // 4. Mark code as USED (Single-Use enforcement)
      const codeUpdateResult = await tx.admissionCode.updateMany({
        where: {
          id: codeRecord.id,
          status: AdmissionCodeStatus.ACTIVE,
        },
        data: {
          status: AdmissionCodeStatus.USED,
        },
      });

      if (codeUpdateResult.count === 0) {
        throw AppError.conflict('This code was just redeemed in another transaction.');
      }

      // 5. Update Student profile & membership
      const studentUser = await tx.user.findUnique({
        where: { email: request.studentEmail.toLowerCase() },
      });

      if (studentUser) {
        await tx.student.upsert({
          where: { userId: studentUser.id },
          update: {
            propertyId: request.propertyId,
            roomId: candidateBed.roomId,
            bedId: candidateBed.id,
            membership: MembershipStatus.ACTIVE,
            admissionDate: new Date(),
          },
          create: {
            userId: studentUser.id,
            propertyId: request.propertyId,
            roomId: candidateBed.roomId,
            bedId: candidateBed.id,
            membership: MembershipStatus.ACTIVE,
            admissionDate: new Date(),
          },
        });

        // 6. Notify student
        await tx.notification.create({
          data: {
            userId: studentUser.id,
            role: Role.STUDENT,
            title: 'Admission Approved!',
            body: `Congratulations! Your admission to ${request.property.name} has been approved.`,
          },
        });
      }

      // 7. Update Request to APPROVED
      const updatedReq = await tx.admissionRequest.update({
        where: { id: requestId },
        data: {
          status: AdmissionRequestStatus.APPROVED,
          decidedOn: new Date(),
        },
      });

      return {
        id: updatedReq.id,
        status: updatedReq.status,
        decidedOn: updatedReq.decidedOn?.toISOString().slice(0, 10),
      };
    });
  }

  /* ------------------------------------------------------------------------
   * Owner Profile, Notifications & Activities
   * ------------------------------------------------------------------------ */

  async getProfile(ownerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user) {
      throw AppError.notFound('Owner profile not found');
    }

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      mobile: user.mobile || '',
      city: user.city || '',
      bio: user.bio || '',
    };
  }

  async updateProfile(ownerId: string, data: z.infer<typeof updateProfileSchema>) {
    const updated = await prisma.user.update({
      where: { id: ownerId },
      data: {
        fullName: data.name,
        mobile: data.mobile,
        city: data.city,
        bio: data.bio,
      },
    });

    return {
      id: updated.id,
      name: updated.fullName,
      email: updated.email,
      mobile: updated.mobile || '',
      city: updated.city || '',
      bio: updated.bio || '',
    };
  }

  async getNotifications(ownerId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.body,
      on: n.createdAt.toISOString().slice(0, 10),
      read: n.read,
      category: (n.category === 'PLATFORM' ? 'ACCOUNT' : n.category) as 'ADMISSION' | 'ROOM' | 'PROPERTY' | 'ACCOUNT',
    }));
  }

  async markNotificationRead(ownerId: string, notificationId: string, read: boolean) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== ownerId) {
      throw AppError.notFound('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read },
    });

    return {
      id: updated.id,
      read: updated.read,
    };
  }

  async markAllNotificationsRead(ownerId: string) {
    await prisma.notification.updateMany({
      where: { userId: ownerId, read: false },
      data: { read: true },
    });

    return { success: true };
  }

  async removeNotification(ownerId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== ownerId) {
      throw AppError.notFound('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async getActivities(ownerId: string) {
    const logs = await prisma.activityLog.findMany({
      where: { actorId: ownerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((l) => ({
      id: l.id,
      propertyId: l.entityId || null,
      text: l.description,
      time: l.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kind: (l.entity.toLowerCase() as any) || 'property',
    }));
  }

  private async logActivity(ownerId: string, text: string, kind: string, propertyId: string | null = null) {
    try {
      await prisma.activityLog.create({
        data: {
          actorId: ownerId,
          actorRole: Role.OWNER,
          action: kind.toUpperCase(),
          entity: kind,
          entityId: propertyId,
          description: text,
        },
      });
    } catch {
      // Activity logging failure shouldn't fail primary operational mutation
    }
  }

  /**
   * Consolidated initial fetch for OwnerStore bootstrap
   */
  async getDashboardData(ownerId: string) {
    const [profile, properties, rooms, students, staff, codes, requests, notifications, activities] = await Promise.all([
      this.getProfile(ownerId),
      this.getProperties(ownerId),
      this.getRooms(ownerId),
      this.getStudents(ownerId),
      this.getStaff(ownerId),
      this.getAdmissionCodes(ownerId),
      this.getAdmissionRequests(ownerId),
      this.getNotifications(ownerId),
      this.getActivities(ownerId),
    ]);

    return {
      owner: profile,
      properties,
      rooms,
      students,
      staff,
      codes,
      requests,
      notifications,
      activities,
    };
  }
}

export const ownerService = new OwnerService();
