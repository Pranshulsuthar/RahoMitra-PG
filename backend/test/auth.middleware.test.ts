import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import { Role, UserStatus } from '@prisma/client';
import {
  requireAuth,
  requireRole,
  requireActiveAccount,
  csrfProtection,
} from '../src/modules/auth/auth.middleware.js';
import { signAccessToken } from '../src/utils/crypto.js';
import { prisma } from '../src/db/client.js';
import { env } from '../src/config/env.js';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  status(code: number): MockResponse;
  json(data: unknown): MockResponse;
}

function createMockResponse(): MockResponse & Response {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as unknown as MockResponse & Response;
}

describe('Auth Middleware Security Tests', () => {
  it('requireAuth rejects missing and malformed authorization headers', () => {
    const req1 = { headers: {} } as Request;
    const res = createMockResponse();

    assert.throws(
      () => requireAuth(req1, res, () => {}),
      (err: any) => err.statusCode === 401 && err.code === 'TOKEN_MISSING'
    );

    const req2 = { headers: { authorization: 'Basic 12345' } } as Request;
    assert.throws(
      () => requireAuth(req2, res, () => {}),
      (err: any) => err.statusCode === 401 && err.code === 'TOKEN_MISSING'
    );
  });

  it('requireAuth accepts valid Bearer access token and attaches req.user', () => {
    const token = signAccessToken({ sub: 'user_123', role: Role.STUDENT, sid: 'sess_123' });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled);
    assert.equal(req.user?.sub, 'user_123');
    assert.equal(req.user?.role, Role.STUDENT);
    assert.equal(req.user?.sid, 'sess_123');
  });

  it('requireRole grants access to matching roles and blocks wrong roles with 403', () => {
    const studentReq = { user: { sub: 'u1', role: Role.STUDENT, sid: 's1' } } as Request;
    const res = createMockResponse();

    let studentPassed = false;
    requireRole(Role.STUDENT, Role.ADMIN)(studentReq, res, () => {
      studentPassed = true;
    });
    assert.ok(studentPassed);

    // Student attempting OWNER-only route
    assert.throws(
      () => requireRole(Role.OWNER)(studentReq, res, () => {}),
      (err: any) => err.statusCode === 403 && err.code === 'FORBIDDEN'
    );
  });

  it('requireActiveAccount cuts off suspended users immediately from the database', async () => {
    prisma.user.findUnique = (async () => ({
      id: 'u-suspended',
      email: 'bad@example.com',
      status: UserStatus.SUSPENDED,
      emailVerifiedAt: new Date(),
    })) as any;

    const req = { user: { sub: 'u-suspended', role: Role.STUDENT, sid: 's1' } } as Request;
    const res = createMockResponse();

    await assert.rejects(
      async () => {
        await requireActiveAccount(req, res, () => {});
      },
      (err: any) => err.statusCode === 403 && err.code === 'ACCOUNT_SUSPENDED'
    );
  });

  it('csrfProtection blocks cross-site requests with invalid origin header', () => {
    const maliciousReq = {
      headers: {
        origin: 'https://evil-hacker-site.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      method: 'POST',
    } as Request;
    const res = createMockResponse();

    assert.throws(
      () => csrfProtection(maliciousReq, res, () => {}),
      (err: any) => err.statusCode === 403 && err.code === 'CSRF_INVALID_ORIGIN'
    );

    const validReq = {
      headers: {
        origin: env.CORS_ORIGIN[0],
        'x-requested-with': 'XMLHttpRequest',
      },
      method: 'POST',
    } as Request;

    let validPassed = false;
    csrfProtection(validReq, res, () => {
      validPassed = true;
    });
    assert.ok(validPassed);
  });
});
