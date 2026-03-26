import { createApp } from './app';
import { connectMongoDB, disconnectMongoDB } from './config/db';
import { connectRabbit } from './config/rabbitmq';
import { startAuthEventsConsumer } from './consumers/authEvents.consumer';
import { redisClient } from './config/redis';
import { env } from './config/env';
import logger from './utils/logger';

const bootstrap = async (): Promise<void> => {
  try {
    await connectMongoDB();

    await redisClient.ping();
    logger.info('✅ Redis connected');

    await connectRabbit();
    await startAuthEventsConsumer();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info('User Service started', {
        port: env.PORT,
        env: env.NODE_ENV,
        health: `http://localhost:${env.PORT}/health`,
        docs:   `http://localhost:${env.PORT}/docs`,
      });
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down user-service`);
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
    logger.error('Failed to start user-service', { error });
    process.exit(1);
  }
};

bootstrap();
