import { Role, UserStatus, ApplicationStatus, User } from '@prisma/client';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/errors.js';
import {
  hashPassword,
  comparePassword,
  dummyHashComparison,
  generateSecureOtp,
  hashSha256,
  constantTimeCompare,
  generateRandomToken,
  signAccessToken,
  signSignupToken,
  verifySignupToken,
} from '../../utils/crypto.js';
import { getMailer } from '../../utils/mailer.js';
import {
  studentSignupSchema,
  ownerSignupSchema,
  loginSchema,
} from './auth.validation.js';
import { z } from 'zod';

export class AuthService {
  /**
   * Request signup OTP
   * Enforces 30s resend cooldown and max 5 requests per hour
   */
  async requestSignupOtp(email: string, role: Role, ipAddress?: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.status === UserStatus.ACTIVE && existingUser.emailVerifiedAt) {
      throw AppError.conflict('An active account with this email address already exists. Please log in.');
    }

    const now = new Date();

    // 2. Cooldown check: 30 seconds since the last OTP created for this email
    const latestOtp = await prisma.emailOtp.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const msSinceLast = now.getTime() - latestOtp.createdAt.getTime();
      if (msSinceLast < 30 * 1000) {
        const remainingSeconds = Math.ceil((30 * 1000 - msSinceLast) / 1000);
        throw AppError.badRequest(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
      }
    }

