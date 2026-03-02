import { ConsumeMessage } from 'amqplib';
import { getChannel } from '../config/rabbitmq';
import { sendEmail } from '../services/email.services';
import { otpTemplate } from '../templates/otp.template';
import { welcomeTemplate } from '../templates/welcome.template';
import { loginTemplate } from '../templates/login.template';

export const startConsumer = async (): Promise<void> => {
  const channel = getChannel();

  await channel.consume(
    'notification_events',
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());

        console.log('📨 Received event:', event);

        switch (event.type) {
          case 'SEND_OTP': {
            const { email, otp } = event.data;

            if (!email || !otp) {
              throw new Error('Invalid OTP event payload');
            }

            await sendEmail(
              email,
              'BookMyTrip: OTP Verification',
              otpTemplate(otp)
            );

            console.log(`✅ OTP email sent to ${email}`);
            break;
          }
          case 'USER_VERIFIED': {
            const { email } = event.data;

            if (!email) {
              throw new Error('Invalid USER_VERIFIED payload');
            }

            await sendEmail(
              email,
              'Welcome to BookMyTrip 🎉',
              welcomeTemplate(email)
            );

            console.log(`✅ Welcome email sent to ${email}`);
            break;
          }
          case 'LOGIN_SUCCESS': {
            const { email, loginTime, ip, userAgent } = event.data;

            if (!email) {
              throw new Error('Invalid LOGIN_SUCCESS payload');
            }

            await sendEmail(
              email,
              'BookMyTrip: Login Alert 🔐',
              loginTemplate(email, loginTime, ip, userAgent)
            );

            console.log(`✅ Login alert email sent to ${email}`);
            break;
          }

          default:
            console.log('⚠️ Unknown event type:', event.type);
        }

        channel.ack(msg);
      } catch (error) {
        console.error('❌ Notification processing failed:', error);
        channel.nack(msg, false, false);
      }
    }
  );

  console.log('📨 Listening for notification events...');
};