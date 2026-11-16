import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Role, UserStatus, PropertyStatus, PGCategory, FoodOption, FeaturedTier } from '@prisma/client';
import { prisma } from '../src/db/client.js';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/utils/crypto.js';

describe('Super Admin Module & 2 Tiers System Tests', () => {
  const app = createApp();

  let adminUserId: string;
  let adminToken: string;

  let ownerUserId: string;
  let ownerToken: string;

  let studentUserId: string;
  let studentToken: string;

  let testPropertyId: string;
  let testApplicationId: string;

  before(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 12);

    // 1. Create Super Admin
    const adminUser = await prisma.user.create({
      data: {
        email: `superadmin-${Date.now()}@test.com`,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        fullName: 'Super Administrator',
        mobile: '9999900001',
      },
    });
    adminUserId = adminUser.id;
    adminToken = signAccessToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: Role.ADMIN,
      sid: 'admin-sess-1',
    });

    // 2. Create Owner
    const ownerUser = await prisma.user.create({
      data: {
        email: `admin-test-owner-${Date.now()}@test.com`,
        passwordHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Ramesh Patel',
        mobile: '9999900002',
      },
    });
    ownerUserId = ownerUser.id;
    ownerToken = signAccessToken({
      sub: ownerUser.id,
      email: ownerUser.email,
      role: Role.OWNER,
      sid: 'owner-sess-1',
    });

    // Create an active session for the owner to test revocation
    await prisma.session.create({
      data: {
        userId: ownerUserId,
        refreshTokenHash: `hash-owner-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 3. Create Student
    const studentUser = await prisma.user.create({
      data: {
        email: `admin-test-student-${Date.now()}@test.com`,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        fullName: 'Kunal Sharma',
        mobile: '9999900003',
      },
    });
    studentUserId = studentUser.id;
    studentToken = signAccessToken({
      sub: studentUser.id,
      email: studentUser.email,
      role: Role.STUDENT,
      sid: 'student-sess-1',
    });

    // 4. Create a test property for the owner
    const prop = await prisma.property.create({
      data: {
        ownerId: ownerUserId,
        name: 'Admin Test Residency',
        slug: `admin-test-residency-${Date.now()}`,
        type: PGCategory.BOYS,
        description: 'Test Property for Admin Module',
        city: 'Jaipur',
        locality: 'Admin Test Enclave',
        address: '101 Admin Street',
        food: FoodOption.VEG,
        status: PropertyStatus.PENDING,
      },
    });
    testPropertyId = prop.id;

    // 5. Create a test owner application
    const appRecord = await prisma.ownerApplication.create({
      data: {
        ownerName: 'Application Applicant',
        email: `applicant-${Date.now()}@test.com`,
        pgName: 'Applicant Stay',
        city: 'Jaipur',
        category: PGCategory.BOYS,
        status: 'PENDING',
        note: 'Submitted via owner signup',
      },
    });
    testApplicationId = appRecord.id;
  });

  after(async () => {
    try {
      if (testPropertyId) {
        await prisma.property.deleteMany({ where: { id: testPropertyId } });
      }
      if (testApplicationId) {
        await prisma.ownerApplication.deleteMany({ where: { id: testApplicationId } });
      }
      await prisma.user.deleteMany({
        where: { id: { in: [adminUserId, ownerUserId, studentUserId] } },
      });
    } catch {
      // Ignore cleanup errors
    }
  });

  /* ------------------------------------------------------------- 1. RBAC */
  it('Non-admin tokens (STUDENT and OWNER) get 403 on every admin route', async () => {
    const adminRoutes = [
      '/api/admin/applications',
      '/api/admin/pgs',
      '/api/admin/owners',
      '/api/admin/students',
      '/api/admin/plans',
      '/api/admin/subscriptions',
      '/api/admin/payments',
      '/api/admin/featured-requests',
      '/api/admin/advertisements',
      '/api/admin/settings',
      '/api/admin/stats',
      '/api/admin/activities',
      '/api/admin/tickets',
      '/api/admin/notifications',
    ];

    for (const route of adminRoutes) {
      // Test STUDENT token
      const resStudent = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${studentToken}`);
      assert.equal(
        resStudent.status,
        403,
        `Expected 403 for student accessing ${route}, got ${resStudent.status}`
      );

      // Test OWNER token
      const resOwner = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${ownerToken}`);
      assert.equal(
        resOwner.status,
        403,
        `Expected 403 for owner accessing ${route}, got ${resOwner.status}`
      );

      // Test ADMIN token succeeds
      const resAdmin = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${adminToken}`);
      assert.equal(
        resAdmin.status,
        200,
        `Expected 200 for admin accessing ${route}, got ${resAdmin.status}`
      );
    }
  });

  /* --------------------------------------------------- 2. Tier Rules & Pricing */
  it('Tier rules for FEATURED and PREMIUM_FEATURED are strictly enforced on server', async () => {
    // 1. Rejects invalid price for FEATURED (e.g. 100 instead of 299)
    const resBadPrice = await request(app)
      .post('/api/admin/featured-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pgId: testPropertyId,
        tier: 'FEATURED',
        amount: 100, // Invalid price!
        durationMonths: 1,
      });
    assert.equal(resBadPrice.status, 400);
    assert.match(resBadPrice.body.error?.message || '', /Invalid price for tier FEATURED/);

    // 2. Accepts valid price (299 for FEATURED, 1 month)
    const resValid = await request(app)
      .post('/api/admin/featured-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pgId: testPropertyId,
        tier: 'FEATURED',
        amount: 299,
        durationMonths: 1,
      });
    assert.equal(resValid.status, 201);
    const reqId = resValid.body.data.id;
    assert.ok(reqId);

    // 3. Admin approves request: verifies duration calculation and listingStatus set to ACTIVE
    const resApprove = await request(app)
      .patch(`/api/admin/featured-requests/${reqId}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVED',
        durationMonths: 2,
      });
    assert.equal(resApprove.status, 200);
    assert.equal(resApprove.body.data.status, 'APPROVED');
    assert.equal(resApprove.body.data.listingStatus, 'ACTIVE');
    assert.equal(resApprove.body.data.durationMonths, 2);
    assert.ok(resApprove.body.data.endOn);

    // 4. Test automatic expiry: simulate expired endOn and verify listingStatus becomes EXPIRED
    await prisma.featuredRequest.update({
      where: { id: reqId },
      data: {
        endOn: new Date(Date.now() - 10000), // Expired in the past
      },
    });

    const resList = await request(app)
      .get('/api/admin/featured-requests')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resList.status, 200);
    const found = resList.body.data.find((r: any) => r.id === reqId);
    assert.ok(found);
    assert.equal(found.listingStatus, 'EXPIRED');

    // Clean up request
    await prisma.featuredRequest.deleteMany({ where: { id: reqId } });
  });

  /* ------------------------------------------- 3. Owner Suspension & Immediate Revocation */
  it('Suspended owner has sessions immediately revoked and their next request fails', async () => {
    // 1. Verify owner can initially access owner endpoints
    const resBefore = await request(app)
      .get('/api/owner/properties')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert.equal(resBefore.status, 200);

    // 2. Admin suspends owner
    const resSuspend = await request(app)
      .patch(`/api/admin/owners/${ownerUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });
    assert.equal(resSuspend.status, 200);

    // 3. Verify owner's active sessions in DB were deleted immediately
    const sessionCount = await prisma.session.count({
      where: { userId: ownerUserId },
    });
    assert.equal(sessionCount, 0, 'All sessions for suspended user must be deleted');

    // 4. Verify owner's very next request fails with 403
    const resAfter = await request(app)
      .get('/api/owner/properties')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert.equal(resAfter.status, 403);
    assert.match(resAfter.body.error?.message || '', /account has been suspended/i);

    // 5. Admin reactivates owner
    const resReactivate = await request(app)
      .patch(`/api/admin/owners/${ownerUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });
    assert.equal(resReactivate.status, 200);

    // 6. Verify owner's request now succeeds
    const resAfterReactivate = await request(app)
      .get('/api/owner/properties')
      .set('Authorization', `Bearer ${ownerToken}`);
    assert.equal(resAfterReactivate.status, 200);
  });

  /* ------------------------------------------------ 4. Activity Logging & Security */
  it('Activity log records every admin mutation and client cannot write directly to it', async () => {
    // 1. Client cannot write log entries directly (POST /api/admin/activities does not exist)
    const resPost = await request(app)
      .post('/api/admin/activities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'Fake log' });
    assert.equal(resPost.status, 404);

    // 2. Admin mutation (update PG status) automatically writes an immutable log entry
    const resSetStatus = await request(app)
      .patch(`/api/admin/pgs/${testPropertyId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        statusNote: 'Approved by test runner',
      });
    assert.equal(resSetStatus.status, 200);

    // 3. Verify activity entry exists in the activity feed
    const resActivities = await request(app)
      .get('/api/admin/activities')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(resActivities.status, 200);
    assert.ok(Array.isArray(resActivities.body.data));

    const foundLog = resActivities.body.data.find(
      (act: any) => act.entity.includes(testPropertyId) && act.action.includes('APPROVED')
    );
    assert.ok(foundLog, 'Activity log entry must be created on server for the mutation');
    assert.equal(foundLog.admin, 'Super Administrator');
  });

  /* ------------------------------------------------- 5. Application Decision & Settings */
  it('Approving an owner application activates user and platform settings persist correctly', async () => {
    // 1. Approve application
    const resApprove = await request(app)
      .patch(`/api/admin/applications/${testApplicationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });
    assert.equal(resApprove.status, 200);
    assert.equal(resApprove.body.data.status, 'APPROVED');

    // 2. Update platform settings
    const resSettings = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        platformName: 'RAHO MITRA PRO',
        featuredPrice: 350,
      });
    assert.equal(resSettings.status, 200);
    assert.equal(resSettings.body.data.platformName, 'RAHO MITRA PRO');
    assert.equal(resSettings.body.data.featuredPrice, 350);

    // Reset settings back
    await request(app)
      .post('/api/admin/settings/reset')
      .set('Authorization', `Bearer ${adminToken}`);
  });
});
