import { createServer } from 'http';
import { connectDB } from './config/db';
import { createApp } from './app';
import { connectRabbit } from './config/rabbitmq';
import { startConsumer } from './consumers/notification.consumer';
import { initSocketServer } from './services/socket.service';

const PORT = process.env.PORT;

const bootstrap = async () => {
  await connectDB();
  await connectRabbit();
  const app = createApp();
  const server = createServer(app);
  server.listen(PORT, () => {
    console.log(`HTTP Notification API listening on ${PORT}`);
  });
  await startConsumer();
  initSocketServer();

  console.log(`🚀 Notification Service Started at ${PORT}`);
};

bootstrap();