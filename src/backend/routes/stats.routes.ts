import { Router } from 'express';
import { statsController } from '../controllers/stats.controller';

export const statsRouter = Router();

statsRouter.get('/stats', statsController.get);
statsRouter.get('/stats/system-status', statsController.getSystemStatus);
statsRouter.post('/stats/wake-service', statsController.wakeService);
