import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import sessionService from '../services/session.service';
import { z } from 'zod';

const createSessionSchema = z.object({
  seniorId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional(),
  price: z.number().positive().optional(),
});

export class SessionController {
  async getMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const sessions = await sessionService.getUserSessions(req.user.id);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const stats = await sessionService.getUserStats(req.user.id, req.user.role);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMentors(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const mentors = await sessionService.getMentors(search);

      res.json({
        success: true,
        data: mentors,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const validatedData = createSessionSchema.parse(req.body);

      const session = await sessionService.createSession({
        juniorId: req.user.id,
        seniorId: validatedData.seniorId,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
        price: validatedData.price,
      });

      res.status(201).json({
        success: true,
        message: 'Session created successfully',
        data: session,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  async getSessionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionService.getSessionById(id);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyEarnings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (req.user.role !== 'SENIOR') {
        res.status(403).json({
          success: false,
          error: 'Only mentors can access earnings',
        });
        return;
      }

      const earnings = await sessionService.getMentorEarnings(req.user.id);

      res.json({
        success: true,
        data: earnings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (req.user.role !== 'SENIOR') {
        res.status(403).json({
          success: false,
          error: 'Only mentors can access session requests',
        });
        return;
      }

      const requests = await sessionService.getMentorRequests(req.user.id);

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (req.user.role !== 'SENIOR') {
        res.status(403).json({
          success: false,
          error: 'Only mentors can accept sessions',
        });
        return;
      }

      const { id } = req.params;
      const session = await sessionService.acceptSession(id, req.user.id);

      res.json({
        success: true,
        message: 'Session accepted successfully',
        data: session,
      });
    } catch (error: any) {
      if (error.message === 'Session not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      if (error.message === 'Unauthorized to accept this session') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async startSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const session = await sessionService.startSession(req.params.id, req.user.id);
      res.json({ success: true, data: session });
    } catch (error: any) {
      if (error.message === 'Session not found') { res.status(404).json({ success: false, error: error.message }); return; }
      if (error.message === 'Unauthorized') { res.status(403).json({ success: false, error: error.message }); return; }
      next(error);
    }
  }

  async endSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
      const session = await sessionService.endSession(req.params.id, req.user.id);
      res.json({ success: true, data: session });
    } catch (error: any) {
      if (error.message === 'Session not found') { res.status(404).json({ success: false, error: error.message }); return; }
      if (error.message === 'Unauthorized') { res.status(403).json({ success: false, error: error.message }); return; }
      next(error);
    }
  }

  async rejectSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (req.user.role !== 'SENIOR') {
        res.status(403).json({
          success: false,
          error: 'Only mentors can reject sessions',
        });
        return;
      }

      const { id } = req.params;
      const session = await sessionService.rejectSession(id, req.user.id);

      res.json({
        success: true,
        message: 'Session rejected successfully',
        data: session,
      });
    } catch (error: any) {
      if (error.message === 'Session not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      if (error.message === 'Unauthorized to reject this session') {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
}

export default new SessionController();
