import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger';
import { requireAuth } from './middleware/auth.middleware';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { missionRouter } from './routes/mission.routes';
import { objectivesRouter } from './routes/objectives.routes';
import { plansRouter } from './routes/plans.routes';
import { tasksRouter } from './routes/tasks.routes';
import { settingsRouter } from './routes/settings.routes';
import { projectsRouter } from './routes/projects.routes';
import { ideasRouter } from './routes/ideas.routes';
import { activityRouter } from './routes/activity.routes';
import { statsRouter } from './routes/stats.routes';
import { startStatusPolling } from './controllers/stats.controller';
import { externalRouter } from './routes/external.routes';
import { localSettingsRouter } from './routes/local-settings.routes';
import { logsRouter } from './routes/logs.routes';
import { notesRouter } from './routes/notes.routes';
import { docsRouter } from './routes/docs.routes';
import { DEMO_USERNAME } from './db/seed-demo';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Global rate limit — 300 requests per minute per IP
// (React Query + multiple views can easily do 30-50 on load)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});
app.use('/api', globalLimiter);

app.use(express.json());
app.use(cookieParser());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.google-analytics.com; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
  }
  next();
});

// CORS — only needed for dev (in prod, same origin via reverse proxy)
if (process.env.NODE_ENV !== 'production') {
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });
}

// Public routes (no auth required)
app.use('/api', authRouter);
app.use('/api', healthRouter);
app.use('/api', externalRouter);

// All other API routes require authentication
app.use('/api', requireAuth);

// Protected API routes
app.use('/api', missionRouter);
app.use('/api', objectivesRouter);
app.use('/api', plansRouter);
app.use('/api', tasksRouter);
app.use('/api', settingsRouter);
app.use('/api', projectsRouter);
app.use('/api', ideasRouter);
app.use('/api', activityRouter);
app.use('/api', statsRouter);
app.use('/api', localSettingsRouter);
app.use('/api', logsRouter);
app.use('/api', notesRouter);
app.use('/api', docsRouter);

// Demo data reset — only allowed for the demo user
app.post('/api/demo/reset', (req, res) => {
  const username = req.matrixUser;
  if (username !== DEMO_USERNAME) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  import('./db/seed-demo')
    .then(async ({ seedDemoUser }) => {
      const lang = (req.body?.language === 'es' ? 'es' : 'en') as import('./db/seed-demo').SeedLang;
      await seedDemoUser(lang);
      res.json({ ok: true });
    })
    .catch((err) => res.status(500).json({ error: String(err) }));
});

// Well-known & meta files
app.get('/.well-known/security.txt', (_req, res) => {
  res.type('text/plain').send(
    `Contact: mailto:security@example.com\nPreferred-Languages: es, en\nExpires: 2027-04-06T00:00:00.000Z\n`
  );
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /api/\nAllow: /\n');
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDir = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendDir));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
}

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error('api', message, {
    stack: err instanceof Error ? err.stack?.split('\n')[1]?.trim() : undefined,
    url: req.url,
  });
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});

startStatusPolling();

export { app as expressApp };
