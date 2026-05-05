import cors from 'cors';

export const corsMiddleware = cors({
  origin: [
    process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
});
