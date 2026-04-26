export type NotificationType =
  | 'SEND_OTP'
  | 'USER_SIGNUP'
  | 'USER_VERIFIED'
  | 'LOGIN_SUCCESS'
  | 'PASSWORD_CHANGED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'REFUND_PROCESSED'
  | 'COMPLAINT_RAISED'
  | 'COMPLAINT_STATUS_UPDATED'
  | 'COMPLAINT_REOPENED'
  | 'SUPPORT_RAISED'
  | 'NEWSLETTER_SUBSCRIPTION'
  | 'COUPON_CREATED';

export interface NotificationEvent {
  type: NotificationType;
  data: any;
}