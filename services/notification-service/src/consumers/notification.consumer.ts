import { ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';
import { getChannel } from '../config/rabbitmq';
import { env } from '../config/env';
import { sendEmail } from '../services/email.services';
import { otpTemplate } from '../templates/otp.template';
import { welcomeTemplate } from '../templates/welcome.template';
import { loginTemplate } from '../templates/login.template';
import { bookingTemplate } from '../templates/booking.template';
import { passwordResetSuccessTemplate } from '../templates/passwordResetSuccess.template';
import { supportTemplate } from '../templates/support.template';
import { newsletterTemplate } from '../templates/newsletter.template';
import { adminComplaintTemplate } from '../templates/adminComplaint.template';
import { pushNotificationToAdmins, pushNotificationToUser } from '../services/socket.service';

const push = (userId: string, type: string, title: string, message: string, link?: string) => {
  if (!userId) return;
  pushNotificationToUser(userId, {
    id: randomUUID(),
    type,
    title,
    message,
    link,
    createdAt: new Date().toISOString(),
  });
};

const pushAdmin = (type: string, title: string, message: string, link?: string) => {
  pushNotificationToAdmins({
    id: randomUUID(),
    type,
    title,
    message,
    link,
    createdAt: new Date().toISOString(),
  });
};

const normalizeEvent = (raw: any): { type: string; data: Record<string, any> } => {
  if (raw?.type) return { type: String(raw.type), data: raw.data || {} };

  const payload = raw?.payload || {};
  switch (raw?.event) {
    case 'booking.created':
      return {
        type: 'BOOKING_CONFIRMED',
        data: {
          userId: payload.userId,
          bookingRef: payload.bookingRef,
          title: payload.title,
          amount: payload.amount,
          email: payload.email,
        },
      };
    case 'booking.cancelled':
      return {
        type: 'BOOKING_CANCELLED',
        data: {
          userId: payload.userId,
          bookingRef: payload.bookingRef,
          title: payload.title || 'Booking',
          email: payload.email,
        },
      };
    case 'payment.refunded':
      return {
        type: 'REFUND_PROCESSED',
        data: {
          userId: payload.userId,
          bookingRef: payload.bookingRef,
          refundAmount: payload.amount,
        },
      };
    default:
      return { type: String(raw?.event || 'UNKNOWN'), data: payload };
  }
};

export const startConsumer = async (): Promise<void> => {
  const channel = getChannel();

  await channel.consume(
    'notification_events',
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const event = normalizeEvent(JSON.parse(msg.content.toString()));
        console.log('NOTIF received:', event.type);

        switch (event.type) {
          case 'SEND_OTP': {
            const { email, otp } = event.data;
            if (!email || !otp) throw new Error('Invalid OTP payload');
            await sendEmail(email, 'BookMyTrip: OTP Verification', otpTemplate(otp));
            break;
          }
          case 'USER_VERIFIED':
          case 'USER_SIGNUP': {
            const { email, userId } = event.data;
            if (!email) throw new Error('Invalid USER_VERIFIED payload');
            await sendEmail(email, 'Welcome to BookMyTrip!', welcomeTemplate(email));
            push(userId, 'signup', 'Welcome to BookMyTrip!', 'Your account is ready. Start exploring!', '/dashboard');
            break;
          }
          case 'LOGIN_SUCCESS': {
            const { email, userId, loginTime, ip, userAgent } = event.data;
            if (!email) throw new Error('Invalid LOGIN_SUCCESS payload');
            await sendEmail(email, 'BookMyTrip: Login Alert', loginTemplate(email, loginTime, ip, userAgent));
            push(userId, 'login', 'New Login Detected', 'Your account was accessed' + (ip ? ' from ' + ip : '') + '.', '/dashboard/profile');
            break;
          }
          case 'PASSWORD_CHANGED': {
            const { email, userId } = event.data;
            if (!email) throw new Error('Invalid PASSWORD_CHANGED payload');
            await sendEmail(email, 'BookMyTrip: Password Changed', passwordResetSuccessTemplate(email));
            push(userId, 'security', 'Password Changed', 'Your account password was updated successfully.', '/dashboard/profile');
            break;
          }
          case 'BOOKING_CONFIRMED': {
            const { email, userId, bookingRef, title, amount } = event.data;
            if (email) {
              await sendEmail(email, 'BookMyTrip: Booking Confirmed - ' + bookingRef, bookingTemplate({ bookingRef, title, status: 'confirmed', amount }));
            }
            push(userId, 'booking', 'Booking Confirmed!', title + ' - Rs.' + Number(amount).toLocaleString('en-IN') + '. Ref: ' + bookingRef, '/dashboard/bookings');
            break;
          }
          case 'BOOKING_CANCELLED': {
            const { email, userId, bookingRef, title, refundAmount } = event.data;
            if (email) {
              await sendEmail(email, 'BookMyTrip: Booking Cancelled - ' + bookingRef, bookingTemplate({ bookingRef, title, status: 'cancelled', amount: 0 }));
            }
            const refundMsg = refundAmount > 0 ? 'Refund of Rs.' + Number(refundAmount).toLocaleString('en-IN') + ' will be processed in 5-7 days.' : 'No refund applicable.';
            push(userId, 'cancellation', 'Booking Cancelled', title + ' cancelled. ' + refundMsg, '/dashboard/bookings');
            break;
          }
          case 'REFUND_PROCESSED': {
            const { userId, bookingRef, refundAmount } = event.data;
            push(userId, 'refund', 'Refund Processed', 'Rs.' + Number(refundAmount).toLocaleString('en-IN') + ' refund for booking ' + bookingRef + ' has been initiated.', '/dashboard/bookings');
            break;
          }
          case 'COMPLAINT_RAISED':
          case 'SUPPORT_RAISED': {
            const { email, userId, ticketId, subject, userName, description } = event.data;
            if (email) {
              await sendEmail(email, 'BookMyTrip: Support Ticket Received - #' + ticketId, supportTemplate(email, ticketId, subject));
            }
            if (env.ADMIN_EMAIL) {
              await sendEmail(
                env.ADMIN_EMAIL,
                'BookMyTrip Admin: New Support Ticket #' + ticketId,
                adminComplaintTemplate({
                  ticketId,
                  subject,
                  raisedBy: userName || email || 'Unknown',
                  userEmail: email || 'N/A',
                  description,
                }),
              );
            }
            push(userId, 'support', 'Support Ticket Update', 'Your complaint (#' + ticketId + ') has been updated.', '/dashboard/issues');
            pushAdmin('support', 'New Complaint: #' + ticketId, (userName || email || 'User') + ' raised: ' + subject, '/dashboard/admin/requests');
            break;
          }
          case 'NEWSLETTER_SUBSCRIPTION': {
            const { email } = event.data;
            if (email) {
              await sendEmail(email, 'BookMyTrip: Subscribed to Newsletter!', newsletterTemplate(email));
            }
            break;
          }
          default:
            console.log('Unknown event type:', event.type);
        }

        channel.ack(msg);
      } catch (error) {
        console.error('Notification processing failed:', error);
        channel.nack(msg, false, false);
      }
    }
  );

  console.log('Listening for notification events...');
};
