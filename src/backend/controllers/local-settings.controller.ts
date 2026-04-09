import { Request, Response } from 'express';
import { localSettings } from '../lib/localSettings';

export const localSettingsController = {
  getAll(_req: Request, res: Response) {
    res.json(localSettings.getAll());
  },

  getOne(req: Request, res: Response) {
    const value = localSettings.get(req.params.key);
    if (value === null) return res.status(404).json({ error: 'Not found' });
    res.json({ key: req.params.key, value });
  },

  set(req: Request, res: Response) {
    localSettings.set(req.params.key, req.body.value);
    res.json({ key: req.params.key, value: req.body.value });
  },

  delete(req: Request, res: Response) {
    localSettings.delete(req.params.key);
    res.status(204).send();
  },
};
