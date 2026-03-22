import { createApp } from './app';
import { connectMongoDB, disconnectMongoDB } from './config/db';
import { connectRabbit } from './config/rabbitmq';
import { redisClient } from './config/redis';
import { env } from './config/env';
import logger from './utils/logger';

const bootstrap = async (): Promise<void> => {
  try {
    await connectMongoDB();

    await redisClient.ping();
    logger.info('✅ Redis connected');

    await connectRabbit();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info('Flight Service started', {
        port: env.PORT,
        env:    env.NODE_ENV,
        health: `http://localhost:${env.PORT}/health`,
        docs:   `http://localhost:${env.PORT}/docs`,
        search: `http://localhost:${env.PORT}/api/flights/search?from=DEL&to=BOM&date=2026-04-01`,
      });
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down flight-service`);
      server.close(async () => {
        await disconnectMongoDB();
        logger.info('Shutdown complete');
        process.exit(0);
      });
      setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 10_000);
    };

    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    logger.error('Failed to start flight-service', { error });
    process.exit(1);
  }
};

bootstrap();
