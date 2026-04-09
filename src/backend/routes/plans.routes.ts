import { Router } from 'express';
import { plansController } from '../controllers/plans.controller';
import { validate } from '../middleware/validate.middleware';
import { planCreateBody, planUpdateBody } from '../validations/plans.validation';

const router = Router();

router.get('/plans', plansController.getAll);
router.get('/plans/:id', plansController.getById);
router.post('/plans', validate({ body: planCreateBody }), plansController.create);
router.patch('/plans/:id', validate({ body: planUpdateBody }), plansController.update);
router.delete('/plans/:id', plansController.delete);

export { router as plansRouter };
