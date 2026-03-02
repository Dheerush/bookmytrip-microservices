export type NotificationType =
  | 'SEND_OTP'
  | 'LOGIN_ALERT'
  | 'FLIGHT_BOOKED'
  | 'SUPPORT_RAISED';

export interface NotificationEvent {
  type: NotificationType;
  data: any;
}