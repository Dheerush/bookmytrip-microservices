import { connectRabbit } from './config/rabbitmq';
import { startConsumer } from './consumers/notification.consumer';
import { initSocketServer } from './services/socket.service';

const PORT = process.env.PORT;

const bootstrap = async () => {
  await connectRabbit();
  await startConsumer();
  initSocketServer();

  console.log(`🚀 Notification Service Started at ${PORT}`);
};

bootstrap();