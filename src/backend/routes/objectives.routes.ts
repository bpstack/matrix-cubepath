import { Router } from 'express';
import { objectivesController } from '../controllers/objectives.controller';
import { validate } from '../middleware/validate.middleware';
import { objectiveCreateBody, objectiveUpdateBody } from '../validations/objectives.validation';

const router = Router();

router.get('/objectives', objectivesController.getAll);
router.get('/objectives/:id', objectivesController.getById);
router.post('/objectives', validate({ body: objectiveCreateBody }), objectivesController.create);
router.patch('/objectives/:id', validate({ body: objectiveUpdateBody }), objectivesController.update);
router.delete('/objectives/:id', objectivesController.delete);

export { router as objectivesRouter };
