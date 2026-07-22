import express from 'express';
import cookieParser from 'cookie-parser';

import routes from './routes/index.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { activityLogger } from './middlewares/activityLogger.middleware.js';

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
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