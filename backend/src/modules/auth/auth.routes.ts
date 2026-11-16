import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth, requireActiveAccount, csrfProtection } from './auth.middleware.js';
import {
  loginRateLimiter,
  otpRequestLimiter,
  forgotPasswordLimiter,
  refreshRateLimiter,
} from '../../middleware/rateLimiter.js';

const router = Router();

// Signup routes
router.post('/signup/request-otp', otpRequestLimiter, (req, res, next) =>
  authController.requestSignupOtp(req, res, next)
);
router.post('/signup/verify-otp', (req, res, next) =>
  authController.verifySignupOtp(req, res, next)
);
router.post('/signup/student', (req, res, next) =>
  authController.signupStudent(req, res, next)
);
router.post('/signup/owner', (req, res, next) =>
  authController.signupOwner(req, res, next)
);

// Login & Session routes
router.post('/login', loginRateLimiter, (req, res, next) =>
  authController.login(req, res, next)
);
router.post('/refresh', refreshRateLimiter, csrfProtection, (req, res, next) =>
  authController.refresh(req, res, next)
);
router.post('/logout', csrfProtection, (req, res, next) =>
  authController.logout(req, res, next)
);
router.post('/logout-all', requireAuth, csrfProtection, (req, res, next) =>
  authController.logoutAll(req, res, next)
);

// Account Profile & Sessions
router.get('/me', requireAuth, requireActiveAccount, (req, res, next) =>
  authController.getMe(req, res, next)
);
router.get('/sessions', requireAuth, requireActiveAccount, (req, res, next) =>
  authController.getSessions(req, res, next)
);

// Password recovery routes
router.post('/forgot-password', forgotPasswordLimiter, (req, res, next) =>
  authController.forgotPassword(req, res, next)
);
router.post('/reset-password', (req, res, next) =>
  authController.resetPassword(req, res, next)
);

export const authRoutes = router;
