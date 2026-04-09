import { Request, Response } from 'express';
import { settingsRepo } from '../repositories/settings.repository';
import { fetchGitHubUser } from '../engines/github-scanner';
import { DEMO_USERNAME, seedDemoUser } from '../db/seed-demo';
import type { SeedLang } from '../db/seed-demo';

export const settingsController = {
  getAll(_req: Request, res: Response) {
    res.json(settingsRepo.findAll());
  },

  getByKey(req: Request, res: Response) {
    const s = settingsRepo.findByKey(req.params.key);
    if (!s) return res.status(404).json({ error: 'Setting not found' });
    res.json(s);
  },

  upsert(req: Request, res: Response) {
    const s = settingsRepo.upsert(req.params.key, req.body.value);

    // Re-seed demo data when demo user changes language
    if (req.params.key === 'language' && req.matrixUser === DEMO_USERNAME) {
      const lang = req.body.value as SeedLang;
      if (lang === 'en' || lang === 'es') {
        void seedDemoUser(lang).catch(() => {});
      }
    }

    res.json(s);
  },

  delete(req: Request, res: Response) {
    settingsRepo.delete(req.params.key);
    res.json({ success: true });
  },

  async githubStatus(_req: Request, res: Response) {
    const token = settingsRepo.findByKey('github_token')?.value;
    if (!token) {
      return res.json({ configured: false, connected: false });
    }

    try {
      const user = await fetchGitHubUser(token);
      res.json({ configured: true, connected: true, username: user.login });
    } catch {
      res.json({ configured: true, connected: false });
    }
  },

  getServices(_req: Request, res: Response) {
    res.json({ render: [], databases: [] });
  },

  setServices(_req: Request, res: Response) {
    res.status(503).json({ error: 'External services configuration is not available in this build' });
  },
};
