/**
 * Validation helpers for RahoMitra authentication forms.
 */

/** Seconds before the "Resend OTP" button becomes available. */
export const OTP_RESEND_SECONDS = 30

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/** 10-digit Indian mobile number (starts with 6-9). */
export function isMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.replace(/[\s-]/g, ''))
}
