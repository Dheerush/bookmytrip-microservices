import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';

const bootstrap = async () => {
  await mongoose.connect(env.MONGO_URI);
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`review-service running on ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error('review-service failed to start', error);
  process.exit(1);
});
