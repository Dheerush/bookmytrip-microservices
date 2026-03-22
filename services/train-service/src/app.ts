import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request as ExpressRequest } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { globalErrorHandler } from './middleware/error.middleware';
import trainRoutes from './routes/train.routes';
import logger from './utils/logger';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-user-id', 'x-user-email', 'x-user-role'],
    exposedHeaders: ['x-request-id'],
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  morgan.token('reqId', (req) => ((req as ExpressRequest).headers['x-request-id'] as string) || '-');
  app.use(morgan(':method :url :status :response-time ms reqId=:reqId', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, service: 'train-service', timestamp: new Date().toISOString() });
  });

  app.use('/api/trains', trainRoutes);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(globalErrorHandler);

  return app;
};
