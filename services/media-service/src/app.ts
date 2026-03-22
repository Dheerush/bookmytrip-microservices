import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import type { Express } from 'express';
import { env } from './config/env';
import { globalErrorHandler } from './middleware/error.middleware';
import mediaRoutes from './routes/media.routes';

export const createApp = (): Express => {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, service: 'media-service', timestamp: new Date().toISOString() });
  });

  app.use('/uploads', express.static(path.join(process.cwd(), env.MEDIA_STORAGE_DIR)));
  app.use('/api/media', mediaRoutes);
  app.use(globalErrorHandler);
  return app;
};
