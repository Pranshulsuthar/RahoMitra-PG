import { Request, Response, NextFunction } from 'express';
import { pgService } from './pg.service.js';
import { pgQuerySchema } from './pg.validation.js';

export class PGController {
  async listPGs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = pgQuerySchema.parse(req.query);
      const result = await pgService.getPublicPGs(validatedQuery);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPGBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const pg = await pgService.getPublicPGBySlug(slug);
      res.status(200).json({ data: pg });
    } catch (err) {
      next(err);
    }
  }

  async getLocalities(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const localities = await pgService.getPublicLocalities();
      res.status(200).json({ data: localities });
    } catch (err) {
      next(err);
    }
  }
}

export const pgController = new PGController();
