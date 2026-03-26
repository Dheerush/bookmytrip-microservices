import { ConsumeMessage } from 'amqplib';
import { getChannel } from '../config/rabbitmq';
import { profileService } from '../services/profile.service';
import logger from '../utils/logger';

type VerifiedEvent = {
  type: 'USER_VERIFIED';
  data?: {
    userId?: string;
    email?: string;
    fullName?: string;
    role?: string;
  };
};

const QUEUE_NAME = 'user_profile_events';

export const startAuthEventsConsumer = async (): Promise<void> => {
  const channel = getChannel();

  await channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString()) as VerifiedEvent;

      if (event.type === 'USER_VERIFIED') {
        const userId = event.data?.userId;
        const email = event.data?.email;
        const fullName = event.data?.fullName;

        if (userId && email && fullName) {
          await profileService.provisionFromVerifiedUser({
            authId: userId,
            email,
            fullName,
            role: event.data?.role,
          });
        } else {
          logger.warn('Skipping USER_VERIFIED event with missing required fields', { event });
        }
      }

      channel.ack(msg);
    } catch (error) {
      logger.error('Failed processing user_profile_events message', { error });
      channel.nack(msg, false, false);
    }
  });

  logger.info('✅ user_profile_events consumer started');
};
