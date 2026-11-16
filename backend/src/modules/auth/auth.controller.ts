import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';
import {
  requestOtpSchema,
  verifyOtpSchema,
  studentSignupSchema,
  ownerSignupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';

function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    domain: env.COOKIE_DOMAIN !== 'localhost' ? env.COOKIE_DOMAIN : undefined,
    expires: expiresAt,
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    domain: env.COOKIE_DOMAIN !== 'localhost' ? env.COOKIE_DOMAIN : undefined,
  });
}

export class AuthController {
  /** POST /api/auth/signup/request-otp */
  async requestSignupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = requestOtpSchema.parse(req.body);
      const result = await authService.requestSignupOtp(data.email, data.role, req.ip);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/signup/verify-otp */
  async verifySignupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await authService.verifySignupOtp(data.email, data.otp);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/signup/student */
  async signupStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = studentSignupSchema.parse(req.body);
      const result = await authService.signupStudent(data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/signup/owner */
  async signupOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = ownerSignupSchema.parse(req.body);
      const result = await authService.signupOwner(data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/login */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data, req.headers['user-agent'], req.ip);

      // Set HttpOnly refresh token cookie
      setRefreshTokenCookie(res, result.rawRefreshToken, result.sessionExpiresAt);

      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/refresh */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = (req.cookies?.refreshToken as string) || req.body?.refreshToken;
      const result = await authService.refreshSession(rawRefreshToken, req.headers['user-agent'], req.ip);

      if (result.rawRefreshToken) {
        setRefreshTokenCookie(res, result.rawRefreshToken, result.sessionExpiresAt);
      }

      res.status(200).json({
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/logout */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.refreshToken as string;
      const sid = req.user?.sid;
      await authService.logout(rawRefreshToken, sid);
      clearRefreshTokenCookie(res);
      res.status(200).json({ message: 'Successfully logged out.' });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/logout-all */
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next();
      await authService.logoutAll(req.user.sub);
      clearRefreshTokenCookie(res);
      res.status(200).json({ message: 'Successfully logged out from all active sessions.' });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/auth/me */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next();
      const user = await authService.getCurrentUser(req.user.sub);
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          mobile: user.mobile,
          city: user.city,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/auth/sessions */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return next();
      const sessions = await authService.getSessions(req.user.sub, req.user.sid);
      res.status(200).json({ sessions });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/forgot-password */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(data.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/reset-password */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(data.token, data.password);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
