import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/db/client.js';
import { ownerService } from '../src/modules/owner/owner.service.js';
import { Role, UserStatus, PGCategory, FoodOption, RoomType, BedStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Owner Module & Multi-Tenant IDOR Security Tests', () => {
  let ownerAId: string;
  let ownerBId: string;
  let propertyAId: string;
  let roomAId: string;
  let bedAId: string;
  let staffAId: string;
  let codeAId: string;

  before(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 12);

    // Create Owner A
    const ownerA = await prisma.user.create({
      data: {
        email: `owner-a-${Date.now()}@test.com`,
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Owner Alice',
        mobile: '9876543201',
      },
    });
    ownerAId = ownerA.id;

    // Create Owner B
    const ownerB = await prisma.user.create({
      data: {
        email: `owner-b-${Date.now()}@test.com`,
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Owner Bob',
        mobile: '9876543202',
      },
    });
    ownerBId = ownerB.id;
  });

  after(async () => {
    // Cleanup created test users (cascades to their properties, rooms, beds)
    if (ownerAId) {
      await prisma.user.delete({ where: { id: ownerAId } }).catch(() => {});
    }
    if (ownerBId) {
      await prisma.user.delete({ where: { id: ownerBId } }).catch(() => {});
    }
  });

  it('End-to-End: Create Property -> Room -> Bed -> Change Bed status & verify occupancy', async () => {
    // 1. Create property - starts as PENDING until admin approves
    const property = await ownerService.createProperty(ownerAId, {
      name: 'Alice Residency',
      type: PGCategory.GIRLS,
      description: 'Test residency for Alice',
      city: 'Jaipur',
      address: '123 Test Street',
      locality: 'Malviya Nagar',
      contactPhone: '9876543201',
      contactEmail: 'alice@test.com',
      securityDeposit: 5000,
      facilities: ['ac', 'wifi'],
      food: FoodOption.INCLUDED,
      rules: ['No loud noise'],
      coverImage: 'https://example.com/cover.jpg',
      gallery: [],
    });

    assert.ok(property.id);
    assert.equal(property.status, 'PENDING', 'New property must start with status PENDING');
    propertyAId = property.id;

    // 2. Create room with capacity 1
    const room = await ownerService.createRoom(ownerAId, {
      propertyId: propertyAId,
      number: '101',
      floor: 1,
      type: RoomType.SINGLE,
      rent: 8000,
      capacity: 1,
    });

    assert.ok(room.id);
    assert.equal(room.beds.length, 1);
    roomAId = room.id;
    bedAId = room.beds[0].id;
    assert.equal(room.beds[0].status, 'AVAILABLE');

    // 3. Add second bed to room
    const bed2 = await ownerService.addBed(ownerAId, roomAId);
    assert.ok(bed2.id);
    assert.equal(bed2.label, 'B');
    assert.equal(bed2.status, 'AVAILABLE');

    // 4. Change Bed 2 status to OCCUPIED
    const updatedBed2 = await ownerService.setBedStatus(ownerAId, bed2.id, BedStatus.OCCUPIED);
    assert.equal(updatedBed2.status, 'OCCUPIED');

    // 5. Verify occupancy counts in database
    const rooms = await ownerService.getRooms(ownerAId, propertyAId);
    assert.equal(rooms.length, 1);
    const roomBeds = rooms[0].beds;
    assert.equal(roomBeds.length, 2);
    const occupied = roomBeds.filter((b) => b.status === 'OCCUPIED').length;
    const available = roomBeds.filter((b) => b.status === 'AVAILABLE').length;

    assert.equal(occupied, 1, 'Occupied beds must match database');
    assert.equal(available, 1, 'Available beds must match database');
  });

  it('Anti-IDOR: Owner B cannot modify or read Owner A properties or rooms', async () => {
    // Owner B cannot update Owner A's property
    await assert.rejects(
      async () => {
        await ownerService.updateProperty(ownerBId, propertyAId, {
          name: 'Hacked by Bob',
        });
      },
      (err: any) => err.statusCode === 403
    );

    // Owner B cannot change status of Owner A's property
    await assert.rejects(
      async () => {
        await ownerService.setPropertyStatus(ownerBId, propertyAId, 'ACTIVE' as any);
      },
      (err: any) => err.statusCode === 403
    );

    // Owner B cannot create a room in Owner A's property
    await assert.rejects(
      async () => {
        await ownerService.createRoom(ownerBId, {
          propertyId: propertyAId,
          number: '999',
          floor: 9,
          type: RoomType.SINGLE,
          rent: 9999,
        });
      },
      (err: any) => err.statusCode === 403
    );

    // Owner B cannot update Owner A's room
    await assert.rejects(
      async () => {
        await ownerService.updateRoom(ownerBId, roomAId, {
          number: '666',
          floor: 6,
          type: RoomType.DOUBLE,
          rent: 5000,
        });
      },
      (err: any) => err.statusCode === 403
    );

    // Owner B cannot delete Owner A's room
    await assert.rejects(
      async () => {
        await ownerService.deleteRoom(ownerBId, roomAId);
      },
      (err: any) => err.statusCode === 403
    );

    // Owner B cannot add bed to Owner A's room
    await assert.rejects(
      async () => {
        await ownerService.addBed(ownerBId, roomAId);
      },
      (err: any) => err.statusCode === 403
    );

    // Owner B cannot change status of Owner A's bed
    await assert.rejects(
      async () => {
        await ownerService.setBedStatus(ownerBId, bedAId, BedStatus.MAINTENANCE);
      },
      (err: any) => err.statusCode === 403
    );
  });

  it('Anti-IDOR: Staff & Admission Code security checks', async () => {
    // Owner A adds staff
    const staff = await ownerService.addStaff(ownerAId, {
      propertyId: propertyAId,
      name: 'Ramesh Cook',
      email: 'ramesh.cook@test.com',
      mobile: '9876543299',
      role: 'Head Chef',
    });
    staffAId = staff.id;

    // Owner B cannot update or remove Owner A's staff
    await assert.rejects(
      async () => {
        await ownerService.updateStaff(ownerBId, staffAId, {
          propertyId: propertyAId,
          name: 'Hacked Staff',
          email: 'hacked@test.com',
          mobile: '9876543299',
          role: 'Manager',
        });
      },
      (err: any) => err.statusCode === 403
    );

    await assert.rejects(
      async () => {
        await ownerService.removeStaff(ownerBId, staffAId);
      },
      (err: any) => err.statusCode === 403
    );

    // Owner A generates admission code
    const code = await ownerService.generateAdmissionCode(ownerAId, {
      propertyId: propertyAId,
      expiresInDays: 5,
    });
    codeAId = code.id;

    // Owner B cannot revoke Owner A's code
    await assert.rejects(
      async () => {
        await ownerService.revokeAdmissionCode(ownerBId, codeAId);
      },
      (err: any) => err.statusCode === 403
    );
  });

  it('Subscription Limit Enforcement: rejects creating properties beyond plan allowance', async () => {
    // Owner B starts with 0 properties. Default starter limit is 1.
    const prop1 = await ownerService.createProperty(ownerBId, {
      name: 'Bob Residency 1',
      type: PGCategory.BOYS,
      description: 'First property of Bob',
      city: 'Jaipur',
      address: 'Plot 10',
      locality: 'Mansarovar',
      contactPhone: '9876543202',
      contactEmail: 'bob@test.com',
      securityDeposit: 4000,
      facilities: [],
      food: FoodOption.NOT_AVAILABLE,
      rules: [],
      coverImage: '',
      gallery: [],
    });

    assert.ok(prop1.id);

    // Attempting to create a second property on Starter plan (limit 1) must be rejected
    await assert.rejects(
      async () => {
        await ownerService.createProperty(ownerBId, {
          name: 'Bob Residency 2 (Excess)',
          type: PGCategory.BOYS,
          description: 'Second property should fail',
          city: 'Jaipur',
          address: 'Plot 11',
          locality: 'Mansarovar',
          contactPhone: '9876543202',
          contactEmail: 'bob@test.com',
          securityDeposit: 4000,
          facilities: [],
          food: FoodOption.NOT_AVAILABLE,
          rules: [],
          coverImage: '',
          gallery: [],
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('Property limit reached'));
        return true;
      }
    );
  });
});
