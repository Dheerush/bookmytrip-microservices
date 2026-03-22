import { createApp } from './app';
import { env } from './config/env';
import logger from './utils/logger';

const bootstrap = async (): Promise<void> => {
  try {
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      logger.info('Search Service started', {
        port: env.PORT,
        env: env.NODE_ENV,
        health: `http://localhost:${env.PORT}/health`,
        docs: `http://localhost:${env.PORT}/docs`,
        aggregate: `http://localhost:${env.PORT}/api/search/aggregate?from=DEL&to=BOM&date=2026-04-01&city=Mumbai&checkIn=2026-04-01&checkOut=2026-04-03&cabCity=Delhi&distanceKm=12`,
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`${signal} received - shutting down search-service`);
      server.close(() => {
        logger.info('Shutdown complete');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start search-service', { error });
    process.exit(1);
  }
};

bootstrap();
