import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => req.headers['x-bypass-ratelimit'] === 'true',
  keyGenerator: (req, res) => {
    const email = req.body?.email?.toLowerCase().trim() || 'unknown';
    return `auth_${ipKeyGenerator(req, res)}_${email}`;
  },
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const controlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  skip: (req) => req.headers['x-bypass-ratelimit'] === 'true',
  keyGenerator: (req, res) => {
    // req.user tersedia karena middleware authenticate() sudah jalan sebelum controlLimiter
    return `control_${req.user?.user_id || ipKeyGenerator(req, res)}`;
  },
  message: {
    success: false,
    message: 'Terlalu banyak perintah kontrol perangkat. Silakan coba lagi dalam beberapa saat.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter umum untuk endpoint API non-sensitif
// [FIX #6] Keying by IP alone blocks an entire campus/office NAT:
// all users behind the same public IP share a single rate-limit bucket.
// Fix: prefer the authenticated user ID (available after authenticate() middleware)
// so each user gets their own bucket. Fall back to IP only for truly unauthenticated
// endpoints (e.g. public health-check) where no user identity exists.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: (req) => req.headers['x-bypass-ratelimit'] === 'true',
  keyGenerator: (req, res) => {
    // Use authenticated user ID when available, otherwise fall back to IP.
    // This prevents a single NAT IP from exhausting the bucket for all campus users.
    if (req.user?.user_id) {
      return `api_user_${req.user.user_id}`;
    }
    return `api_ip_${ipKeyGenerator(req, res)}`;
  },
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});