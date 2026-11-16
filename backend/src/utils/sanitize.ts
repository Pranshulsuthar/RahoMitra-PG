/**
 * Utility for sanitizing user-submitted text to prevent Stored XSS attacks.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Recursively sanitizes string properties in an object.
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as unknown as T
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T
  }
  if (obj !== null && typeof obj === 'object') {
    const res: any = {}
    for (const key of Object.keys(obj)) {
      res[key] = sanitizeObject((obj as any)[key])
    }
    return res
  }
  return obj
}
