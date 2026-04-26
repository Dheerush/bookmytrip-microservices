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
import { pushNotificationToAdmins, pushNotificationToAllUsers, pushNotificationToUser } from '../services/socket.service';

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
          type: payload.type,
          contact: payload.contact,
          passengers: payload.passengers,
          startDate: payload.startDate,
          endDate: payload.endDate,
          scheduleTime: payload.scheduleTime,
          fromCode: payload.fromCode,
          toCode: payload.toCode,
          seatClass: payload.seatClass,
          berthPreference: payload.berthPreference,
          boardingTerminal: payload.boardingTerminal,
          boardingAirport: payload.boardingAirport,
          destinationAirport: payload.destinationAirport,
          platformNumber: payload.platformNumber,
          trainFromStationName: payload.trainFromStationName,
          trainFromStationCode: payload.trainFromStationCode,
          trainToStationName: payload.trainToStationName,
          trainToStationCode: payload.trainToStationCode,
          currentLocation: payload.currentLocation,
          destinationCity: payload.destinationCity,
          packageTravelMode: payload.packageTravelMode,
          packageTravelOptionLabel: payload.packageTravelOptionLabel,
          packageTravelOptionMeta: payload.packageTravelOptionMeta,
          cabPickup: payload.cabPickup,
          cabDrop: payload.cabDrop,
          cabPickupCity: payload.cabPickupCity,
          cabDropCity: payload.cabDropCity,
          cabDistanceKm: payload.cabDistanceKm,
          cabDriverName: payload.cabDriverName,
          cabDriverPhone: payload.cabDriverPhone,
          cabNumber: payload.cabNumber,
          hotelAddress: payload.hotelAddress,
          hotelRoomType: payload.hotelRoomType,
          hotelRoomNumber: payload.hotelRoomNumber,
          hotelCheckInTime: payload.hotelCheckInTime,
          hotelCheckOutTime: payload.hotelCheckOutTime,
          hotelNights: payload.hotelNights,
          hotelRoomsBooked: payload.hotelRoomsBooked,
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
            const { email, userId, bookingRef, title, amount, type, contact, passengers, startDate, endDate, scheduleTime, fromCode, toCode, seatClass, berthPreference, boardingTerminal, boardingAirport, destinationAirport, platformNumber, trainFromStationName, trainFromStationCode, trainToStationName, trainToStationCode, currentLocation, destinationCity, packageTravelMode, packageTravelOptionLabel, packageTravelOptionMeta, cabPickup, cabDrop, cabPickupCity, cabDropCity, cabDistanceKm, cabDriverName, cabDriverPhone, cabNumber, hotelAddress, hotelRoomType, hotelRoomNumber, hotelCheckInTime, hotelCheckOutTime, hotelNights, hotelRoomsBooked } = event.data;
            if (email) {
              await sendEmail(
                email,
                'BookMyTrip: Booking Confirmed - ' + bookingRef,
                bookingTemplate({
                  bookingRef,
                  title,
                  status: 'confirmed',
                  amount,
                  type,
                  contact,
                  passengers,
                  startDate,
                  endDate,
                  scheduleTime,
                  fromCode,
                  toCode,
                  seatClass,
                  berthPreference,
                  boardingTerminal,
                  boardingAirport,
                  destinationAirport,
                  platformNumber,
                  trainFromStationName,
                  trainFromStationCode,
                  trainToStationName,
                  trainToStationCode,
                  currentLocation,
                  destinationCity,
                  packageTravelMode,
                  packageTravelDetails: [packageTravelOptionLabel, packageTravelOptionMeta].filter(Boolean).join(' • '),
                  cabPickup,
                  cabDrop,
                  cabPickupCity,
                  cabDropCity,
                  cabDistanceKm,
                  cabDriverName,
                  cabDriverPhone,
                  cabNumber,
                  hotelAddress,
                  hotelRoomType,
                  hotelRoomNumber,
                  hotelCheckInTime,
                  hotelCheckOutTime,
                  hotelNights,
                  hotelRoomsBooked,
                }),
              );
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
          case 'COMPLAINT_STATUS_UPDATED': {
            const { userId, ticketId, subject, status, adminNote } = event.data;
            const statusLabel = String(status || 'updated').replace('-', ' ');
            push(
              userId,
              'support',
              `Complaint ${statusLabel}`,
              `Your complaint (#${ticketId}) is now ${statusLabel}.${adminNote ? ` Note: ${adminNote}` : ''}`,
              '/dashboard/issues',
            );
            pushAdmin('support', `Complaint Updated: #${ticketId}`, `${subject || 'Complaint'} marked ${statusLabel}.`, '/dashboard/issues');
            break;
          }
          case 'COMPLAINT_REOPENED': {
            const { userId, ticketId, subject, comment } = event.data;
            push(
              userId,
              'support',
              'Complaint Reopened',
              `Your complaint (#${ticketId}) has been reopened successfully.`,
              '/dashboard/issues',
            );
            pushAdmin(
              'support',
              `Complaint Reopened: #${ticketId}`,
              `${subject || 'Complaint'} reopened by user.${comment ? ` Comment: ${comment}` : ''}`,
              '/dashboard/issues',
            );
            break;
          }
          case 'NEWSLETTER_SUBSCRIPTION': {
            const { email } = event.data;
            if (email) {
              await sendEmail(email, 'BookMyTrip: Subscribed to Newsletter!', newsletterTemplate(email));
            }
            break;
          }
          case 'COUPON_CREATED': {
            const { code, description, discountType, discountValue } = event.data;
            const couponCode = String(code || '').trim();
            if (!couponCode) break;

            const discountLabel = discountType === 'percent'
              ? `${Number(discountValue || 0)}% off`
              : `INR ${Number(discountValue || 0).toLocaleString('en-IN')} off`;

            pushNotificationToAllUsers({
              id: randomUUID(),
              type: 'offers',
              title: `New coupon: ${couponCode}`,
              message: `${discountLabel}${description ? ` • ${description}` : ''}`,
              link: '/dashboard/notifications',
              createdAt: new Date().toISOString(),
            });

            pushAdmin(
              'offers',
              `Coupon Published: ${couponCode}`,
              `Coupon ${couponCode} is now live for users.`,
              '/dashboard/admin/coupons',
            );
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
