import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { dbController } from '../controllers/db.controller';
import { validate } from '../middleware/validate.middleware';
import { settingsUpsertBody } from '../validations/settings.validation';

const router = Router();

router.get('/settings', settingsController.getAll);
router.get('/settings/github-status', settingsController.githubStatus);
router.get('/settings/services', settingsController.getServices);
router.put('/settings/services', settingsController.setServices);
router.get('/settings/:key', settingsController.getByKey);
router.put('/settings/:key', validate({ body: settingsUpsertBody }), settingsController.upsert);
router.delete('/settings/:key', settingsController.delete);
router.post('/db/reset', dbController.reset);
router.get('/db/download', dbController.download);

export { router as settingsRouter };
