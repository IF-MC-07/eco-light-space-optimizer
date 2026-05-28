import rateLimit from 'express-rate-limit';

// Rate limiter khusus untuk endpoint autentikasi (login, register, forgot/reset password)
// Sangat ketat untuk mencegah serangan brute force dan dictionary attack.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 request per IP dalam windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi dari IP ini, silakan coba lagi setelah 15 menit.' // Pesan generik, tidak mengekspos detail sistem
  },
  standardHeaders: true, // Mengembalikan info rate limit di header `RateLimit-*` (RFC 8948)
  legacyHeaders: false, // Menonaktifkan header `X-RateLimit-*` yang sudah usang
});

// Rate limiter untuk endpoint kontrol relay/device (seperti toggle AC dan lampu)
// Sedikit lebih longgar dari auth, tapi cukup ketat untuk mencegah spamming command ke IoT hardware.
export const controlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 30, // Maksimal 30 request per IP dalam 1 menit
  message: {
    success: false,
    message: 'Terlalu banyak perintah kontrol perangkat dari IP ini, silakan coba lagi dalam beberapa saat.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter umum untuk endpoint API lainnya (non-sensitif)
// Dibuat lebih longgar agar tidak mengganggu operasional normal aplikasi web.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200, // Maksimal 200 request per IP
  message: {
    success: false,
    message: 'Terlalu banyak request dari IP ini, silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
