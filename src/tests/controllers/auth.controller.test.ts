import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';

vi.mock('../../backend/db/auth-db', () => ({
  createUser: vi.fn(),
  verifyUser: vi.fn(),
  userExists: vi.fn(),
}));

vi.mock('../../backend/middleware/auth.middleware', () => ({
  createSessionToken: vi.fn(() => 'mock-token'),
  COOKIE_NAME: 'matrix_session',
}));

import { register, login, logout, checkSession } from '../../backend/controllers/auth.controller';
import { createUser, verifyUser, userExists } from '../../backend/db/auth-db';

const mockReq = (body: unknown = {}) => ({ body }) as unknown as Request;

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth.controller', () => {
  // Input validation (missing fields, regex, length) is now handled by validate middleware at route level.
  // See src/tests/validations/auth.validation.test.ts for schema tests.

  describe('register', () => {
    it('returns 409 when username is already taken', () => {
      vi.mocked(userExists).mockReturnValue(true);
      const res = mockRes();
      register(mockReq({ username: 'existinguser', password: 'password123' }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates user and sets cookie on valid input', () => {
      vi.mocked(userExists).mockReturnValue(false);
      const res = mockRes();
      register(mockReq({ username: 'newuser', password: 'password123' }), res);
      expect(createUser).toHaveBeenCalledWith('newuser', 'password123');
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('login', () => {
    it('returns 401 when credentials are invalid', () => {
      vi.mocked(verifyUser).mockReturnValue(false);
      const res = mockRes();
      login(mockReq({ username: 'user', password: 'wrongpassword' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('sets cookie and returns ok on valid credentials', () => {
      vi.mocked(verifyUser).mockReturnValue(true);
      const res = mockRes();
      login(mockReq({ username: 'user', password: 'correctpassword' }), res);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true, username: 'user', isDemo: false });
    });
  });

  describe('logout', () => {
    it('clears cookie and returns ok', () => {
      const req = mockReq();
      const res = mockRes();
      logout(req, res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('checkSession', () => {
    it('returns ok with username and isDemo flag', () => {
      const req = { ...mockReq(), matrixUser: 'alice' } as unknown as Request;
      const res = mockRes();
      checkSession(req, res);
      expect(res.json).toHaveBeenCalledWith({ ok: true, username: 'alice', isDemo: false });
    });

    it('returns isDemo true for demo user', () => {
      const req = { ...mockReq(), matrixUser: 'demo' } as unknown as Request;
      const res = mockRes();
      checkSession(req, res);
      expect(res.json).toHaveBeenCalledWith({ ok: true, username: 'demo', isDemo: true });
    });
  });
});
