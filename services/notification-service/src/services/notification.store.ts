import type { NotificationPayload } from './socket.service';
import { NotificationModel } from '../models/Notification';

const MAX_ITEMS_PER_FEED = 120;

interface NotificationRecord {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: Date | string;
  readBy: string[];
}

type ActorRole = 'admin' | 'user';

const getActorKey = (userId: string, role: string): string => {
  return role === 'admin' ? `admin:${userId}` : userId;
};

const toViewModel = (item: {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: Date;
  readBy: string[];
}, actorKey: string): NotificationPayload & { read: boolean } => ({
  id: item._id,
  type: item.type,
  title: item.title,
  message: item.message,
  link: item.link,
  createdAt: item.createdAt.toISOString(),
  read: item.readBy.includes(actorKey),
});

const sortByCreatedAtDesc = (items: NotificationPayload[]): NotificationPayload[] => {
  return [...items].sort((a, b) => {
    const left = new Date(a.createdAt).getTime();
    const right = new Date(b.createdAt).getTime();
    return right - left;
  });
};

const persistNotification = async (
  audience: 'user' | 'admin' | 'broadcast',
  payload: NotificationPayload,
  recipientId?: string,
): Promise<void> => {
  await NotificationModel.findByIdAndUpdate(
    payload.id,
    {
      $set: {
        _id: payload.id,
        audience,
        recipientId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        createdAt: new Date(payload.createdAt),
      },
      $setOnInsert: { readBy: [] },
    },
    { upsert: true },
  );
};

const buildFilter = (userId: string, role: string, type?: string) => {
  const orFilter = role === 'admin'
    ? [{ audience: 'admin' }, { audience: 'broadcast' }]
    : [{ audience: 'user', recipientId: userId }, { audience: 'broadcast' }];

  return {
    $or: orFilter,
    ...(type ? { type } : {}),
  };
};

export const addUserNotification = async (userId: string, payload: NotificationPayload): Promise<void> => {
  if (!userId) return;
  await persistNotification('user', payload, userId);
};

export const addAdminNotification = async (payload: NotificationPayload): Promise<void> => {
  await persistNotification('admin', payload);
};

export const addBroadcastNotification = async (payload: NotificationPayload): Promise<void> => {
  await persistNotification('broadcast', payload);
};

export const getUserSeed = async (userId: string): Promise<NotificationPayload[]> => {
  const items = await NotificationModel.find(buildFilter(userId, 'user'))
    .sort({ createdAt: -1 })
    .limit(MAX_ITEMS_PER_FEED)
    .lean();

  return sortByCreatedAtDesc(items.map((item: NotificationRecord) => ({
    id: item._id,
    type: item.type,
    title: item.title,
    message: item.message,
    link: item.link,
    createdAt: new Date(item.createdAt).toISOString(),
  })));
};

export const getAdminSeed = async (): Promise<NotificationPayload[]> => {
  const items = await NotificationModel.find(buildFilter('', 'admin'))
    .sort({ createdAt: -1 })
    .limit(MAX_ITEMS_PER_FEED)
    .lean();

  return sortByCreatedAtDesc(items.map((item: NotificationRecord) => ({
    id: item._id,
    type: item.type,
    title: item.title,
    message: item.message,
    link: item.link,
    createdAt: new Date(item.createdAt).toISOString(),
  })));
};

export const listNotificationsForActor = async (
  userId: string,
  role: string,
  options: { page: number; limit: number; type?: string },
) => {
  const actorKey = getActorKey(userId, role);
  const filter = buildFilter(userId, role, options.type);
  const skip = (options.page - 1) * options.limit;

  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit).lean(),
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments({ ...filter, readBy: { $ne: actorKey } }),
  ]);

  return {
    items: items.map((item: NotificationRecord) => toViewModel({
      ...item,
      createdAt: new Date(item.createdAt),
    }, actorKey)),
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.max(1, Math.ceil(total / options.limit)),
    unreadCount,
  };
};

export const markNotificationRead = async (userId: string, role: string, notificationId: string) => {
  const actorKey = getActorKey(userId, role);
  await NotificationModel.findByIdAndUpdate(notificationId, {
    $addToSet: { readBy: actorKey },
  });

  const item = await NotificationModel.findById(notificationId).lean();
  return item ? toViewModel({ ...(item as NotificationRecord), createdAt: new Date((item as NotificationRecord).createdAt) }, actorKey) : null;
};

export const markAllNotificationsRead = async (userId: string, role: string) => {
  const actorKey = getActorKey(userId, role);
  const filter = buildFilter(userId, role);
  const result = await NotificationModel.updateMany(filter, {
    $addToSet: { readBy: actorKey },
  });
  return { modifiedCount: result.modifiedCount };
};
