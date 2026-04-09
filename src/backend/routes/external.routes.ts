import { Router } from 'express';
import { externalController } from '../controllers/external.controller';

const router = Router();

router.get('/external/daily-quote', externalController.getDailyQuote);
router.get('/external/dev-feed', externalController.getDevFeed);

export { router as externalRouter };
