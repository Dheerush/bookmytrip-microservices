import express, { Express, Request as ExpressRequest } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { globalErrorHandler } from './middleware/error.middleware';
import userRoutes from './routes/user.routes';
import logger from './utils/logger';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');

  // ── Security ─────────────────────────────────────────────────────────────
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-user-id', 'x-user-email', 'x-user-role'],
    exposedHeaders: ['x-request-id'],
  }));

  // ── Body ──────────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '300kb' }));
  app.use(express.urlencoded({ extended: true, limit: '300kb' }));
  app.use(cookieParser());

  // ── Logging ───────────────────────────────────────────────────────────────
  morgan.token('reqId', (req) => (req as ExpressRequest).headers['x-request-id'] as string || '-');
  app.use(morgan(':method :url :status :response-time ms reqId=:reqId', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, service: 'user-service', timestamp: new Date().toISOString() });
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/users', userRoutes);

  // ── Docs ──────────────────────────────────────────────────────────────────
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ── Error handler ─────────────────────────────────────────────────────────
  app.use(globalErrorHandler);

  return app;
};
