import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailerService {
  sendMail(options: SendMailOptions): Promise<void>;
  sendOtpEmail(to: string, otp: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
  sendPasswordChangedNotification(to: string): Promise<void>;
}

export class ConsoleMailerProvider implements MailerService {
  public lastSentEmail?: SendMailOptions;

  async sendMail(options: SendMailOptions): Promise<void> {
    this.lastSentEmail = options;
    if (env.NODE_ENV !== 'production') {
      logger.info({ to: options.to, subject: options.subject }, '📧 [Mailer - Dev Console] Email sent');
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Your RahoMitra Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.CORS_ORIGIN[0]}/reset-password?token=${resetToken}`;
    await this.sendMail({
      to,
      subject: 'Reset your RahoMitra Password',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}. This link expires in 30 minutes.`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 30 minutes.</p>`,
    });
  }

  async sendPasswordChangedNotification(to: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Your RahoMitra Password has been changed',
      text: 'Your RahoMitra account password was recently changed. If you did not make this change, please contact support immediately.',
      html: '<p>Your RahoMitra account password was recently changed. If you did not make this change, please contact support immediately.</p>',
    });
  }
}

export class SmtpMailerProvider implements MailerService {
  async sendMail(options: SendMailOptions): Promise<void> {
    logger.info({ to: options.to, subject: options.subject }, 'Sending SMTP email in production');
    // Production SMTP / Resend integration placeholder using nodemailer or direct SMTP
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Your RahoMitra Verification Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.CORS_ORIGIN[0]}/reset-password?token=${resetToken}`;
    await this.sendMail({
      to,
      subject: 'Reset your RahoMitra Password',
      text: `You requested a password reset: ${resetUrl}`,
      html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  async sendPasswordChangedNotification(to: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Your RahoMitra Password has been changed',
      text: 'Your RahoMitra account password was recently changed.',
      html: '<p>Your RahoMitra account password was recently changed.</p>',
    });
  }
}

let activeMailer: MailerService = new ConsoleMailerProvider();

export function setMailer(mailer: MailerService): void {
  activeMailer = mailer;
}

export function getMailer(): MailerService {
  return activeMailer;
}
