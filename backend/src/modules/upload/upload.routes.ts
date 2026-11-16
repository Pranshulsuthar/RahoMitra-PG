import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware.js'
import { UploadController } from './upload.controller.js'

export const uploadRouter = Router()

uploadRouter.use(requireAuth)
uploadRouter.post('/image', UploadController.uploadImage)
