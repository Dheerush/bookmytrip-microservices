import { createServer } from 'http';
import { createApp } from './app';
import { connectMongoDB, disconnectMongoDB } from './config/db';
import { env } from './config/env';
import { connectRedis, disconnectRedis } from './config/redis';
import { connectRabbit, disconnectRabbit } from './config/rabbitmq';
import logger from './utils/logger';

const bootstrap = async () => {
  await connectMongoDB();
  await connectRedis();
  await connectRabbit();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`Booking service listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down booking service`);

    server.close(async () => {
      await Promise.allSettled([
        disconnectMongoDB(),
        disconnectRedis(),
        disconnectRabbit(),
      ]);
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

void bootstrap().catch((error) => {
  logger.error('Failed to bootstrap booking service', { message: error.message, stack: error.stack });
  process.exit(1);
});
