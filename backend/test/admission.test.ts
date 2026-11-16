import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/db/client.js';
import { ownerService } from '../src/modules/owner/owner.service.js';
import { studentService } from '../src/modules/student/student.service.js';
import {
  Role,
  UserStatus,
  PGCategory,
  FoodOption,
  RoomType,
  BedStatus,
  AdmissionCodeStatus,
  AdmissionRequestStatus,
  MembershipStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Admission Flow & Concurrency Race Condition Tests', () => {
  let ownerId: string;
  let student1Id: string;
  let student2Id: string;
  let propertyId: string;
  let roomId: string;
  let singleBedId: string;

  before(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 12);

    // Create Owner
    const owner = await prisma.user.create({
      data: {
        email: `adm-owner-${Date.now()}@test.com`,
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Owner Raj',
        mobile: '9876543111',
      },
    });
    ownerId = owner.id;

    // Create Student 1
    const student1 = await prisma.user.create({
      data: {
        email: `adm-student1-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Charlie Student',
        mobile: '9876543222',
      },
    });
    student1Id = student1.id;

    // Create Student 2
    const student2 = await prisma.user.create({
      data: {
        email: `adm-student2-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Diana Student',
        mobile: '9876543333',
      },
    });
    student2Id = student2.id;

    // Create Property
    const property = await prisma.property.create({
      data: {
        ownerId,
        slug: `adm-prop-${Date.now()}`,
        name: 'Raj Villa',
        type: PGCategory.BOYS,
        city: 'Jaipur',
        locality: 'Admission Nagar',
        status: 'ACTIVE',
      },
    });
    propertyId = property.id;

    // Create Room with exactly 1 Bed
    const room = await prisma.room.create({
      data: {
        propertyId,
        number: 'R-1',
        floor: 1,
        type: RoomType.SINGLE,
        rent: 7500,
      },
    });
    roomId = room.id;

    const bed = await prisma.bed.create({
      data: {
        roomId,
        label: 'Bed A',
        status: BedStatus.AVAILABLE,
      },
    });
    singleBedId = bed.id;
  });

  after(async () => {
    // Cleanup users (cascades to properties, rooms, beds, admission codes, requests)
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, student1Id, student2Id] } },
    }).catch(() => {});
  });

  it('rejects invalid, revoked, and expired admission codes with clear messages', async () => {
    // 1. Non-existent code
    await assert.rejects(
      async () => {
        await studentService.submitAdmissionCode(student1Id, { code: 'ADM-DOES-NOT-EXIST' });
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.ok(err.message.includes('Invalid admission code'));
        return true;
      }
    );

    // 2. Revoked code
    const revokedCode = await prisma.admissionCode.create({
      data: {
        propertyId,
        code: `ADM-REV-${Date.now()}`,
        expiresOn: new Date(Date.now() + 86400000),
        status: AdmissionCodeStatus.REVOKED,
      },
    });

    await assert.rejects(
      async () => {
        await studentService.submitAdmissionCode(student1Id, { code: revokedCode.code });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('revoked'));
        return true;
      }
    );

    // 3. Expired code (expiry in the past)
    const expiredCode = await prisma.admissionCode.create({
      data: {
        propertyId,
        code: `ADM-EXP-${Date.now()}`,
        expiresOn: new Date(Date.now() - 86400000),
        status: AdmissionCodeStatus.ACTIVE,
      },
    });

    await assert.rejects(
      async () => {
        await studentService.submitAdmissionCode(student1Id, { code: expiredCode.code });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('expired'));
        return true;
      }
    );
  });

  it('submits valid request and prevents duplicate pending submissions', async () => {
    const validCode = await ownerService.generateAdmissionCode(ownerId, {
      propertyId,
      expiresInDays: 7,
    });

    const request = await studentService.submitAdmissionCode(student1Id, {
      code: validCode.code,
    });

    assert.ok(request.id);
    assert.equal(request.status, 'PENDING');
    assert.equal(request.propertyName, 'Raj Villa');

    // Duplicate submission for the same property by same student must be rejected with 409
    await assert.rejects(
      async () => {
        await studentService.submitAdmissionCode(student1Id, {
          code: validCode.code,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.ok(err.message.includes('already have a pending admission request'));
        return true;
      }
    );
  });

  it('anti-IDOR: student cannot see another student requests', async () => {
    // Student 1 has 1 pending request submitted in previous test
    const student1Requests = await studentService.getOwnAdmissionRequests(student1Id);
    assert.ok(student1Requests.length >= 1);
    assert.equal(student1Requests[0].propertyId, propertyId);

    // Student 2 has submitted NO requests yet
    const student2Requests = await studentService.getOwnAdmissionRequests(student2Id);
    assert.equal(student2Requests.length, 0, 'Student 2 must not see Student 1 requests');
  });

  it('CONCURRENCY TEST: Concurrent approval of two requests for the same bed - exactly ONE succeeds', async () => {
    // Setup:
    // Create Code 1 and Request 1 for Student 1
    const code1 = await ownerService.generateAdmissionCode(ownerId, {
      propertyId,
      roomPreference: roomId,
      expiresInDays: 7,
    });
    // Directly insert two pending requests competing for the exact same room/bed
    const req1 = await prisma.admissionRequest.create({
      data: {
        propertyId,
        code: code1.code,
        roomPreference: roomId,
        studentName: 'Charlie Student',
        studentEmail: (await prisma.user.findUnique({ where: { id: student1Id } }))!.email,
        studentMobile: '9876543222',
        status: AdmissionRequestStatus.PENDING,
      },
    });

    const code2 = await ownerService.generateAdmissionCode(ownerId, {
      propertyId,
      roomPreference: roomId,
      expiresInDays: 7,
    });
    const req2 = await prisma.admissionRequest.create({
      data: {
        propertyId,
        code: code2.code,
        roomPreference: roomId,
        studentName: 'Diana Student',
        studentEmail: (await prisma.user.findUnique({ where: { id: student2Id } }))!.email,
        studentMobile: '9876543333',
        status: AdmissionRequestStatus.PENDING,
      },
    });

    // Fire both approvals concurrently!
    const [result1, result2] = await Promise.allSettled([
      ownerService.decideAdmissionRequest(ownerId, req1.id, { decision: 'APPROVED' }),
      ownerService.decideAdmissionRequest(ownerId, req2.id, { decision: 'APPROVED' }),
    ]);

    const fulfilled = [result1, result2].filter((r) => r.status === 'fulfilled');
    const rejected = [result1, result2].filter((r) => r.status === 'rejected');

    // CRITICAL ACCEPTANCE CHECK: Exactly ONE succeeds, exactly ONE is rejected
    assert.equal(fulfilled.length, 1, 'Exactly one approval must succeed');
    assert.equal(rejected.length, 1, 'Exactly one approval must fail due to bed conflict');

    // Verify bed is now OCCUPIED in database
    const bedInDb = await prisma.bed.findUnique({ where: { id: singleBedId } });
    assert.equal(bedInDb?.status, BedStatus.OCCUPIED);

    // Verify the winning code is marked USED
    const winningCode = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    assert.ok(winningCode.id);

    // Verify student accommodation was allocated
    const accommodation1 = await studentService.getStudentAccommodation(student1Id);
    const accommodation2 = await studentService.getStudentAccommodation(student2Id);
    const allocatedCount = [accommodation1, accommodation2].filter((a) => a !== null).length;
    assert.equal(allocatedCount, 1, 'Exactly one student profile was allocated the room and bed');
  });

  it('rejects already-used code for new submissions', async () => {
    // Create code marked as USED
    const usedCode = await prisma.admissionCode.create({
      data: {
        propertyId,
        code: `ADM-USED-${Date.now()}`,
        expiresOn: new Date(Date.now() + 86400000),
        status: AdmissionCodeStatus.USED,
      },
    });

    await assert.rejects(
      async () => {
        await studentService.submitAdmissionCode(student1Id, { code: usedCode.code });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('already been used'));
        return true;
      }
    );
  });
});
