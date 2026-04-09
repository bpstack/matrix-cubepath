import { describe, it, expect } from 'vitest';
import {
  deriveAuthHash,
  verifyAuthHash,
  generateEncSalt,
  deriveEncryptionKey,
  encrypt,
  decrypt,
  generateSecurePassword,
  isEncrypted,
} from '../../backend/engines/crypto';

describe('crypto engine', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt plaintext and return different string', () => {
      const key = deriveEncryptionKey('password', generateEncSalt());
      const encrypted = encrypt('hello world', key);
      expect(encrypted).not.toBe('hello world');
    });

    it('should decrypt encrypted text back to original', () => {
      const salt = generateEncSalt();
      const key = deriveEncryptionKey('password', salt);
      const encrypted = encrypt('hello world', key);
      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe('hello world');
    });

    it('should fail decrypt with wrong key', () => {
      const salt = generateEncSalt();
      const key1 = deriveEncryptionKey('password1', salt);
      const key2 = deriveEncryptionKey('password2', salt);
      const encrypted = encrypt('secret', key1);
      expect(() => decrypt(encrypted, key2)).toThrow();
    });

    it('should handle special characters', () => {
      const salt = generateEncSalt();
      const key = deriveEncryptionKey('password', salt);
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should add v1 prefix to encrypted data', () => {
      const salt = generateEncSalt();
      const key = deriveEncryptionKey('password', salt);
      const encrypted = encrypt('test', key);
      expect(encrypted.startsWith('v1:')).toBe(true);
    });

    it('isEncrypted should detect v1 prefix', () => {
      const salt = generateEncSalt();
      const key = deriveEncryptionKey('password', salt);
      const encrypted = encrypt('test', key);
      expect(isEncrypted(encrypted)).toBe(true);
      expect(isEncrypted('plaintext')).toBe(false);
    });
  });

  describe('auth hash', () => {
    it('should derive auth hash with salt', () => {
      const { salt, hash } = deriveAuthHash('password123');
      expect(salt).toBeDefined();
      expect(hash).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(typeof hash).toBe('string');
    });

    it('should verify correct password', () => {
      const { salt, hash } = deriveAuthHash('password123');
      const valid = verifyAuthHash('password123', salt, hash);
      expect(valid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const { salt, hash } = deriveAuthHash('password123');
      const valid = verifyAuthHash('wrongpassword', salt, hash);
      expect(valid).toBe(false);
    });

    it('should generate different salts each time', () => {
      const { salt: salt1 } = deriveAuthHash('password');
      const { salt: salt2 } = deriveAuthHash('password');
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of specified length', () => {
      const password = generateSecurePassword(16);
      expect(password.length).toBe(16);
    });

    it('should generate different passwords each time', () => {
      const p1 = generateSecurePassword(16);
      const p2 = generateSecurePassword(16);
      expect(p1).not.toBe(p2);
    });

    it('should default to length 16', () => {
      const password = generateSecurePassword();
      expect(password.length).toBe(16);
    });

    it('should contain only valid characters', () => {
      const password = generateSecurePassword(100);
      const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      for (const char of password) {
        expect(validChars.includes(char)).toBe(true);
      }
    });
  });

  describe('generateEncSalt', () => {
    it('should generate base64 encoded salt', () => {
      const salt = generateEncSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should generate different salts', () => {
      const salts = new Set([generateEncSalt(), generateEncSalt(), generateEncSalt()]);
      expect(salts.size).toBe(3);
    });
  });
});
