import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import type { Express } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { env } from './config/env';
import adminRoutes from './routes/admin.routes';
import { AppError } from './shared';

export const createApp = (): Express => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '500kb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, service: 'admin-service', db: mongoose.connection.readyState });
  });

  app.use('/api/admin', adminRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
      return;
    }
    res.status(500).json({ success: false, message: err.message || 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  return app;
};
