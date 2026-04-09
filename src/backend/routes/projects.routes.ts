import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller';
import { validate } from '../middleware/validate.middleware';
import { projectCreateBody, projectUpdateBody, projectLinkBody } from '../validations/projects.validation';

const router = Router();

router.get('/projects', projectsController.getAll);
router.post('/projects', validate({ body: projectCreateBody }), projectsController.create);
router.post('/projects/normalize-paths', projectsController.normalizePaths);
router.get('/projects/:id', projectsController.getById);
router.patch('/projects/:id', validate({ body: projectUpdateBody }), projectsController.update);
router.delete('/projects/:id', projectsController.delete);
router.post('/projects/:id/scan', projectsController.scan);
router.post('/projects/:id/sync-github', projectsController.syncGitHub);
router.post('/projects/:id/links', validate({ body: projectLinkBody }), projectsController.addLink);
router.delete('/projects/:id/links/:linkId', projectsController.removeLink);

export { router as projectsRouter };
