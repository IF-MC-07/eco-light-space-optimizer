import { jest } from '@jest/globals';
import { sanitizePayload, safeTruncate, isAuthRoute, activityLogger } from '../../../app/middlewares/activityLogger.middleware.js';
import db from '../../../app/models/index.js';

describe('Activity Logger & Redaction Unit Tests', () => {
  describe('1. sanitizePayload - Recursive Redaction with Regex Pattern', () => {
    it('redacts password variants: new_password, oldPassword, currentPassword, passwd, password', () => {
      const input = {
        new_password: 'SecretNewPassword123!',
        oldPassword: 'OldPassword123!',
        currentPassword: 'CurrentPassword123!',
        passwd: 'passwd_value',
        password: 'plain_password',
      };
      const result = sanitizePayload(input);
      expect(result).toEqual({
        new_password: '[REDACTED]',
        oldPassword: '[REDACTED]',
        currentPassword: '[REDACTED]',
        passwd: '[REDACTED]',
        password: '[REDACTED]',
      });
    });

    it('redacts token, secret, and credential variants: accessToken, secretKey, jwt, otp, api_key', () => {
      const input = {
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'rt_99999...',
        secret_key: 'sk_live_123',
        client_secret: 'secret_abc',
        jwt: 'jwt.token.here',
        otp_code: '123456',
        credential: 'user_credentials',
        api_key: 'key-12345',
        apiKey: 'key-67890',
        'api-key': 'key-abcde',
        session_id: 'sess_123',
        cookie: 'sessionId=abc',
        authorization: 'Bearer xyz',
      };
      const result = sanitizePayload(input);
      expect(result).toEqual({
        accessToken: '[REDACTED]',
        refreshToken: '[REDACTED]',
        secret_key: '[REDACTED]',
        client_secret: '[REDACTED]',
        jwt: '[REDACTED]',
        otp_code: '[REDACTED]',
        credential: '[REDACTED]',
        api_key: '[REDACTED]',
        apiKey: '[REDACTED]',
        'api-key': '[REDACTED]',
        session_id: '[REDACTED]',
        cookie: '[REDACTED]',
        authorization: '[REDACTED]',
      });
    });

    it('preserves non-sensitive fields intact', () => {
      const input = {
        room_name: 'Ruang Teori 1',
        temperature: 24.5,
        is_active: true,
        count: 10,
        tags: ['lighting', 'ac'],
      };
      const result = sanitizePayload(input);
      expect(result).toEqual(input);
    });

    it('redacts sensitive fields in nested objects', () => {
      const input = {
        user: {
          profile: {
            username: 'admin',
            currentPassword: 'supersecretpassword',
          },
          security: {
            auth_meta: {
              accessToken: 'token_val',
            },
          },
        },
      };
      const result = sanitizePayload(input);
      expect(result).toEqual({
        user: {
          profile: {
            username: 'admin',
            currentPassword: '[REDACTED]',
          },
          security: {
            auth_meta: {
              accessToken: '[REDACTED]',
            },
          },
        },
      });
    });

    it('redacts sensitive fields inside arrays of objects', () => {
      const input = [
        { id: 1, name: 'Alice', token: 'token1' },
        { id: 2, name: 'Bob', api_key: 'secretKey2' },
      ];
      const result = sanitizePayload(input);
      expect(result).toEqual([
        { id: 1, name: 'Alice', token: '[REDACTED]' },
        { id: 2, name: 'Bob', api_key: '[REDACTED]' },
      ]);
    });
  });

  describe('2. safeTruncate - Size Limiting and Markers', () => {
    it('does not truncate payloads within the length limit', () => {
      const details = { action: 'test', status: 'ok' };
      const result = safeTruncate(details, 2048);
      expect(JSON.parse(result)).toEqual(details);
    });

    it('truncates payloads exceeding 2 KB and adds marker', () => {
      const largePayload = {
        body: 'x'.repeat(3000),
        note: 'important info',
      };
      const result = safeTruncate(largePayload, 2048);
      expect(result.length).toBeLessThanOrEqual(2048);
      expect(result).toMatch(/(\[OMITTED_OVERFLOW\]|\[TRUNCATED\])/);
    });
  });

  describe('3. isAuthRoute Helper', () => {
    it('correctly detects /api/auth routes', () => {
      expect(isAuthRoute('/api/auth/login')).toBe(true);
      expect(isAuthRoute('/api/auth/register')).toBe(true);
      expect(isAuthRoute('/api/auth/change-password?token=123')).toBe(true);
      expect(isAuthRoute('/api/auth')).toBe(true);
      expect(isAuthRoute('/api/rooms')).toBe(false);
      expect(isAuthRoute('/api/monitoring/devices')).toBe(false);
    });
  });

  describe('4. activityLogger Middleware on Auth Routes', () => {
    let createSpy;

    beforeEach(() => {
      jest.clearAllMocks();
      createSpy = jest.spyOn(db.ActivityLog, 'create').mockResolvedValue({});
    });

    it('auth route logs ONLY method, path, status, and user_id without body, params, query, or response', () => {
      const req = {
        method: 'POST',
        originalUrl: '/api/auth/login',
        body: { email: 'admin@example.com', password: 'SecretPassword123' },
        params: {},
        query: { ref: 'homepage' },
        user: null,
        headers: {},
        socket: {},
      };

      const res = {
        statusCode: 200,
        json: jest.fn(function (data) { return this; }),
      };
      const next = jest.fn();

      activityLogger(req, res, next);
      expect(next).toHaveBeenCalled();

      // Trigger the intercepted res.json
      res.json({
        success: true,
        data: {
          user: { user_id: 'USR-001', name: 'Admin' },
          token: 'jwt.token.string',
        },
      });

      expect(createSpy).toHaveBeenCalledTimes(1);
      const loggedArg = createSpy.mock.calls[0][0];

      expect(loggedArg.action).toBe('POST /api/auth/login');
      expect(loggedArg.status_code).toBe(200);
      expect(loggedArg.user_id).toBe('USR-001');

      // details must NOT contain body, params, query, or response
      const parsedDetails = JSON.parse(loggedArg.details);
      expect(parsedDetails.body).toBeUndefined();
      expect(parsedDetails.params).toBeUndefined();
      expect(parsedDetails.query).toBeUndefined();
      expect(parsedDetails.response).toBeUndefined();
    });

    it('non-auth route logs regular fields and redacts sensitive parameters', () => {
      const req = {
        method: 'POST',
        originalUrl: '/api/users',
        body: { name: 'New User', password: 'PlainPassword', role: 'staff' },
        params: {},
        query: {},
        user: { user_id: 'USR-ADMIN' },
        headers: {},
        socket: {},
      };

      const res = {
        statusCode: 201,
        json: jest.fn(function (data) { return this; }),
      };
      const next = jest.fn();

      activityLogger(req, res, next);
      expect(next).toHaveBeenCalled();

      res.json({
        success: true,
        data: { user_id: 'USR-002', name: 'New User' },
      });

      expect(createSpy).toHaveBeenCalledTimes(1);
      const loggedArg = createSpy.mock.calls[0][0];

      expect(loggedArg.action).toBe('POST /api/users');
      expect(loggedArg.status_code).toBe(201);
      expect(loggedArg.user_id).toBe('USR-ADMIN');

      const parsedDetails = JSON.parse(loggedArg.details);
      expect(parsedDetails.body.name).toBe('New User');
      expect(parsedDetails.body.role).toBe('staff');
      expect(parsedDetails.body.password).toBe('[REDACTED]');
      expect(parsedDetails.response).toBe('[RESPONSE_OMITTED]');
    });
  });
});
