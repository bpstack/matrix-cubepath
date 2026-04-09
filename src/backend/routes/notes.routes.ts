import { Router } from 'express';
import { notesController } from '../controllers/notes.controller';
import { validate } from '../middleware/validate.middleware';
import { noteDateParam, noteBody } from '../validations/notes.validation';

const router = Router();

router.get('/notes', notesController.getDates);
router.get('/notes/:date', validate({ params: noteDateParam }), notesController.getByDate);
router.put('/notes/:date', validate({ params: noteDateParam, body: noteBody }), notesController.upsert);

export { router as notesRouter };
