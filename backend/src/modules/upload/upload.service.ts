import { AppError } from '../../utils/errors.js'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export class UploadService {
  /**
   * Validates and processes an uploaded image.
   * Accepts base64 encoded string or data URI.
   */
  static processImage(dataUriOrBase64: string): { url: string; mimeType: string; sizeBytes: number } {
    if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') {
      throw AppError.badRequest('Image payload is required')
    }

    let mimeType = 'image/jpeg'
    let base64Data = dataUriOrBase64

    if (dataUriOrBase64.startsWith('data:')) {
      const match = dataUriOrBase64.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        throw AppError.badRequest('Invalid data URI format')
      }
      mimeType = match[1].toLowerCase()
      base64Data = match[2]
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw AppError.badRequest(
        `Invalid image type '${mimeType}'. Allowed types are: JPEG, PNG, WEBP, GIF.`
      )
    }

    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw AppError.badRequest(
        `Image size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size of 5 MB.`
      )
    }

    // Verify magic bytes header
    if (!this.verifyMagicBytes(buffer, mimeType)) {
      throw AppError.badRequest('Image file contents do not match claimed image format')
    }

    const safeUrl = `data:${mimeType};base64,${base64Data}`
    return {
      url: safeUrl,
      mimeType,
      sizeBytes: buffer.length,
    }
  }

  private static verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 4) return false

    if (mimeType === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    }
    if (mimeType === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    }
    if (mimeType === 'image/gif') {
      return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
    }
    if (mimeType === 'image/webp') {
      return (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      )
    }
    return false
  }
}
