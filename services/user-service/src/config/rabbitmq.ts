import amqp, { Channel } from 'amqplib';
import { env } from './env';

let channel: Channel;

export const connectRabbit = async (): Promise<void> => {
  const connection = await amqp.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue('notification_events', { durable: true });
  await channel.assertQueue('user_profile_events', { durable: true });
  console.log('✅ RabbitMQ connected (user-service)');
};

export const getChannel = (): Channel => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
};

export const publishEvent = async (event: object): Promise<void> => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  channel.sendToQueue(
    'notification_events',
    Buffer.from(JSON.stringify(event)),
    { persistent: true },
  );
};
