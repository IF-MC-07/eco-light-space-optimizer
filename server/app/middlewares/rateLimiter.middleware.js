import rateLimit from 'express-rate-limit';

// Rate limiter khusus untuk endpoint autentikasi (login, register, forgot/reset password)
// Key: kombinasi IP + email — mencegah satu user di jaringan bersama (NAT kampus)
// memblokir user lain yang berbagi IP yang sama.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase().trim() || 'unknown';
    return `auth_${req.ip}_${email}`;
  },
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // PENTING: skip apiLimiter global tidak berlaku di sini karena
  // authLimiter dipasang langsung di route, bukan via router.use()
  // Pastikan di index.js route /auth TIDAK kena apiLimiter — lihat catatan di bawah
});

// Rate limiter untuk endpoint kontrol relay/device
// Key: berbasis user ID dari JWT (di-decode middleware auth sebelumnya)
// Admin A yang spam tidak akan memblokir Admin B meski berada di jaringan yang sama.
export const controlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    // req.user tersedia karena middleware authenticate() sudah jalan sebelum controlLimiter
    return `control_${req.user?.id || req.ip}`;
  },
  message: {
    success: false,
    message: 'Terlalu banyak perintah kontrol perangkat. Silakan coba lagi dalam beberapa saat.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter umum untuk endpoint API non-sensitif
// Key: IP saja — acceptable untuk endpoint yang tidak kritis
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => `api_${req.ip}`,
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});