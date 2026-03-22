import { connectRabbit } from './config/rabbitmq';
import { startConsumer } from './consumers/notification.consumer';

const PORT = process.env.PORT;

const bootstrap = async () => {
  await connectRabbit();
  await startConsumer();

  console.log(`🚀 Notification Service Started at ${PORT}`);
};

bootstrap();