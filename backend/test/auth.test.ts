import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { Role, UserStatus, ApplicationStatus } from '@prisma/client';
import { authService } from '../src/modules/auth/auth.service.js';
import { prisma } from '../src/db/client.js';
import {
  hashPassword,
  verifyAccessToken,
  hashSha256,
  generateRandomToken,
} from '../src/utils/crypto.js';
import { getMailer, ConsoleMailerProvider } from '../src/utils/mailer.js';
import { AppError } from '../src/utils/errors.js';
import { env } from '../src/config/env.js';

describe('Authentication Core System Tests', () => {
  // In-memory data structures
  let users: any[] = [];
  let emailOtps: any[] = [];
  let sessions: any[] = [];
  let ownerApplications: any[] = [];
  let passwordResetTokens: any[] = [];
  let students: any[] = [];

  beforeEach(() => {
    users = [];
    emailOtps = [];
    sessions = [];
    ownerApplications = [];
    passwordResetTokens = [];
    students = [];

    // Mock prisma.$transaction
    prisma.$transaction = async (cb: any) => cb(prisma);

    // Mock prisma.user
    prisma.user.findUnique = (async ({ where }: any) => {
      if (where.email) return users.find((u) => u.email === where.email) ?? null;
      if (where.id) return users.find((u) => u.id === where.id) ?? null;
      return null;
    }) as any;

    prisma.user.create = (async ({ data }: any) => {
      const user = { id: `user_${Date.now()}_${Math.random()}`, ...data };
      users.push(user);
      return user;
    }) as any;

    prisma.user.update = (async ({ where, data }: any) => {
      const user = users.find((u) => u.id === where.id);
      if (user) Object.assign(user, data);
      return user;
    }) as any;

    // Mock prisma.emailOtp
    prisma.emailOtp.findFirst = (async ({ where, orderBy }: any) => {
      let filtered = emailOtps.filter((o) => {
        if (where.email && o.email !== where.email) return false;
        if (where.usedAt === null && o.usedAt !== null) return false;
        return true;
      });
      if (orderBy?.createdAt === 'desc') {
        filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return filtered[0] ?? null;
    }) as any;

    prisma.emailOtp.create = (async ({ data }: any) => {
      const record = { id: `otp_${Date.now()}_${Math.random()}`, createdAt: new Date(), failedAttempts: 0, usedAt: null, ...data };
      emailOtps.push(record);
      return record;
    }) as any;

    prisma.emailOtp.update = (async ({ where, data }: any) => {
      const record = emailOtps.find((o) => o.id === where.id);
      if (record) Object.assign(record, data);
      return record;
    }) as any;

    prisma.emailOtp.count = (async ({ where }: any) => {
      return emailOtps.filter((o) => {
        if (where.email && o.email !== where.email) return false;
        if (where.createdAt?.gte && o.createdAt < where.createdAt.gte) return false;
        return true;
      }).length;
    }) as any;

    // Mock prisma.student
    prisma.student.create = (async ({ data }: any) => {
      const record = { id: `std_${Date.now()}`, ...data };
      students.push(record);
      return record;
    }) as any;

    // Mock prisma.ownerApplication
    prisma.ownerApplication.create = (async ({ data }: any) => {
      const app = { id: `app_${Date.now()}`, submittedOn: new Date(), ...data };
      ownerApplications.push(app);
      return app;
    }) as any;

    prisma.ownerApplication.findFirst = (async ({ where, orderBy }: any) => {
      let filtered = ownerApplications.filter((a) => {
        if (where.email && a.email !== where.email) return false;
        return true;
      });
      if (orderBy?.submittedOn === 'desc') {
        filtered = filtered.sort((a, b) => b.submittedOn.getTime() - a.submittedOn.getTime());
      }
      return filtered[0] ?? null;
    }) as any;

    // Mock prisma.session
    prisma.session.create = (async ({ data }: any) => {
      const session = {
        id: `sess_${Date.now()}_${Math.random()}`,
        familyId: `fam_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      sessions.push(session);
      return session;
    }) as any;

    prisma.session.findUnique = (async ({ where }: any) => {
      const session = sessions.find((s) => s.refreshTokenHash === where.refreshTokenHash);
      if (!session) return null;
      const user = users.find((u) => u.id === session.userId);
      return { ...session, user };
    }) as any;

    prisma.session.findFirst = (async ({ where }: any) => {
      const session = sessions.find((s) => s.previousTokenHash === where.previousTokenHash);
      if (!session) return null;
      const user = users.find((u) => u.id === session.userId);
      return { ...session, user };
    }) as any;

    prisma.session.update = (async ({ where, data }: any) => {
      const session = sessions.find((s) => s.id === where.id);
      if (session) Object.assign(session, data);
      return session;
    }) as any;

    prisma.session.delete = (async ({ where }: any) => {
      sessions = sessions.filter((s) => s.id !== where.id);
      return {};
    }) as any;

    prisma.session.deleteMany = (async ({ where }: any) => {
      if (where.familyId) sessions = sessions.filter((s) => s.familyId !== where.familyId);
      if (where.userId) sessions = sessions.filter((s) => s.userId !== where.userId);
      if (where.OR) {
        sessions = sessions.filter((s) => {
          const match = where.OR.some((cond: any) => {
            if (cond.refreshTokenHash && s.refreshTokenHash === cond.refreshTokenHash) return true;
            if (cond.id && s.id === cond.id) return true;
            return false;
          });
          return !match;
        });
      }
      return {};
    }) as any;

    prisma.session.findMany = (async ({ where }: any) => {
      return sessions.filter((s) => s.userId === where.userId);
    }) as any;

    // Mock prisma.passwordResetToken
    prisma.passwordResetToken.create = (async ({ data }: any) => {
      const record = { id: `rst_${Date.now()}`, createdAt: new Date(), usedAt: null, ...data };
      passwordResetTokens.push(record);
      return record;
    }) as any;

    prisma.passwordResetToken.findUnique = (async ({ where }: any) => {
      const token = passwordResetTokens.find((t) => t.tokenHash === where.tokenHash);
      if (!token) return null;
      const user = users.find((u) => u.id === token.userId);
      return { ...token, user };
    }) as any;

    prisma.passwordResetToken.update = (async ({ where, data }: any) => {
      const token = passwordResetTokens.find((t) => t.id === where.id);
      if (token) Object.assign(token, data);
      return token;
    }) as any;

    prisma.passwordResetToken.deleteMany = (async ({ where }: any) => {
      passwordResetTokens = passwordResetTokens.filter((t) => t.userId !== where.userId);
      return {};
    }) as any;
  });

  // 1. Full Signup & Verify & Login Flow
  it('handles valid signup, OTP verification, student signup and login', async () => {
    const testEmail = 'student1@example.com';
    const mailer = getMailer() as ConsoleMailerProvider;

    // Step 1: Request OTP
    const reqResult = await authService.requestSignupOtp(testEmail, Role.STUDENT);
    assert.ok(reqResult.message);
    assert.equal(emailOtps.length, 1);

    // Extract OTP sent to mailer
    const lastMail = mailer.lastSentEmail;
    assert.ok(lastMail);
    const otpMatch = lastMail.text.match(/\d{6}/);
    assert.ok(otpMatch);
    const sentOtp = otpMatch[0];

    // Step 2: Verify OTP
    const verifyResult = await authService.verifySignupOtp(testEmail, sentOtp);
    assert.ok(verifyResult.signupToken);

    // Step 3: Complete Student Details
    const signupResult = await authService.signupStudent({
      signupToken: verifyResult.signupToken,
      fullName: 'Rahul Sharma',
      mobile: '9876543210',
      college: 'Delhi University',
      city: 'Delhi',
      password: 'StrongPassword123!',
    });
    assert.equal(signupResult.user.email, testEmail);
    assert.equal(signupResult.user.role, Role.STUDENT);

    // Step 4: Login with valid credentials
    const loginResult = await authService.login({
      email: testEmail,
      password: 'StrongPassword123!',
      role: Role.STUDENT,
      rememberMe: true,
    });
    assert.ok(loginResult.accessToken);
    assert.ok(loginResult.rawRefreshToken);
    assert.equal(loginResult.user.email, testEmail);

    // Verify token claims
    const claims = verifyAccessToken(loginResult.accessToken);
    assert.equal(claims.sub, loginResult.user.id);
    assert.equal(claims.role, Role.STUDENT);
  });

  // 2. Owner Signup and Pending Approval Lock
  it('blocks pending owner from logging in until approved by admin', async () => {
    const ownerEmail = 'owner1@example.com';
    const mailer = getMailer() as ConsoleMailerProvider;

    await authService.requestSignupOtp(ownerEmail, Role.OWNER);
    const sentOtp = mailer.lastSentEmail!.text.match(/\d{6}/)![0];
    const { signupToken } = await authService.verifySignupOtp(ownerEmail, sentOtp);

    // Owner signup creates User + OwnerApplication (PENDING)
    await authService.signupOwner({
      signupToken,
      fullName: 'Rajesh Kumar',
      mobile: '9812345678',
      pg: {
        name: 'Comfort PG',
        type: 'BOYS',
        city: 'Jaipur',
        address: '123 Main Street, Sector 5',
        count: 2,
      },
      password: 'StrongOwnerPass123!',
    });

    // Attempting login with correct password while PENDING must fail with 403 OWNER_PENDING_APPROVAL
    await assert.rejects(
      async () => {
        await authService.login({
          email: ownerEmail,
          password: 'StrongOwnerPass123!',
          role: Role.OWNER,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'OWNER_PENDING_APPROVAL');
        return true;
      }
    );
  });

  // 3. Unknown email timing & generic response (No user enumeration)
  it('returns identical 401 error shape for wrong password and unknown email', async () => {
    // Register a user
    const existingEmail = 'user@example.com';
    const password = 'RealPassword123!';
    const passwordHash = await hashPassword(password);
    users.push({
      id: 'u1',
      email: existingEmail,
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    });

    // 1. Wrong password on existing user
    await assert.rejects(
      async () => {
        await authService.login({
          email: existingEmail,
          password: 'WrongPassword!',
          role: Role.STUDENT,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        assert.equal(err.message, 'Invalid email or password');
        return true;
      }
    );

    // 2. Unknown email (must execute dummy bcrypt and return identical error)
    await assert.rejects(
      async () => {
        await authService.login({
          email: 'unknown-user-does-not-exist@example.com',
          password: 'SomeRandomPassword!',
          role: Role.STUDENT,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        assert.equal(err.message, 'Invalid email or password');
        return true;
      }
    );
  });

  // 4. Role mismatch rejects login
  it('rejects login when requested role does not match user role', async () => {
    const studentEmail = 'student-role-test@example.com';
    const passwordHash = await hashPassword('Secret12345!');
    users.push({
      id: 'u-role',
      email: studentEmail,
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      failedLoginCount: 0,
    });

    // Student trying to login as ADMIN
    await assert.rejects(
      async () => {
        await authService.login({
          email: studentEmail,
          password: 'Secret12345!',
          role: Role.ADMIN,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );
  });

  // 5. Account lockout after 5 failed attempts
  it('locks account for 15 minutes after 5 consecutive failed login attempts', async () => {
    const email = 'lockout-test@example.com';
    const passwordHash = await hashPassword('CorrectPassword123!');
    users.push({
      id: 'u-lock',
      email,
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    });

    // 4 wrong attempts
    for (let i = 0; i < 4; i++) {
      await assert.rejects(async () => {
        await authService.login({ email, password: 'WrongPassword!', role: Role.STUDENT });
      });
    }

    // 5th wrong attempt triggers lockout
    await assert.rejects(
      async () => {
        await authService.login({ email, password: 'WrongPassword!', role: Role.STUDENT });
      },
      (err: any) => {
        assert.equal(err.statusCode, 423);
        assert.equal(err.code, 'ACCOUNT_LOCKED');
        return true;
      }
    );

    // Subsequent attempt even with CORRECT password is still locked
    await assert.rejects(
      async () => {
        await authService.login({ email, password: 'CorrectPassword123!', role: Role.STUDENT });
      },
      (err: any) => {
        assert.equal(err.statusCode, 423);
        assert.equal(err.code, 'ACCOUNT_LOCKED');
        return true;
      }
    );
  });

  // 6. Suspended user blocked
  it('blocks suspended user from logging in', async () => {
    const email = 'suspended@example.com';
    const passwordHash = await hashPassword('ValidPass123!');
    users.push({
      id: 'u-susp',
      email,
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.SUSPENDED,
      emailVerifiedAt: new Date(),
      failedLoginCount: 0,
    });

    await assert.rejects(
      async () => {
        await authService.login({ email, password: 'ValidPass123!', role: Role.STUDENT });
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'ACCOUNT_SUSPENDED');
        return true;
      }
    );
  });

  // 7. OTP Expiry and Reuse
  it('rejects expired and reused OTP codes', async () => {
    const email = 'otp-expiry@example.com';
    const otp = '654321';
    const otpHash = hashSha256(otp);

    // 1. Expired OTP
    emailOtps.push({
      id: 'otp-exp',
      email,
      otpHash,
      purpose: 'SIGNUP_STUDENT',
      expiresAt: new Date(Date.now() - 60000), // Expired 1 min ago
      usedAt: null,
      failedAttempts: 0,
      createdAt: new Date(Date.now() - 120000),
    });

    await assert.rejects(
      async () => {
        await authService.verifySignupOtp(email, otp);
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('expired'));
        return true;
      }
    );

    // 2. Reused OTP
    emailOtps[0].expiresAt = new Date(Date.now() + 60000);
    emailOtps[0].usedAt = new Date(); // Already used

    await assert.rejects(
      async () => {
        await authService.verifySignupOtp(email, otp);
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  // 8. OTP Attempt Limit (5 wrong attempts -> invalidates)
  it('invalidates OTP after 5 incorrect attempts', async () => {
    const email = 'otp-attempt-limit@example.com';
    const correctOtp = '112233';
    emailOtps.push({
      id: 'otp-lim',
      email,
      otpHash: hashSha256(correctOtp),
      purpose: 'SIGNUP_STUDENT',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      usedAt: null,
      failedAttempts: 0,
      createdAt: new Date(),
    });

    // 4 wrong attempts
    for (let i = 0; i < 4; i++) {
      await assert.rejects(async () => {
        await authService.verifySignupOtp(email, '000000');
      });
    }

    // 5th wrong attempt invalidates the code
    await assert.rejects(
      async () => {
        await authService.verifySignupOtp(email, '000000');
      },
      (err: any) => {
        assert.ok(err.message.includes('invalidated'));
        return true;
      }
    );

    // Even with the CORRECT OTP, it is now rejected because it was invalidated
    await assert.rejects(
      async () => {
        await authService.verifySignupOtp(email, correctOtp);
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  // 9. Refresh token rotation & session family
  it('rotates refresh token on every refresh and returns new tokens', async () => {
    const user = { id: 'u-ref', email: 'refresh@example.com', role: Role.STUDENT, status: UserStatus.ACTIVE };
    users.push(user);

    const initialToken = generateRandomToken(32);
    const initialHash = hashSha256(initialToken);
    sessions.push({
      id: 'sess-1',
      userId: user.id,
      familyId: 'fam-1',
      refreshTokenHash: initialHash,
      previousTokenHash: null,
      rotatedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    // First refresh: rotates token
    const refresh1 = await authService.refreshSession(initialToken);
    assert.ok(refresh1.accessToken);
    assert.ok(refresh1.rawRefreshToken);
    assert.notEqual(refresh1.rawRefreshToken, initialToken);

    // Verify session updated with new hash and previous hash
    const sessionInDb = sessions.find((s) => s.id === 'sess-1');
    assert.equal(sessionInDb.previousTokenHash, initialHash);
    assert.equal(sessionInDb.refreshTokenHash, hashSha256(refresh1.rawRefreshToken));
  });

  // 10. Concurrent refresh within grace window (15s)
  it('permits concurrent refresh using just-rotated token within 15-second grace window', async () => {
    const user = { id: 'u-conc', email: 'concurrent@example.com', role: Role.STUDENT, status: UserStatus.ACTIVE };
    users.push(user);

    const initialToken = generateRandomToken(32);
    sessions.push({
      id: 'sess-conc',
      userId: user.id,
      familyId: 'fam-conc',
      refreshTokenHash: hashSha256(initialToken),
      previousTokenHash: null,
      rotatedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    // 1st request rotates the token
    const refresh1 = await authService.refreshSession(initialToken);
    assert.ok(refresh1.accessToken);

    // 2nd concurrent in-flight request arrives with the initialToken within 15 seconds
    const refresh2 = await authService.refreshSession(initialToken);
    assert.ok(refresh2.accessToken);
    // Session is NOT revoked!
    assert.equal(sessions.length, 1);
  });

  // 11. Refresh reuse detection revokes entire session family
  it('detects refresh token reuse after grace window and revokes whole session family', async () => {
    const user = { id: 'u-reuse', email: 'reuse@example.com', role: Role.STUDENT, status: UserStatus.ACTIVE };
    users.push(user);

    const stolenToken = generateRandomToken(32);
    const stolenHash = hashSha256(stolenToken);

    // Session rotated 30 seconds ago (grace window has elapsed)
    sessions.push({
      id: 'sess-stolen',
      userId: user.id,
      familyId: 'fam-compromised',
      refreshTokenHash: hashSha256('new-valid-token'),
      previousTokenHash: stolenHash,
      rotatedAt: new Date(Date.now() - 30 * 1000), // 30s ago
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    // Second session in same family
    sessions.push({
      id: 'sess-stolen-2',
      userId: user.id,
      familyId: 'fam-compromised',
      refreshTokenHash: hashSha256('other-device-token'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    // Stolen token reused!
    await assert.rejects(
      async () => {
        await authService.refreshSession(stolenToken);
      },
      (err: any) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, 'SESSION_REUSE_DETECTED');
        return true;
      }
    );

    // All sessions in the compromised family have been revoked
    assert.equal(sessions.filter((s) => s.familyId === 'fam-compromised').length, 0);
  });

  // 12. JWT Tampering and Algorithm None Rejection
  it('rejects tampered JWT tokens and algorithm "none" tokens', () => {
    // 1. None algorithm attack
    const noneToken = jwt.sign(
      { sub: 'attacker', role: Role.ADMIN, sid: 'fake-sid' },
      '',
      { algorithm: 'none' }
    );

    assert.throws(
      () => {
        verifyAccessToken(noneToken);
      },
      (err: any) => {
        assert.equal(err.statusCode, 401);
        return true;
      }
    );

    // 2. Tampered signature
    const validToken = jwt.sign(
      { sub: 'user1', role: Role.STUDENT, sid: 's1' },
      env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '15m', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
    );
    const tamperedToken = validToken.slice(0, -6) + 'abcdef';

    assert.throws(
      () => {
        verifyAccessToken(tamperedToken);
      },
      (err: any) => {
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  // 13. Forgot password uniform response & reset token single use
  it('forgot password returns uniform response and password reset revokes all sessions', async () => {
    const email = 'reset-test@example.com';
    const user = {
      id: 'u-rst',
      email,
      passwordHash: await hashPassword('OldPass123!'),
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
    };
    users.push(user);

    // Add active sessions for user
    sessions.push({ id: 's1', userId: user.id, refreshTokenHash: 'h1' });
    sessions.push({ id: 's2', userId: user.id, refreshTokenHash: 'h2' });

    // Forgot password returns same message for existing and non-existing email
    const res1 = await authService.forgotPassword(email);
    const res2 = await authService.forgotPassword('non-existent-user@example.com');
    assert.equal(res1.message, res2.message);

    // Extract reset token from mailer
    const mailer = getMailer() as ConsoleMailerProvider;
    const resetUrl = mailer.lastSentEmail!.text;
    const tokenMatch = resetUrl.match(/token=([a-f0-9]+)/);
    assert.ok(tokenMatch);
    const rawResetToken = tokenMatch[1];

    // Reset password
    const resetResult = await authService.resetPassword(rawResetToken, 'BrandNewPassword123!');
    assert.ok(resetResult.message);

    // Verify all sessions were revoked
    assert.equal(sessions.filter((s) => s.userId === user.id).length, 0);

    // Token cannot be reused (single use)
    await assert.rejects(
      async () => {
        await authService.resetPassword(rawResetToken, 'AnotherPassword123!');
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });
});
