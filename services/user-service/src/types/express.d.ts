// Express request augmentation — inject user from JWT (forwarded by API Gateway)
import 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email?: string;
      role?: string;
    };
  }
}
