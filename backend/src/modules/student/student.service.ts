import {
  AdmissionCodeStatus,
  AdmissionRequestStatus,
  BedStatus,
  MembershipStatus,
  Role,
} from '@prisma/client';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/errors.js';
import { submitAdmissionCodeSchema } from './student.validation.js';
import { z } from 'zod';

export class StudentService {
  /**
   * Submit admission code to request joining a PG
   */
  async submitAdmissionCode(userId: string, data: z.infer<typeof submitAdmissionCodeSchema>) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('Student account not found');
    }

    const cleanCode = data.code.trim().toUpperCase();

    // 1. Validate admission code
    const codeRecord = await prisma.admissionCode.findUnique({
      where: { code: cleanCode },
      include: {
        property: true,
      },
    });

    if (!codeRecord) {
      throw AppError.notFound('Invalid admission code');
    }

    if (codeRecord.status === AdmissionCodeStatus.USED) {
      throw AppError.badRequest('This admission code has already been used');
    }

    if (codeRecord.status === AdmissionCodeStatus.REVOKED) {
      throw AppError.badRequest('This admission code has been revoked by the owner');
    }

    if (codeRecord.status === AdmissionCodeStatus.EXPIRED || codeRecord.expiresOn < new Date()) {
      await prisma.admissionCode.update({
        where: { id: codeRecord.id },
        data: { status: AdmissionCodeStatus.EXPIRED },
      });
      throw AppError.badRequest('This admission code has expired');
    }

    // 2. Prevent duplicate pending requests for the same property
    const existingPending = await prisma.admissionRequest.findFirst({
      where: {
        studentEmail: user.email.toLowerCase(),
        propertyId: codeRecord.propertyId,
        status: AdmissionRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw AppError.conflict('You already have a pending admission request for this property');
    }

    // 3. Verify that property has at least one room/bed available
    const availableBedsCount = await prisma.bed.count({
      where: {
        room: { propertyId: codeRecord.propertyId },
        status: BedStatus.AVAILABLE,
      },
    });

    if (availableBedsCount === 0) {
      throw AppError.badRequest('This PG currently has no available beds');
    }

    // 4. Create Admission Request
    const request = await prisma.admissionRequest.create({
      data: {
        propertyId: codeRecord.propertyId,
        code: codeRecord.code,
        roomPreference: data.roomPreference || codeRecord.roomPreference || null,
        studentName: user.fullName,
        studentEmail: user.email.toLowerCase(),
        studentMobile: user.mobile || '',
        status: AdmissionRequestStatus.PENDING,
      },
      include: {
        property: {
          select: {
            name: true,
            city: true,
            locality: true,
          },
        },
      },
    });

    // 5. Notify property owner
    await prisma.notification.create({
      data: {
        userId: codeRecord.property.ownerId,
        role: Role.OWNER,
        title: 'New Admission Request',
        body: `${user.fullName} has submitted admission code ${codeRecord.code} for ${codeRecord.property.name}.`,
      },
    });

    return {
      id: request.id,
      propertyId: request.propertyId,
      propertyName: request.property.name,
      propertyCity: request.property.city,
      propertyLocality: request.property.locality,
      code: request.code,
      roomPreference: request.roomPreference || '',
      studentName: request.studentName,
      status: request.status,
      requestedOn: request.requestedOn.toISOString().slice(0, 10),
    };
  }

  /**
   * View student's own admission requests (strictly scoped to student's email)
   */
  async getOwnAdmissionRequests(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('Student account not found');
    }

    const requests = await prisma.admissionRequest.findMany({
      where: {
        studentEmail: user.email.toLowerCase(),
      },
      include: {
        property: {
          select: {
            name: true,
            city: true,
            locality: true,
            coverImage: true,
          },
        },
      },
      orderBy: { requestedOn: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      propertyId: r.propertyId,
      propertyName: r.property.name,
      propertyCity: r.property.city,
      propertyLocality: r.property.locality,
      coverImage: r.property.coverImage,
      code: r.code,
      roomPreference: r.roomPreference || '',
      status: r.status,
      requestedOn: r.requestedOn.toISOString().slice(0, 10),
      decidedOn: r.decidedOn?.toISOString().slice(0, 10),
      reason: r.reason || undefined,
    }));
  }

  /**
   * Get student's current active accommodation details
   */
  async getStudentAccommodation(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        property: {
          include: {
            owner: {
              select: {
                fullName: true,
                mobile: true,
                email: true,
              },
            },
          },
        },
        room: true,
        bed: true,
      },
    });

    if (!student || !student.property || !student.room || !student.bed) {
      return null;
    }

    // Find roommates in the same room
    const roommates = await prisma.student.findMany({
      where: {
        roomId: student.roomId,
        id: { not: student.id },
        membership: MembershipStatus.ACTIVE,
      },
      include: {
        user: { select: { fullName: true } },
        bed: { select: { label: true } },
      },
    });

    return {
      property: {
        id: student.property.id,
        name: student.property.name,
        type: student.property.type,
        city: student.property.city,
        locality: student.property.locality,
        address: student.property.address,
        coverImage: student.property.coverImage,
        gallery: student.property.gallery,
        food: student.property.food,
        facilities: student.property.facilities,
        rules: student.property.rules,
        owner: {
          name: student.property.owner.fullName,
          phone: student.property.contactPhone || student.property.owner.mobile,
          email: student.property.contactEmail || student.property.owner.email,
        },
      },
      room: {
        id: student.room.id,
        number: student.room.number,
        floor: student.room.floor,
        type: student.room.type,
        rent: student.room.rent,
      },
      bed: {
        id: student.bed.id,
        label: student.bed.label,
        status: student.bed.status,
      },
      membership: student.membership,
      admissionDate: student.admissionDate.toISOString().slice(0, 10),
      roommates: roommates.map((m) => ({
        name: m.user.fullName,
        bedLabel: m.bed?.label || '',
      })),
    };
  }
}

export const studentService = new StudentService();
