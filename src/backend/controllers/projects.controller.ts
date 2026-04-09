import { Request, Response } from 'express';
import nodePath from 'path';
import { projectsRepo } from '../repositories/projects.repository';
import { scanProject, collectTechStats } from '../engines/scanner';
import { normalizeGitHubRepo, syncFromGitHub } from '../engines/github-scanner';
import { activityRepo } from '../repositories/activity.repository';
import { localSettings } from '../lib/localSettings';
import { settingsRepo } from '../repositories/settings.repository';
import { logger } from '../lib/logger';

function isAbsoluteAnyPlatform(p: string): boolean {
  if (nodePath.isAbsolute(p)) return true;
  return /^[A-Za-z]:[/\\]/.test(p);
}

function normalizeSeparators(p: string): string {
  return p.replace(/[\\/]/g, nodePath.sep);
}

function resolvePath(storedPath: string): string {
  if (isAbsoluteAnyPlatform(storedPath)) return storedPath;
  const base = localSettings.get('projects_base_path');
  if (!base) return storedPath;
  return nodePath.join(base, storedPath);
}

function toRelativePath(absolutePath: string): string {
  const base = localSettings.get('projects_base_path');
  if (!base) return absolutePath;
  const normalBase = nodePath.normalize(normalizeSeparators(base));
  const normalAbs = nodePath.normalize(normalizeSeparators(absolutePath));
  if (normalAbs.startsWith(normalBase + nodePath.sep)) {
    return normalAbs.slice(normalBase.length + nodePath.sep.length);
  }
  if (isAbsoluteAnyPlatform(absolutePath) && base) {
    const parts = absolutePath.split(/[\\/]/).filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart) return lastPart;
  }
  return absolutePath;
}

