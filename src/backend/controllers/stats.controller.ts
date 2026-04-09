import { Request, Response } from 'express';
import { getDb } from '../db/connection';
import { tasks, plans, ideas } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import { logger } from '../lib/logger';


interface SystemStatusResult {
  api: { status: string };
  render: { name: string; url: string; status: string; responseTime?: number | null }[];
  databases: { name: string; type: string; status: string }[];
  checkedAt: string;
}

let cachedStatus: SystemStatusResult | null = null;
let statusCheckRunning = false;

async function checkSystemStatus(): Promise<SystemStatusResult> {
  // External service monitoring requires configuration — return base status
  const result: SystemStatusResult = {
    api: { status: 'online' },
    render: [],
    databases: [],
    checkedAt: new Date().toISOString(),
  };
  cachedStatus = result;
  return result;
}

/* ── Auto-poll: runs every 10 min in background ── */
const STATUS_POLL_INTERVAL = 10 * 60 * 1000; // 10 min
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollStatusQuietly() {
  if (statusCheckRunning) return;
  statusCheckRunning = true;
  try {
    await checkSystemStatus();
    logger.info('status', 'Auto-poll completed');
  } catch (err) {
    logger.warn('status', `Auto-poll failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    statusCheckRunning = false;
  }
}

export function startStatusPolling() {
  if (pollTimer) return;
  setTimeout(() => {
    pollStatusQuietly();
    pollTimer = setInterval(pollStatusQuietly, STATUS_POLL_INTERVAL);
  }, 30_000);
  logger.info('status', 'Status auto-polling scheduled (every 10 min)');
}

export function stopStatusPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export const statsController = {
  get(_req: Request, res: Response) {
    const db = getDb();
    const totalTasks = db.select({ count: count() }).from(tasks).get()!.count;
    const completedTasks = db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'done')).get()!.count;
    const activePlans = db.select({ count: count() }).from(plans).where(eq(plans.status, 'in_progress')).get()!.count;
    const pendingIdeas = db.select({ count: count() }).from(ideas).where(eq(ideas.status, 'pending')).get()!.count;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({ totalTasks, completedTasks, completionRate, activePlans, pendingIdeas });
  },

  async getSystemStatus(req: Request, res: Response) {
    try {
      const forceRefresh = req.query.refresh === '1';
      // If a check is already running, return cached to avoid concurrent HTTP calls
      if (!forceRefresh && statusCheckRunning && cachedStatus) {
        return res.json(cachedStatus);
      }
      if (!forceRefresh && cachedStatus) {
        const age = Date.now() - new Date(cachedStatus.checkedAt).getTime();
          if (age < 2 * 60 * 1000) {
          return res.json(cachedStatus);
        }
      }
      const result = await checkSystemStatus();
      res.json(result);
    } catch (err) {
      logger.error('stats', 'getSystemStatus error', err);
      if (cachedStatus) return res.json(cachedStatus);
      res.status(500).json({ error: 'Failed to get system status' });
    }
  },

  async wakeService(req: Request, res: Response) {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL required' });
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return res.status(400).json({ error: 'URL must use http:// or https://' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL — must include protocol (https://)' });
    }
    logger.info('wake', `Sending wake request: GET ${url}`);
    try {
      const resp = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(30_000) });
      logger.info('wake', `Wake response: ${url} → ${resp.status}`);
      return res.json({ status: 'awake', httpStatus: resp.status });
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
      logger.warn('wake', `Wake ${isTimeout ? 'timed out' : 'failed'}: ${url}`);
      return res.json({ status: isTimeout ? 'sleeping' : 'failed' });
    }
  },
};
