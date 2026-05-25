import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', reviewController.create.bind(reviewController));
router.get('/mentor/:mentorId', reviewController.getMentorReviews.bind(reviewController));
router.get('/session/:sessionId', reviewController.getSessionReview.bind(reviewController));

export default router;
