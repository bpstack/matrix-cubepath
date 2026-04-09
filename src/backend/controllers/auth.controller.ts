import { Request, Response } from 'express';
import { createUser, verifyUser, userExists, getUserByEmail, createResetToken, consumeResetToken } from '../db/auth-db';
import { createSessionToken, COOKIE_NAME } from '../middleware/auth.middleware';
import { sendPasswordResetEmail } from '../lib/mailer';
import { logger } from '../lib/logger';
import { DEMO_USERNAME } from '../db/seed-demo';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const SECURE_COOKIE = process.env.SECURE_COOKIE === 'true';

function setCookie(res: Response, email: string): void {
  const token = createSessionToken(email);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Returns the stable key used for the session token and the per-user DB path.
 * Priority: username (preserves existing DB paths) → email (new email-only users).
 */
function sessionKey(email: string, username?: string | null): string {
  return username?.trim() || email.toLowerCase().trim();
}

export function register(req: Request, res: Response): void {
  const { email, username, password } = req.body as {
    email: string;
    username?: string;
    password: string;
  };

  if (userExists(email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  createUser(email, username ?? null, password);
  const key = sessionKey(email, username);
  setCookie(res, key);
  res.status(201).json({ ok: true });
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body as { email: string; password: string };

  if (!verifyUser(email, password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const user = getUserByEmail(email);
  const key = sessionKey(email, user?.username);
  setCookie(res, key);
  res.json({
    ok: true,
    username: key,
    isDemo: key === DEMO_USERNAME,
  });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

export function checkSession(req: Request, res: Response): void {
  const key = req.matrixUser!;
  res.json({ ok: true, username: key, isDemo: key === DEMO_USERNAME });
}

/**
 * POST /auth/forgot-password
 *
 * Always returns 200 to prevent user enumeration.
 * When SMTP is not configured, the reset URL is written to the server log
 * and `emailSent: false` is included in the response so the frontend can
 * tell the user to check the server logs (Dokploy log panel).
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };

  const rawToken = createResetToken(email);

  let emailSent = false;
  if (rawToken) {
    try {
      emailSent = await sendPasswordResetEmail(email, rawToken);
    } catch {
      logger.warn('mailer', `SMTP delivery failed for ${email} — token is still valid`);
    }
  }

  res.json({ ok: true, emailSent });
}

/** POST /auth/reset-password */
export function resetPassword(req: Request, res: Response): void {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  const ok = consumeResetToken(token, newPassword);
  if (!ok) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  res.json({ ok: true });
}
