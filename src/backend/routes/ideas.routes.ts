import { Router } from 'express';
import { ideasController } from '../controllers/ideas.controller';
import { validate } from '../middleware/validate.middleware';
import {
  ideaCreateBody,
  ideaUpdateBody,
  ideaEvaluateBody,
  ideaDecideBody,
  ideaPromoteBody,
} from '../validations/ideas.validation';

const router = Router();

router.get('/ideas/top-scored', ideasController.getTopScored);
router.get('/ideas/funnel', ideasController.getFunnel);
router.get('/ideas', ideasController.getAll);
router.get('/ideas/:id', ideasController.getById);
router.post('/ideas', validate({ body: ideaCreateBody }), ideasController.create);
router.patch('/ideas/:id', validate({ body: ideaUpdateBody }), ideasController.update);
router.delete('/ideas/:id', ideasController.delete);
router.post('/ideas/:id/evaluate', validate({ body: ideaEvaluateBody }), ideasController.evaluate);
router.get('/ideas/:id/evaluation', ideasController.getEvaluation);
router.patch('/ideas/:id/decide', validate({ body: ideaDecideBody }), ideasController.decide);
router.post('/ideas/:id/promote', validate({ body: ideaPromoteBody }), ideasController.promote);

export { router as ideasRouter };
