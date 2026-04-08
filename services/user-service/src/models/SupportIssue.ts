import { Document, Schema, model } from 'mongoose';

export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

interface IssueMessage {
  by: 'user' | 'admin';
  text: string;
  createdAt: Date;
}

export interface ISupportIssue extends Document {
  userId: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  description: string;
  bookingRef?: string;
  status: IssueStatus;
  issueRef: string;
  messages: IssueMessage[];
  adminNote?: string;
  reopenedCount: number;
}

const messageSchema = new Schema<IssueMessage>(
  {
    by: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const supportIssueSchema = new Schema<ISupportIssue>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String },
    userName: { type: String },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bookingRef: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    issueRef: { type: String, required: true, unique: true, index: true },
    messages: { type: [messageSchema], default: [] },
    adminNote: { type: String },
    reopenedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const SupportIssue = model<ISupportIssue>('SupportIssue', supportIssueSchema);
