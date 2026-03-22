import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Express } from 'express';
import { env } from './config/env';
import aiRoutes from './routes/ai.routes';

export const createApp = (): Express => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '300kb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, service: 'ai-service', timestamp: new Date().toISOString() });
  });

  app.use('/api/ai', aiRoutes);
  return app;
};
