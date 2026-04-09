import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { openUserDb } from '../db/user-db';
import { userDbContext } from '../db/context';

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
export const COOKIE_NAME = 'matrix_session';

function signToken(payload: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest('hex')}`;
}

function verifyToken(token: string): string | null {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;
  const payload = token.substring(0, lastDot);
  const expected = signToken(payload);
  if (token.length !== expected.length) return null;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return payload;
}

// Creates a signed session token embedding the username
export function createSessionToken(username: string): string {
  const payload = `user=${encodeURIComponent(username)}&ts=${Date.now()}`;
  return signToken(payload);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const username = new URLSearchParams(payload).get('user');
  if (!username) {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.matrixUser = username;
  // Open (or reuse cached) user DB and run the rest of the request inside its context
  openUserDb(username)
    .then((userDb) => userDbContext.run(userDb, next))
    .catch(next);
}
