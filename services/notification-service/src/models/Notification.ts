import { Schema, model } from 'mongoose';

export type NotificationAudience = 'user' | 'admin' | 'broadcast';

export interface NotificationDocument {
  _id: string;
  audience: NotificationAudience;
  recipientId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: Date;
  readBy: string[];
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    _id: { type: String, required: true },
    audience: { type: String, enum: ['user', 'admin', 'broadcast'], required: true, index: true },
    recipientId: { type: String, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    createdAt: { type: Date, required: true, index: true },
    readBy: { type: [String], default: [] },
  },
  { versionKey: false },
);

notificationSchema.index({ audience: 1, recipientId: 1, createdAt: -1 });

export const NotificationModel = model<NotificationDocument>('Notification', notificationSchema);
