import { Router } from 'express';
import { missionController } from '../controllers/mission.controller';
import { validate } from '../middleware/validate.middleware';
import { missionCreateBody, missionUpdateBody } from '../validations/mission.validation';

const router = Router();

router.get('/mission', missionController.getAll);
router.get('/mission/:id', missionController.getById);
router.post('/mission', validate({ body: missionCreateBody }), missionController.create);
router.patch('/mission/:id', validate({ body: missionUpdateBody }), missionController.update);
router.delete('/mission/:id', missionController.delete);

export { router as missionRouter };
