import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { bookingRouter } from './routes/booking.routes';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { globalErrorHandler } from './middleware/error.middleware';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Booking service healthy' });
  });

  app.get('/ready', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'Booking service ready' });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/bookings', bookingRouter);

  app.use(globalErrorHandler);

  return app;
};
