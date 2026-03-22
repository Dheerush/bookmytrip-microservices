import amqplib, { Channel } from 'amqplib';
import { env } from './env';
import logger from '../utils/logger';

let channel: Channel | null = null;

export const connectRabbit = async (): Promise<void> => {
  const conn = await amqplib.connect(env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertQueue('notification_events', { durable: true });
  logger.info('RabbitMQ connected (train-service)');
};

export const publishEvent = (event: string, payload: Record<string, unknown>): void => {
  if (!channel) {
    logger.warn('RabbitMQ channel not ready', { event });
    return;
  }

  const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  channel.sendToQueue('notification_events', Buffer.from(message), { persistent: true });
};
