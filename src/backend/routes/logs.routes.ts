import { Router } from 'express';
import { logger } from '../lib/logger';

export const logsRouter = Router();

logsRouter.get('/logs', (_req, res) => {
  const content = logger.getContent();
  res.json({ content, path: logger.getLogPath() });
});

logsRouter.post('/logs/clear', (_req, res) => {
  logger.clear();
  res.json({ ok: true });
});
