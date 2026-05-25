import { Router } from 'express';
import codeSubmissionController from '../controllers/codeSubmission.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', codeSubmissionController.getAll.bind(codeSubmissionController));
router.post('/', codeSubmissionController.create.bind(codeSubmissionController));
router.get('/mine', codeSubmissionController.getMySubmissions.bind(codeSubmissionController));
router.get('/:id', codeSubmissionController.getById.bind(codeSubmissionController));
router.patch('/:id/status', codeSubmissionController.updateStatus.bind(codeSubmissionController));
router.delete('/:id', codeSubmissionController.delete.bind(codeSubmissionController));

export default router;
