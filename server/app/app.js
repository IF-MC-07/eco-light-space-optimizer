import express from 'express';
import routes from './routes/index.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { activityLogger } from './middlewares/activityLogger.middleware.js';

import cookieParser from 'cookie-parser';

const app = express();

// Konfigurasi khusus Production: Redirect HTTP ke HTTPS jika diakses via HTTP
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Wajib di-set jika di belakang reverse proxy (Nginx)
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(activityLogger);

app.use('/api', routes);

app.use(errorHandler);

export default app;
