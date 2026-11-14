/**
 * ---------------------------------------------------------------------------
 * FRONTEND DEMO CONSTANTS — authentication is fully simulated in Section 02.
 * No email, OTP, SMS or account ever leaves the browser.
 * ---------------------------------------------------------------------------
 */

/** Demo OTP used for the simulated email verification. */
export const DEMO_OTP = '123456'

/**
 * Frontend-only demo credentials for the Super Admin console (Section 03).
 * Comparison happens purely in the browser — there is no API, database,
 * JWT or real session. NEVER treat these as production credentials.
 */
export const DEMO_ADMIN_EMAIL = 'admin@rahomitra.demo'
export const DEMO_ADMIN_PASSWORD = 'Raho@Admin123'

/**
 * Frontend-only demo credentials for the PG Owner Dashboard (Section 04).
 * Comparison happens purely in the browser — there is no API, database,
 * JWT or real session. NEVER treat these as production credentials.
 */
export const DEMO_OWNER_EMAIL = 'owner1@rahomitra.demo'
export const DEMO_OWNER_PASSWORD = 'Raho@Owner123'

/**
 * Frontend-only demo credentials for the Student Dashboard (Section 05).
 * Comparison happens purely in the browser — there is no API, database,
 * JWT or real session. NEVER treat these as production credentials.
 */
export const DEMO_STUDENT_EMAIL = 'student@rahomitra.demo'
export const DEMO_STUDENT_PASSWORD = 'Raho@Student123'

/** Seconds before the "Resend OTP" button becomes available. */
export const OTP_RESEND_SECONDS = 30

/** Simulated network latency for demo actions (loading states). */
export function simulateLatency(ms = 900): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/** 10-digit Indian mobile number. */
export function isMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.replace(/[\s-]/g, ''))
}
