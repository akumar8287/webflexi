import { Router } from 'express';
import sessionController from '../controllers/session.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my sessions
router.get('/my-sessions', sessionController.getMySessions.bind(sessionController));

// Get my statistics
router.get('/my-stats', sessionController.getMyStats.bind(sessionController));

// Get all mentors
router.get('/mentors', sessionController.getMentors.bind(sessionController));

// Get my earnings (senior only)
router.get('/my-earnings', authorize('SENIOR'), sessionController.getMyEarnings.bind(sessionController));

// Get my session requests (senior only)
router.get('/my-requests', authorize('SENIOR'), sessionController.getMyRequests.bind(sessionController));

// Create a new session (junior only)
router.post('/', authorize('JUNIOR'), sessionController.createSession.bind(sessionController));

// Accept session request (senior only)
router.post('/:id/accept', authorize('SENIOR'), sessionController.acceptSession.bind(sessionController));

// Reject session request (senior only)
router.post('/:id/reject', authorize('SENIOR'), sessionController.rejectSession.bind(sessionController));

// Start / end session
router.post('/:id/start', sessionController.startSession.bind(sessionController));
router.post('/:id/end', sessionController.endSession.bind(sessionController));

// Get session by ID (this must be last to avoid route conflicts)
router.get('/:id', sessionController.getSessionById.bind(sessionController));

export default router;
