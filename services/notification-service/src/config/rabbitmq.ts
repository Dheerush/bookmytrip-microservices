import amqp, { Channel } from 'amqplib';
import { env } from './env';

let channel: Channel;

export const connectRabbit = async (): Promise<void> => {
  const connection = await amqp.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertQueue('notification_events', { durable: true });

  console.log('✅ RabbitMQ connected (notification)');
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};