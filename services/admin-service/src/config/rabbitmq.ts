import amqp, { Channel } from 'amqplib';

let channel: Channel | null = null;

export const connectRabbit = async (url: string): Promise<void> => {
  const connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue('notification_events', { durable: true });
  console.log('admin-service connected to RabbitMQ');
};

export const publishEvent = async (event: { type: string; data: Record<string, unknown> }): Promise<void> => {
  if (!channel) {
    console.warn('RabbitMQ channel unavailable in admin-service; event skipped:', event.type);
    return;
  }

  channel.sendToQueue('notification_events', Buffer.from(JSON.stringify(event)), {
    persistent: true,
  });
};
