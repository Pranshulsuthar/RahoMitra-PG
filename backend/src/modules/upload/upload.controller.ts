import type { Request, Response, NextFunction } from 'express'
import { UploadService } from './upload.service.js'

export class UploadController {
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { image } = req.body
      const result = UploadService.processImage(image)
      res.status(201).json({ data: result })
    } catch (err) {
      next(err)
    }
  }
}
