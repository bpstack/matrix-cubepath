import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller';
import { validate } from '../middleware/validate.middleware';
import { taskCreateBody, taskUpdateBody } from '../validations/tasks.validation';

const router = Router();

router.get('/tasks', tasksController.getAll);
router.get('/tasks/deadlines', tasksController.getDeadlines);
router.get('/tasks/:id', tasksController.getById);
router.post('/tasks', validate({ body: taskCreateBody }), tasksController.create);
router.patch('/tasks/:id', validate({ body: taskUpdateBody }), tasksController.update);
router.delete('/tasks/:id', tasksController.delete);

export { router as tasksRouter };
