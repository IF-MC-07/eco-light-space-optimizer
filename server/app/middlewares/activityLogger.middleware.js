import db from '../models/index.js';

const { ActivityLog } = db;

// ─── Module-level constants (parsed once on startup, not per-request) ─────────

const SENSITIVE_KEY_PATTERN = /pass|pwd|secret|token|authorization|jwt|otp|credential|api[-_]?key|cookie|session/i;

const SENSITIVE_FIELDS = (() => {
  const defaults = [
    'password', 'confirmPassword', 'avatar', 'image',
    'file', 'token', 'refreshToken',
  ];
  const fromEnv = process.env.LOG_SENSITIVE_FIELDS
    ? process.env.LOG_SENSITIVE_FIELDS.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return [...new Set([...defaults, ...fromEnv])];
})();

const isSensitiveKey = (key) => {
  if (typeof key !== 'string') return false;
  return SENSITIVE_FIELDS.includes(key) || SENSITIVE_KEY_PATTERN.test(key);
};

const FULL_RESPONSE_ROUTES = process.env.LOG_FULL_RESPONSE_ROUTES
  ? process.env.LOG_FULL_RESPONSE_ROUTES.split(',').map(s => s.trim()).filter(Boolean)
  : []; // /api/auth/login dihapus dari full response

const MAX_LENGTH = parseInt(process.env.LOG_MAX_LENGTH, 10) || 2048; // Batas default 2 KB

// ─── Helpers ──────────────────────────────────────────────────────────────────

const base64Regex = /^data:[a-z]+\/[a-z]+;base64,/i;

export const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }

  const sanitized = {};

  for (const key of Object.keys(payload)) {
    const value = payload[key];

    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && base64Regex.test(value)) {
      sanitized[key] = '[BASE64_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Checks if a route is under /api/auth
 */
export const isAuthRoute = (urlWithQuery) => {
  if (!urlWithQuery) return false;
  const path = urlWithQuery.split('?')[0];
  return path === '/api/auth' || path.startsWith('/api/auth/');
};

/**
 * Exact-path match: '/api/auth/login' matches '/api/auth/login' and
 * '/api/auth/login?redirect=...' but NOT '/api/auth/login-sso'.
 */
const matchesRoute = (urlWithQuery, route) => {
  const path = urlWithQuery.split('?')[0];
  return path === route || path.startsWith(route + '/');
};

/**
 * Safe truncation: keeps detailsObj as valid JSON by re-serialising
 * a reduced version instead of cutting raw string mid-character.
 * When still exceeding maxLength, truncates with a clear marker.
 */
export const safeTruncate = (detailsObj, maxLength = MAX_LENGTH) => {
  const full = typeof detailsObj === 'string' ? detailsObj : JSON.stringify(detailsObj);
  if (full.length <= maxLength) return full;

  const truncated = JSON.stringify({
    ...detailsObj,
    body: '[OMITTED_OVERFLOW]',
    response: '[OMITTED_OVERFLOW]',
    _truncated: true,
  });

  if (truncated.length <= maxLength) return truncated;

  // Jika tetap melebihi batas, potong dengan penanda
  const marker = '... [TRUNCATED]';
  const sliceLen = Math.max(0, maxLength - marker.length);
  return full.slice(0, sliceLen) + marker;
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export const activityLogger = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (
      ['POST', 'PUT', 'DELETE'].includes(req.method) &&
      req.originalUrl.startsWith('/api')
    ) {
      const isLoginRoute = req.method === 'POST' && req.originalUrl.includes('/login');
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

      // ── user_id ──────────────────────────────────────────────────────────
      let user_id = req.user ? (req.user.user_id ?? req.user.id ?? null) : null;

      if (isLoginRoute && isSuccess && user_id === null) {
        user_id =
          data?.data?.user?.user_id ??
          data?.data?.user?.id ??
          data?.data?.user_id ??
          data?.user?.user_id ??
          data?.user?.id ??
          data?.user_id ??
          null;
      }

      // ── ip_address ───────────────────────────────────────────────────────
      let ip_address = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
      if (ip_address) {
        if (ip_address.includes(',')) ip_address = ip_address.split(',')[0].trim();
        if (ip_address.startsWith('::ffff:')) ip_address = ip_address.slice(7);
      }

      // ── details object ───────────────────────────────────────────────────
      const isAuth = isAuthRoute(req.originalUrl);
      let detailsObj;

      if (isAuth) {
        // Untuk rute /api/auth/: tanpa body, params, query, atau response
        detailsObj = {};
      } else {
        const shouldLogFullResponse = FULL_RESPONSE_ROUTES.some(
          route => matchesRoute(req.originalUrl, route)
        );

        detailsObj = {
          body: sanitizePayload(req.body),
          params: sanitizePayload(req.params),
          query: sanitizePayload(req.query),
          response: shouldLogFullResponse
            ? sanitizePayload(data)
            : '[RESPONSE_OMITTED]',
        };
      }

      // ── truncate (valid JSON preserved) ──────────────────────────────────
      const details = safeTruncate(detailsObj, MAX_LENGTH);

      // ── persist ──────────────────────────────────────────────────────────
      ActivityLog.create({
        user_id,
        action: `${req.method} ${req.originalUrl}`,
        details,
        ip_address,
        status_code: res.statusCode,
        timestamp: new Date(),
      }).catch(err => console.error('Failed to log activity:', err));
    }

    return originalJson.call(this, data);
  };

  next();
};