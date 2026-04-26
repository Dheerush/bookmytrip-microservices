import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import type { Express, NextFunction, Request, Response } from 'express';
import { env } from './config/env';
import notificationRoutes from './routes/notification.routes';

export const createApp = (): Express => {
  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '300kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, service: 'notification-service', db: mongoose.connection.readyState });
  });

  app.use('/api/notifications', notificationRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, message: err.message || 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  return app;
};
