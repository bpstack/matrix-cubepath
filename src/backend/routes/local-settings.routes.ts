import { Router } from 'express';
import { localSettingsController } from '../controllers/local-settings.controller';
import { validate } from '../middleware/validate.middleware';
import { localSettingsSetBody } from '../validations/local-settings.validation';

export const localSettingsRouter = Router();

localSettingsRouter.get('/local-settings', localSettingsController.getAll);
localSettingsRouter.get('/local-settings/:key', localSettingsController.getOne);
localSettingsRouter.put('/local-settings/:key', validate({ body: localSettingsSetBody }), localSettingsController.set);
localSettingsRouter.delete('/local-settings/:key', localSettingsController.delete);
