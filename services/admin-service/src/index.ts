import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { connectRabbit } from './config/rabbitmq';

const bootstrap = async () => {
  await mongoose.connect(env.MONGO_URI);
  try {
    await connectRabbit(env.RABBITMQ_URL);
  } catch (error) {
    console.warn('admin-service RabbitMQ connection failed; coupon live notifications disabled', error);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`admin-service running on ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error('admin-service failed to start', error);
  process.exit(1);
});
