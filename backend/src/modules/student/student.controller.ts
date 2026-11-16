import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service.js';
import { submitAdmissionCodeSchema } from './student.validation.js';

export class StudentController {
  private getUserId(req: Request): string {
    return req.user!.sub;
  }

  async submitAdmissionCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = submitAdmissionCodeSchema.parse(req.body);
      const result = await studentService.submitAdmissionCode(this.getUserId(req), validated);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOwnAdmissionRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await studentService.getOwnAdmissionRequests(this.getUserId(req));
      res.status(200).json({ data: requests });
    } catch (err) {
      next(err);
    }
  }

  async getAccommodation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accommodation = await studentService.getStudentAccommodation(this.getUserId(req));
      res.status(200).json({ data: accommodation });
    } catch (err) {
      next(err);
    }
  }
}

export const studentController = new StudentController();
