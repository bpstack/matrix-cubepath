import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';

export const activityRouter = Router();

activityRouter.get('/activity/metrics', activityController.getMetrics);
activityRouter.get('/activity', activityController.getRecent);
