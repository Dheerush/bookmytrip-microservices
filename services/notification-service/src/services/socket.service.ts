import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  addAdminNotification,
  addBroadcastNotification,
  addUserNotification,
  getAdminSeed,
  getUserSeed,
} from './notification.store';

interface JwtPayload {
  userId?: string;
  id?: string;
  sub?: string;
  role?: string;
}

let io: SocketIOServer | null = null;

/** Rooms are named `user:<userId>` so each user only gets their own events. */
const userRoom = (userId: string) => `user:${userId}`;

export const initSocketServer = (): void => {
  const httpServer = createServer();

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      let payload: JwtPayload | null = null;
      const candidateSecrets = [
        process.env.JWT_ACCESS_SECRET,
        env.JWT_SECRET,
      ].filter((secret): secret is string => Boolean(secret));

      for (const secret of candidateSecrets) {
        try {
          payload = jwt.verify(token, secret) as JwtPayload;
          break;
        } catch {
          // Try next secret for backwards compatibility across environments.
        }
      }

      if (!payload) {
        return next(new Error('Invalid or expired token'));
      }

      const userId = payload.userId || payload.id || payload.sub;
      if (!userId) return next(new Error('Invalid token payload'));
      socket.data.userId = userId;
      socket.data.role = payload.role || 'user';
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const { userId, role } = socket.data as { userId: string; role: string };
    socket.join(userRoom(userId));
    if (role === 'admin') socket.join('admin');

    const seed = role === 'admin' ? await getAdminSeed(userId) : await getUserSeed(userId);
    if (seed.length > 0) {
      socket.emit('notification:seed', seed);
    }

    console.log(`🔔 User ${userId} (${role}) connected to notifications`);

    socket.on('disconnect', () => {
      console.log(`🔕 User ${userId} disconnected from notifications`);
    });
  });

  httpServer.listen(env.SOCKET_PORT, () => {
    console.log(`🔔 Notification socket server listening on port ${env.SOCKET_PORT}`);
  });
};

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  createdAt: string;
}

/**
 * Emit a real-time notification to a specific user.
 * Safe to call even if the user is not currently connected.
 */
export const pushNotificationToUser = async (userId: string, payload: NotificationPayload): Promise<void> => {
  await addUserNotification(userId, payload);
  if (!io) return;
  io.to(userRoom(userId)).emit('notification', payload);
};

/**
 * Emit a real-time notification to all connected admins.
 */
export const pushNotificationToAdmins = async (payload: NotificationPayload): Promise<void> => {
  await addAdminNotification(payload);
  if (!io) return;
  io.to('admin').emit('notification', payload);
};

export const pushNotificationToAllUsers = async (payload: NotificationPayload): Promise<void> => {
  await addBroadcastNotification(payload);
  if (!io) return;
  io.emit('notification', payload);
};
