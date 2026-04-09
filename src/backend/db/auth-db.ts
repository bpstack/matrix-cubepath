import crypto from 'crypto';

/**
 * Authentication store — in-memory for this build.
 *
 * User credentials and password-reset flows are held in Maps for the
 * lifetime of the process; nothing is persisted to disk.
 *
 * Production upgrade path: replace with @libsql/client using a local
 * file URL (e.g. "file:./data/auth.db"). Migrate the schema with
 * drizzle-kit push and use drizzle-orm/libsql as the query adapter —
 * the function signatures here stay the same.
 */

interface User {
  id: number;
  email: string;
  username: string | null;
  password_hash: string;
  salt: string;
  created_at: string;
}

interface ResetToken {
  userId: number;
  expiresAt: string;
  used: boolean;
}

let nextId = 1;
const users = new Map<string, User>(); // keyed by lowercase email
const resetTokens = new Map<string, ResetToken>(); // keyed by tokenHash

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// No-op: kept for API compatibility with start.ts
export function initAuthDb(): void {}

export function createUser(email: string, username: string | null, password: string): void {
  const key = email.toLowerCase().trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  users.set(key, {
    id: nextId++,
    email: key,
    username: username?.trim() || null,
    password_hash: hash,
    salt,
    created_at: new Date().toISOString(),
  });
}

export function verifyUser(email: string, password: string): boolean {
  const user = users.get(email.toLowerCase().trim());
  if (!user) {
    // Always run the hash to prevent timing-based enumeration
    crypto.scryptSync(password, 'dummy_salt_constant_for_timing', 64);
    return false;
  }
  const hash = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.password_hash));
}

export function userExists(email: string): boolean {
  return users.has(email.toLowerCase().trim());
}

export function deleteUserByEmail(email: string): void {
  users.delete(email.toLowerCase().trim());
}

export function getUserByEmail(email: string): { id: number; email: string; username: string | null } | undefined {
  const user = users.get(email.toLowerCase().trim());
  if (!user) return undefined;
  return { id: user.id, email: user.email, username: user.username };
}

export function createResetToken(email: string): string | null {
  const user = getUserByEmail(email);
  if (!user) return null;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // Invalidate any previous tokens for this user
  for (const [hash, t] of resetTokens) {
    if (t.userId === user.id) resetTokens.delete(hash);
  }

  resetTokens.set(tokenHash, { userId: user.id, expiresAt, used: false });
  return rawToken;
}

export function consumeResetToken(rawToken: string, newPassword: string): boolean {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const token = resetTokens.get(tokenHash);

  if (!token || token.used || new Date(token.expiresAt) < new Date()) return false;

  const user = [...users.values()].find((u) => u.id === token.userId);
  if (!user) return false;

  const salt = crypto.randomBytes(16).toString('hex');
  user.password_hash = hashPassword(newPassword, salt);
  user.salt = salt;
  token.used = true;

  return true;
}
