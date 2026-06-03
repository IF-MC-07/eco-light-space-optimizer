import db from '../models/index.js';

const { ActivityLog } = db;

// ─── Module-level constants (parsed once on startup, not per-request) ─────────

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

const FULL_RESPONSE_ROUTES = process.env.LOG_FULL_RESPONSE_ROUTES
  ? process.env.LOG_FULL_RESPONSE_ROUTES.split(',').map(s => s.trim()).filter(Boolean)
  : ['/api/auth/login'];

const MAX_LENGTH = parseInt(process.env.LOG_MAX_LENGTH, 50) || 51200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const base64Regex = /^data:[a-z]+\/[a-z]+;base64,/i;

const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;

  const sanitized = Array.isArray(payload) ? [...payload] : { ...payload };

  for (const key in sanitized) {
    if (!Object.prototype.hasOwnProperty.call(sanitized, key)) continue;

    const value = sanitized[key];

    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && base64Regex.test(value)) {
      sanitized[key] = '[BASE64_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    }
  }

  return sanitized;
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
 */
const safeTruncate = (detailsObj, maxLength) => {
  const full = JSON.stringify(detailsObj);
  if (full.length <= maxLength) return full;

  const truncated = JSON.stringify({
    ...detailsObj,
    body: '[OMITTED_OVERFLOW]',
    _truncated: true,
  });

  // If even the truncated version is somehow still too large, hard-cap as last resort
  // and mark it explicitly as non-JSON so consumers don't try to parse it.
  if (truncated.length > maxLength) {
    return truncated.substring(0, maxLength - 20) + '"_overflow":true}';
  }

  return truncated;
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
      const detailsObj = {
        body: sanitizePayload(req.body),
        params: sanitizePayload(req.params),
        query: sanitizePayload(req.query),
      };

      const shouldLogFullResponse = FULL_RESPONSE_ROUTES.some(
        route => matchesRoute(req.originalUrl, route)
      );

      detailsObj.response = shouldLogFullResponse
        ? sanitizePayload(data)
        : '[RESPONSE_OMITTED]';

      if (isLoginRoute && !isSuccess) {
        detailsObj.note = 'Failed login attempt';
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