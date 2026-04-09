import { Request, Response } from 'express';
import { notesRepository } from '../repositories/notes.repository';

export const notesController = {
  getDates(_req: Request, res: Response) {
    res.json(notesRepository.getDates());
  },

  getByDate(req: Request, res: Response) {
    res.json({ content: notesRepository.getByDate(req.params.date) });
  },

  upsert(req: Request, res: Response) {
    notesRepository.upsert(req.params.date, req.body.content);
    res.json({ ok: true });
  },
};
