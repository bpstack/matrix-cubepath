import { expressApp } from './server';
import { API_PORT } from './config/constants';
import { logger } from './lib/logger';
import { stopStatusPolling } from './controllers/stats.controller';

process.on('uncaughtException', (err) => {
  logger.error('main', 'Uncaught exception', { stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('main', 'Unhandled rejection', { reason: String(reason) });
});

async function main() {
  // Seed demo user if DEMO_USER env var is set
  if (process.env.DEMO_USER) {
    const { seedDemoUser } = await import('./db/seed-demo');
    await seedDemoUser('es');
  }

  const server = expressApp.listen(API_PORT, () => {
    logger.info('main', `Matrix server running on port ${API_PORT}`);
  });

  function gracefulShutdown(signal: string) {
    logger.info('main', `${signal} received, shutting down`);
    stopStatusPolling();
    server.close(() => {
      logger.info('main', 'Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('main', 'Startup error', { stack: err instanceof Error ? err.stack : String(err) });
  process.exit(1);
});
