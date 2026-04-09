import { describe, it, expect } from 'vitest';
import { authRegisterBody, authLoginBody } from '../../backend/validations/auth.validation';

describe('authRegisterBody', () => {
  it('accepts valid credentials', () => {
    expect(authRegisterBody.safeParse({ username: 'alice', password: 'password123' }).success).toBe(true);
    expect(authRegisterBody.safeParse({ username: 'user_name-1', password: '12345678' }).success).toBe(true);
  });

  it('rejects short username (< 3)', () => {
    expect(authRegisterBody.safeParse({ username: 'ab', password: '12345678' }).success).toBe(false);
  });

  it('rejects long username (> 30)', () => {
    expect(authRegisterBody.safeParse({ username: 'a'.repeat(31), password: '12345678' }).success).toBe(false);
  });

  it('rejects username with special chars', () => {
    expect(authRegisterBody.safeParse({ username: 'user@name', password: '12345678' }).success).toBe(false);
    expect(authRegisterBody.safeParse({ username: 'user name', password: '12345678' }).success).toBe(false);
  });

  it('rejects short password (< 8)', () => {
    expect(authRegisterBody.safeParse({ username: 'alice', password: '1234567' }).success).toBe(false);
  });

  it('rejects long password (> 128)', () => {
    expect(authRegisterBody.safeParse({ username: 'alice', password: 'a'.repeat(129) }).success).toBe(false);
  });
});

describe('authLoginBody', () => {
  it('accepts any non-empty strings', () => {
    expect(authLoginBody.safeParse({ username: 'x', password: 'y' }).success).toBe(true);
  });

  it('rejects empty username', () => {
    expect(authLoginBody.safeParse({ username: '', password: 'y' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(authLoginBody.safeParse({ username: 'x', password: '' }).success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(authLoginBody.safeParse({}).success).toBe(false);
    expect(authLoginBody.safeParse({ username: 'x' }).success).toBe(false);
  });
});