export const projectsController = {
  getAll(_req: Request, res: Response) {
    const all = projectsRepo.findAll();
    const result = all.map((p) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
      scan: projectsRepo.getLatestScan(p.id) || null,
      resolvedPath: p.path ? resolvePath(p.path) : null,
    }));
    res.json(result);
  },

  getById(req: Request, res: Response) {
    const p = projectsRepo.findById(Number(req.params.id));
    if (!p) return res.status(404).json({ error: 'Project not found' });
    res.json({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
      scan: projectsRepo.getLatestScan(p.id) || null,
      links: projectsRepo.getLinks(p.id),
      resolvedPath: p.path ? resolvePath(p.path) : null,
    });
  },

  create(req: Request, res: Response) {
    const { tags, path: rawPath, url: rawUrl, ...rest } = req.body;
    const storedPath = rawPath ? toRelativePath(rawPath) : rawPath;
    let normalizedUrl: string | undefined;
    try {
      normalizedUrl = rawUrl ? normalizeGitHubRepo(rawUrl) : undefined;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid GitHub repository format';
      return res.status(400).json({ error: message });
    }
    const p = projectsRepo.create({
      ...rest,
      path: storedPath,
      url: normalizedUrl,
      tags: tags ? JSON.stringify(tags) : undefined,
    });

    const respond = (row = p) =>
      res.status(201).json({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : [],
        techStats: row.techStats ? JSON.parse(row.techStats) : null,
        scan: projectsRepo.getLatestScan(row.id) || null,
        resolvedPath: row.path ? resolvePath(row.path) : null,
      });

    if (normalizedUrl) {
      const token = settingsRepo.findByKey('github_token')?.value || null;
      syncFromGitHub(token, normalizedUrl)
        .then(({ scan, techStats }) => {
          projectsRepo.update(p.id, { url: normalizedUrl, techStats: JSON.stringify(techStats) });
          const totalPhases = scan.roadmap.totalPhases || 0;
          const completedPhases = scan.roadmap.completedPhases || 0;
          projectsRepo.upsertScan(p.id, {
            totalTasks: totalPhases,
            completedTasks: completedPhases,
            blockers: 0,
            wipItems: 0,
            progressPercent: totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0,
            rawData: JSON.stringify(scan),
          });
          const fresh = projectsRepo.findById(p.id) || p;
          activityRepo.log('synced', 'project', p.id, `Synced project from GitHub: ${p.name}`);
          activityRepo.log('created', 'project', p.id, `Created project: ${p.name}`);
          respond(fresh);
        })
        .catch(() => {
          activityRepo.log('created', 'project', p.id, `Created project: ${p.name}`);
          respond();
        });
      return;
    }

    if (p.path) {
      const techStats = collectTechStats(resolvePath(p.path));
      projectsRepo.update(p.id, { techStats: JSON.stringify(techStats) });
    }

    activityRepo.log('created', 'project', p.id, `Created project: ${p.name}`);
    respond(projectsRepo.findById(p.id) || p);
  },

  update(req: Request, res: Response) {
    const { tags, path: rawPath, url: rawUrl, ...rest } = req.body;
    const data: Record<string, unknown> = { ...rest };
    if (tags !== undefined) data.tags = JSON.stringify(tags);
    if (rawPath !== undefined) data.path = toRelativePath(rawPath);
    if (rawUrl !== undefined) {
      try {
        data.url = rawUrl ? normalizeGitHubRepo(rawUrl) : rawUrl;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid GitHub repository format';
        return res.status(400).json({ error: message });
      }
    }

    const p = projectsRepo.update(Number(req.params.id), data as Parameters<typeof projectsRepo.update>[1]);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    res.json({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      techStats: p.techStats ? JSON.parse(p.techStats) : null,
      resolvedPath: p.path ? resolvePath(p.path) : null,
    });
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    activityRepo.log('deleted', 'project', id, `Deleted project: ${p.name}`);
    projectsRepo.delete(id);
    res.status(204).send();
  },

  scan(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    if (!p.path) return res.status(400).json({ error: 'Project has no path configured' });
    const absolutePath = resolvePath(p.path);

    try {
      const scanResult = scanProject(absolutePath);
      const totalPhases = scanResult.roadmap.totalPhases || 0;
      const completedPhases = scanResult.roadmap.completedPhases || 0;

      const scan = projectsRepo.upsertScan(id, {
        totalTasks: totalPhases,
        completedTasks: completedPhases,
        blockers: 0,
        wipItems: 0,
        progressPercent: totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0,
        rawData: JSON.stringify(scanResult),
      });

      const techStats = collectTechStats(absolutePath);
      projectsRepo.update(id, { techStats: JSON.stringify(techStats) });

      activityRepo.log('scanned', 'project', id, `Scanned project: ${p.name}`);
      res.json({ scan, techStats });
    } catch (err) {
      logger.error('scan', `Error scanning project ${id} at path "${p.path}"`, err);
      res.status(500).json({ error: 'Scan failed', detail: String(err) });
    }
  },

  async syncGitHub(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    if (!p.url) return res.status(400).json({ error: 'Project has no GitHub URL' });

    const token = settingsRepo.findByKey('github_token')?.value || null;

    try {
      const { normalizedRepo, scan, techStats } = await syncFromGitHub(token, p.url);
      projectsRepo.update(id, { url: normalizedRepo, techStats: JSON.stringify(techStats) });

      const totalPhases = scan.roadmap.totalPhases || 0;
      const completedPhases = scan.roadmap.completedPhases || 0;
      const scanRow = projectsRepo.upsertScan(id, {
        totalTasks: totalPhases,
        completedTasks: completedPhases,
        blockers: 0,
        wipItems: 0,
        progressPercent: totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0,
        rawData: JSON.stringify(scan),
      });

      activityRepo.log('synced', 'project', id, `Synced project from GitHub: ${p.name}`);
      res.json({ scan: scanRow, techStats });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'GitHub sync failed';
      res.status(502).json({ error: message });
    }
  },

  addLink(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = projectsRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    try {
      const link = projectsRepo.addLink(id, req.body.linkableType, req.body.linkableId);
      res.status(201).json(link);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Link already exists' });
      }
      throw err;
    }
  },

  removeLink(req: Request, res: Response) {
    const linkId = Number(req.params.linkId);
    projectsRepo.removeLink(linkId);
    res.status(204).send();
  },

  normalizePaths(_req: Request, res: Response) {
    const base = localSettings.get('projects_base_path');
    if (!base) return res.status(400).json({ error: 'No projects_base_path configured' });

    const all = projectsRepo.findAll();
    let updated = 0;
    for (const p of all) {
      if (!p.path) continue;
      const relative = toRelativePath(p.path);
      if (relative !== p.path) {
        projectsRepo.update(p.id, { path: relative } as Parameters<typeof projectsRepo.update>[1]);
        updated++;
      }
    }
    res.json({ updated, total: all.length });
  },
};
