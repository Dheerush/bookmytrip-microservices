import amqp, { Channel } from 'amqplib';
import { env } from './env';

let channel: Channel;

export const connectRabbit = async (): Promise<void> => {
  const connection = await amqp.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Use ONLY ONE queue name
  await channel.assertQueue('notification_events', { durable: true });

  console.log('✅ RabbitMQ connected (auth)');
};

export const publishEvent = async (event: any): Promise<void> => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  channel.sendToQueue(
    'notification_events',
    Buffer.from(JSON.stringify(event)),
    { persistent: true }
  );
};