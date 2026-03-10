import express, { Express } from 'express';
import authRoutes from './routes/auth.routes';
import { globalErrorHandler } from './middleware/error.middleware';
import cookieParser from 'cookie-parser';
// import cookieParser from 'cookie-parser';

// NOTE: We can import {Application} from 'express' and use that instead of Express
export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(express.json());

  // CORS setup for frontend
  const cors = require('cors');
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  app.use(cookieParser()); // Add cookie-parser middleware to parse cookies

  // Health route
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    });
  });
  // Routes
  app.use('/api/auth', authRoutes);
  app.use(globalErrorHandler);

  return app;
};