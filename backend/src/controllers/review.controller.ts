import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import reviewService from '../services/review.service';

const createSchema = z.object({
  sessionId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export class ReviewController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const data = createSchema.parse(req.body);
      const review = await reviewService.create({ ...data, reviewerId: req.user.id });
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      if (error instanceof z.ZodError) { res.status(400).json({ success: false, error: 'Validation error', details: error.errors }); return; }
      const clientErrors = ['Session not found', 'Session not completed', 'Only the junior can leave a review', 'Review already exists for this session'];
      if (clientErrors.includes(error.message)) { res.status(400).json({ success: false, error: error.message }); return; }
      next(error);
    }
  }

  async getMentorReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reviewService.getMentorReviews(req.params.mentorId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSessionReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await reviewService.getSessionReview(req.params.sessionId);
      res.json({ success: true, data: review });
    } catch (error) { next(error); }
  }
}

export default new ReviewController();
