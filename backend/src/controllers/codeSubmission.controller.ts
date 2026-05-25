import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import codeSubmissionService from '../services/codeSubmission.service';
import { CodeSubmissionStatus } from '@prisma/client';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  language: z.string().min(1),
  framework: z.string().optional(),
  codeContent: z.string().min(1),
  errorDescription: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sessionId: z.string().uuid().optional(),
});

const statusSchema = z.object({
  status: z.nativeEnum(CodeSubmissionStatus),
});

export class CodeSubmissionController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const data = createSchema.parse(req.body);
      const submission = await codeSubmissionService.create({ ...data, userId: req.user.id });
      res.status(201).json({ success: true, data: submission });
    } catch (error: any) {
      if (error instanceof z.ZodError) { res.status(400).json({ success: false, error: 'Validation error', details: error.errors }); return; }
      next(error);
    }
  }

  async getMySubmissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const submissions = await codeSubmissionService.getByUser(req.user.id);
      res.json({ success: true, data: submissions });
    } catch (error) { next(error); }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const language = req.query.language as string | undefined;
      const status = req.query.status as CodeSubmissionStatus | undefined;
      const submissions = await codeSubmissionService.getAll(language, status);
      res.json({ success: true, data: submissions });
    } catch (error) { next(error); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await codeSubmissionService.getById(req.params.id);
      res.json({ success: true, data: submission });
    } catch (error: any) {
      if (error.message === 'Submission not found') { res.status(404).json({ success: false, error: error.message }); return; }
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const { status } = statusSchema.parse(req.body);
      const submission = await codeSubmissionService.updateStatus(req.params.id, req.user.id, status);
      res.json({ success: true, data: submission });
    } catch (error: any) {
      if (error instanceof z.ZodError) { res.status(400).json({ success: false, error: 'Validation error', details: error.errors }); return; }
      if (error.message === 'Submission not found') { res.status(404).json({ success: false, error: error.message }); return; }
      if (error.message === 'Unauthorized') { res.status(403).json({ success: false, error: error.message }); return; }
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      await codeSubmissionService.delete(req.params.id, req.user.id);
      res.json({ success: true, message: 'Submission deleted' });
    } catch (error: any) {
      if (error.message === 'Submission not found') { res.status(404).json({ success: false, error: error.message }); return; }
      if (error.message === 'Unauthorized') { res.status(403).json({ success: false, error: error.message }); return; }
      next(error);
    }
  }
}

export default new CodeSubmissionController();
