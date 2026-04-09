import { Request, Response } from 'express';
import { closeUserDb, openUserDb } from '../db/user-db';
import { logger } from '../lib/logger';

type AuthenticatedRequest = Request & {
  matrixUser?: string;
};

export const dbController = {
  async reset(req: Request, res: Response) {
    const username = (req as AuthenticatedRequest).matrixUser;
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    try {
      // Drop and recreate the in-memory DB (migrations run automatically in openUserDb)
      closeUserDb(username);
      await openUserDb(username);
      res.json({ success: true, message: 'Database reset complete' });
    } catch (error) {
      logger.error('db', 'Database reset failed', error);
      res.status(500).json({ error: 'Failed to reset database' });
    }
  },

  download(_req: Request, res: Response) {
    res.status(503).json({ error: 'Database download is not available in this build' });
  },
};
