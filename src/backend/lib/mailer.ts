import { logger } from './logger';

/**
 * Email sending is disabled in this build.
 * The reset URL is logged to stdout so it can be retrieved from server logs.
 */
export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<boolean> {
  const appUrl = (process.env.APP_URL || 'http://localhost:3939').replace(/\/$/, '');
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
  logger.info('mailer', `[NO SMTP] Password reset URL for ${to}: ${resetUrl}`);
  return false;
}