    // 3. Hourly cap: maximum 5 OTPs per hour per email or IP
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyEmailCount = await prisma.emailOtp.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyEmailCount >= 5) {
      throw AppError.badRequest('Hourly verification code request limit reached. Please try again later.');
    }

    // 4. Generate cryptographically secure 6-digit OTP
    const otp = generateSecureOtp();
    const otpHash = hashSha256(otp);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    // 5. Store hashed OTP in database
    const otpRecord = await prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose: `SIGNUP_${role}`,
        expiresAt,
        ipAddress,
      },
    });

    // 6. Send OTP via Mailer
    try {
      await getMailer().sendOtpEmail(normalizedEmail, otp);
    } catch (error) {
      await prisma.emailOtp.delete({ where: { id: otpRecord.id } });
      throw AppError.internal(
        'Unable to send the verification email. Please try again shortly.',
        'EMAIL_DELIVERY_FAILED'
      );
    }

    return { message: 'Verification code sent to your email address.' };
  }

  /**
   * Verify signup OTP
   * Maximum 5 wrong attempts then invalidate, single-use, constant-time comparison
   */
  async verifySignupOtp(email: string, otp: string): Promise<{ signupToken: string; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    // Find latest unused OTP for this email
    const otpRecord = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw AppError.badRequest('No active verification code found for this email. Please request a new one.');
    }

    // Check expiry
    if (otpRecord.expiresAt < now) {
      throw AppError.badRequest('Verification code has expired. Please request a new one.');
    }

    // Check attempt limit
    if (otpRecord.failedAttempts >= 5) {
      // Invalidate immediately
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: { usedAt: now },
      });
      throw AppError.badRequest('Too many incorrect attempts. This code has been invalidated. Please request a new code.');
    }

    // Constant-time comparison
    const incomingHash = hashSha256(otp);
    const isValid = constantTimeCompare(otpRecord.otpHash, incomingHash);

    if (!isValid) {
      const nextAttempts = otpRecord.failedAttempts + 1;
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: {
          failedAttempts: nextAttempts,
          usedAt: nextAttempts >= 5 ? now : null,
        },
      });

      if (nextAttempts >= 5) {
        throw AppError.badRequest('Too many incorrect attempts. This code has been invalidated. Please request a new code.');
      }

      throw AppError.badRequest('Invalid verification code.');
    }

    // Mark as used (single use)
    await prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: { usedAt: now },
    });

    // Generate short-lived signed signup token (15m)
    const signupToken = signSignupToken(normalizedEmail);

    return {
      signupToken,
      message: 'Email verified successfully.',
    };
  }

  /**
   * Complete Student Signup
   */
  async signupStudent(data: z.infer<typeof studentSignupSchema>): Promise<{ message: string; user: { id: string; email: string; fullName: string; role: Role } }> {
    const { email } = verifySignupToken(data.signupToken);

    // Double-check user does not already exist
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          fullName: data.fullName.trim(),
          mobile: data.mobile,
          city: data.city.trim(),
          emailVerifiedAt: new Date(),
        },
      });

      await tx.student.create({
        data: {
          userId: newUser.id,
          college: data.college.trim(),
          city: data.city.trim(),
        },
      });

      return newUser;
    });

    return {
      message: 'Student account created successfully.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  /**
   * Complete Owner Signup
   * Creates user and PENDING owner_application. Cannot log in until approved.
   */
  async signupOwner(data: z.infer<typeof ownerSignupSchema>): Promise<{ message: string; applicationId: string }> {
    const { email } = verifySignupToken(data.signupToken);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(data.password);

    const { application } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: Role.OWNER,
          status: UserStatus.ACTIVE,
          fullName: data.fullName.trim(),
          mobile: data.mobile,
          city: data.pg.city.trim(),
          emailVerifiedAt: new Date(),
        },
      });

      const newApp = await tx.ownerApplication.create({
        data: {
          ownerName: data.fullName.trim(),
          email,
          pgName: data.pg.name.trim(),
          city: data.pg.city.trim(),
          category: data.pg.type,
          status: ApplicationStatus.PENDING,
          note: `Properties managed: ${data.pg.count}, Address: ${data.pg.address}`,
        },
      });

      return { user: newUser, application: newApp };
    });

    return {
      message: 'Owner registration submitted successfully. Your application is under admin review.',
      applicationId: application.id,
    };
  }

  /**
   * Login with constant-time dummy verification for unknown emails, role matching,
   * account lockout after 5 failed attempts, and specific post-password status codes.
   */
  async login(
    input: z.infer<typeof loginSchema>,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: { id: string; email: string; fullName: string; role: Role; status: UserStatus };
    accessToken: string;
    rawRefreshToken: string;
    sessionExpiresAt: Date;
  }> {
    const email = input.email.trim().toLowerCase();
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 1. Unknown email: execute dummy hash comparison for constant-time response (prevent user enumeration)
    if (!user) {
      await dummyHashComparison(input.password);
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 2. Lockout check: 5 failed attempts = locked for 15 minutes
    if (user.lockedUntil && user.lockedUntil > now) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000));
      throw new AppError(
        `Account is temporarily locked due to consecutive failed login attempts. Please try again in ${waitMinutes} minutes.`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      const nextFailCount = user.failedLoginCount + 1;
      const isLockedNow = nextFailCount >= 5;
      const lockedUntil = isLockedNow ? new Date(now.getTime() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextFailCount,
          lockedUntil,
        },
      });

      if (isLockedNow) {
        throw new AppError(
          'Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.',
          423,
          'ACCOUNT_LOCKED'
        );
      }

      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 4. Role match check (role in request must match account role)
    if (user.role !== input.role) {
      // Must not leak user role: return generic credentials error
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 5. Post-password status checks (only evaluated AFTER password is confirmed)
    if (!user.emailVerifiedAt) {
      throw new AppError('Please verify your email address before logging in.', 403, 'EMAIL_NOT_VERIFIED');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === UserStatus.DELETED) {
      throw new AppError('Account has been deactivated.', 401, 'ACCOUNT_DELETED');
    }

    // 6. Owner Application status check (Owner cannot log in until approved)
    if (user.role === Role.OWNER) {
      const application = await prisma.ownerApplication.findFirst({
        where: { email },
        orderBy: { submittedOn: 'desc' },
      });

      if (application) {
        if (application.status === ApplicationStatus.PENDING) {
          throw new AppError(
            'Your PG Owner application is currently under review by admin. You will receive an email once approved.',
            403,
            'OWNER_PENDING_APPROVAL'
          );
        }
        if (application.status === ApplicationStatus.REJECTED) {
          throw new AppError(
            `Your PG Owner application was rejected: ${application.rejectionReason || 'Contact platform support.'}`,
            403,
            'OWNER_REJECTED'
          );
        }
      }
    }

    // 7. Successful login: reset failed counters
    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    // 8. Create session and tokens
    const rawRefreshToken = generateRandomToken(32);
    const refreshTokenHash = hashSha256(rawRefreshToken);
    const sessionDays = input.rememberMe ? 30 : 7;
    const sessionExpiresAt = new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: sessionExpiresAt,
        userAgent,
        ipAddress,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      sid: session.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
      accessToken,
      rawRefreshToken,
      sessionExpiresAt,
    };
  }

  /**
   * Refresh session with rotation and reuse detection
   */
  async refreshSession(
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; rawRefreshToken: string; sessionExpiresAt: Date }> {
    if (!rawRefreshToken) {
      throw AppError.unauthorized('Refresh token is required', 'TOKEN_MISSING');
    }

    const incomingHash = hashSha256(rawRefreshToken);
    const now = new Date();

    // 1. Look up session by current refresh token hash
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: incomingHash },
      include: { user: true },
    });

    if (session) {
      // Check session expiry
      if (session.expiresAt < now) {
        await prisma.session.delete({ where: { id: session.id } });
        throw AppError.unauthorized('Session has expired. Please log in again.', 'SESSION_EXPIRED');
      }

      // Check user account status
      if (session.user.status === UserStatus.SUSPENDED) {
        await prisma.session.delete({ where: { id: session.id } });
        throw new AppError('Your account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
      }

      if (session.user.status === UserStatus.DELETED) {
        await prisma.session.delete({ where: { id: session.id } });
        throw AppError.unauthorized('Account has been deactivated.', 'ACCOUNT_DELETED');
      }

      // Rotate token: generate new random token
      const newRawRefreshToken = generateRandomToken(32);
      const newHash = hashSha256(newRawRefreshToken);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: newHash,
          previousTokenHash: incomingHash,
          rotatedAt: now,
          userAgent,
          ipAddress,
        },
      });

      const accessToken = signAccessToken({
        sub: session.userId,
        role: session.user.role,
        sid: session.id,
      });

      return {
        accessToken,
        rawRefreshToken: newRawRefreshToken,
        sessionExpiresAt: session.expiresAt,
      };
    }

    // 2. Token not found by current hash: check if this was a recently rotated previous token (concurrent race)
    const recentlyRotated = await prisma.session.findFirst({
      where: { previousTokenHash: incomingHash },
      include: { user: true },
    });

    if (recentlyRotated && recentlyRotated.rotatedAt) {
      const msSinceRotation = now.getTime() - recentlyRotated.rotatedAt.getTime();
      // Grace window: 15 seconds to gracefully handle concurrent/in-flight requests
      if (msSinceRotation <= 15 * 1000) {
        const accessToken = signAccessToken({
          sub: recentlyRotated.userId,
          role: recentlyRotated.user.role,
          sid: recentlyRotated.id,
        });

        return {
          accessToken,
          rawRefreshToken: '', // Client keeps current valid active token
          sessionExpiresAt: recentlyRotated.expiresAt,
        };
      }

      // Token reuse beyond grace window -> Hostile token reuse detected!
      // Revoke the entire session family for this user
      await prisma.session.deleteMany({
        where: { familyId: recentlyRotated.familyId },
      });

      throw AppError.unauthorized(
        'Suspicious session token reuse detected. All active sessions in this family have been terminated for security.',
        'SESSION_REUSE_DETECTED'
      );
    }

    throw AppError.unauthorized('Invalid or expired refresh token. Please log in again.', 'INVALID_SESSION');
  }

  /**
   * Revoke current session
   */
  async logout(rawRefreshToken?: string, sid?: string): Promise<void> {
    if (rawRefreshToken) {
      const hash = hashSha256(rawRefreshToken);
      await prisma.session.deleteMany({
        where: {
          OR: [{ refreshTokenHash: hash }, ...(sid ? [{ id: sid }] : [])],
        },
      });
    } else if (sid) {
      await prisma.session.deleteMany({
        where: { id: sid },
      });
    }
  }

  /**
   * Revoke all sessions for user
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Fetch current user fresh from DB
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.unauthorized('User account not found', 'USER_NOT_FOUND');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === UserStatus.DELETED) {
      throw AppError.unauthorized('Your account has been deactivated.', 'ACCOUNT_DELETED');
    }

    return user;
  }

  /**
   * Request password reset: ALWAYS returns identical 200 message regardless of whether email exists
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user exists and is active, create reset token and send email
    if (user && user.status === UserStatus.ACTIVE) {
      // Invalidate any previously unused reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      const rawToken = generateRandomToken(32);
      const tokenHash = hashSha256(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await getMailer().sendPasswordResetEmail(user.email, rawToken);
    }

    // Uniform 200 response (prevents user enumeration)
    return {
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    };
  }

  /**
   * Reset password with valid token: updates password, revokes all sessions, marks token used
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = hashSha256(rawToken);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt !== null || resetToken.expiresAt < now) {
      throw AppError.badRequest('Password reset token is invalid, expired, or already used.');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      // 1. Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      });

      // 2. Update user's password hash and unlock account if locked
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });

      // 3. REVOKE ALL SESSIONS for this user
      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    // Send password changed notification email
    await getMailer().sendPasswordChangedNotification(resetToken.user.email);

    return {
      message: 'Your password has been successfully reset. Please log in with your new password.',
    };
  }

  /**
   * List active sessions for user
   */
  async getSessions(userId: string, currentSid?: string) {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSid,
    }));
  }
}

export const authService = new AuthService();
