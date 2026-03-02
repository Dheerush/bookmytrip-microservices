import { createApp } from './app';
import { connectMongoDB, disconnectMongoDB } from './config/db';
import { connectRabbit } from './config/rabbitmq';   // 👈 ADD THIS
import { env } from './config/env';
import { redisClient } from './config/redis';

const bootstrap = async (): Promise<void> => {
  try {
    // 1️⃣ Connect MongoDB
    await connectMongoDB();

    // 2️⃣ Connect Redis
    await redisClient.ping();
    console.log('✅ Redis connected');

    // 3️⃣ Connect RabbitMQ  👈 ADD THIS
    await connectRabbit();

    // 4️⃣ Create express app
    const app = createApp();

    // 5️⃣ Start server
    const server = app.listen(env.PORT, () => {
      console.log('╔══════════════════════════════════════╗');
      console.log(`🚀 Auth Service started`);
      console.log(`📍 Port   : http://localhost:${env.PORT}`);
      console.log(`❤️  Health : http://localhost:${env.PORT}/health`);
      console.log(`🌍 Env    : ${env.NODE_ENV}`);
      console.log('╚══════════════════════════════════════╝');
    });

    // 6️⃣ Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Shutting down...`);

      server.close(async () => {
        await disconnectMongoDB();
        console.log('✅ Shutdown complete');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('❌ Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start auth-service:', error);
    process.exit(1);
  }
};

bootstrap();