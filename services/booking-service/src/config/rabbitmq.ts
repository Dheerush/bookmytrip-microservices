import amqplib, { Channel, ChannelModel } from 'amqplib';
import { env } from './env';
import logger from '../utils/logger';

let channel: Channel | null = null;
let connection: ChannelModel | null = null;

export const connectRabbit = async (): Promise<void> => {
  connection = await amqplib.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue('notification_events', { durable: true });
  logger.info('RabbitMQ connected (booking-service)');
};

export const disconnectRabbit = async (): Promise<void> => {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
  logger.info('RabbitMQ disconnected (booking-service)');
};

export const publishEvent = (event: string, payload: Record<string, unknown>): void => {
  if (!channel) {
    logger.warn('RabbitMQ channel not ready', { event });
    return;
  }

  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  channel.sendToQueue('notification_events', Buffer.from(message), { persistent: true });
};
