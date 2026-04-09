import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha512';
const ENC_PREFIX = 'v1:';

export function deriveAuthHash(masterPassword: string): { salt: string; hash: string } {
  const saltBuf = randomBytes(32);
  const hashBuf = pbkdf2Sync(`auth:${masterPassword}`, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return { salt: saltBuf.toString('base64'), hash: hashBuf.toString('base64') };
}

export function verifyAuthHash(masterPassword: string, storedSalt: string, storedHash: string): boolean {
  const saltBuf = Buffer.from(storedSalt, 'base64');
  const expected = Buffer.from(storedHash, 'base64');
  // Try new domain-separated format first, fallback to legacy
  const derived = pbkdf2Sync(`auth:${masterPassword}`, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  if (timingSafeEqual(derived, expected)) return true;
  const legacy = pbkdf2Sync(masterPassword, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return timingSafeEqual(legacy, expected);
}

/** Check if a stored hash was created without domain separation (legacy) */
export function isLegacyAuth(masterPassword: string, storedSalt: string, storedHash: string): boolean {
  const saltBuf = Buffer.from(storedSalt, 'base64');
  const expected = Buffer.from(storedHash, 'base64');
  const derived = pbkdf2Sync(`auth:${masterPassword}`, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return !timingSafeEqual(derived, expected);
}

export function generateEncSalt(): string {
  return randomBytes(32).toString('base64');
}

export function deriveEncryptionKey(masterPassword: string, storedSalt: string, legacy = false): Buffer {
  const saltBuf = Buffer.from(storedSalt, 'base64');
  const input = legacy ? masterPassword : `enc:${masterPassword}`;
  return pbkdf2Sync(input, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
}

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

export function decrypt(encrypted: string, key: Buffer): string {
  // Support both v1: prefixed and legacy non-prefixed format
  const raw = encrypted.startsWith(ENC_PREFIX) ? encrypted.slice(ENC_PREFIX.length) : encrypted;
  const parts = raw.split(':');
  if (parts.length < 3) throw new Error('Invalid encrypted format');
  const [ivB64, tagB64, ...ctParts] = parts;
  const ctB64 = ctParts.join(':');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('Invalid encrypted format');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

export function generateSecurePassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const limit = Math.floor(256 / chars.length) * chars.length; // rejection sampling threshold
  const result: string[] = [];
  while (result.length < length) {
    const bytes = randomBytes(length - result.length);
    for (const b of bytes) {
      if (b < limit && result.length < length) {
        result.push(chars[b % chars.length]);
      }
    }
  }
  return result.join('');
}
