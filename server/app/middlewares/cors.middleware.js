import cors from 'cors';

export const corsMiddleware = cors({
  origin: true,                    // Izinkan semua origin (development)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
});