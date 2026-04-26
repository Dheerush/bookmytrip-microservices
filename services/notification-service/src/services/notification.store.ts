import type { NotificationPayload } from './socket.service';

const MAX_ITEMS_PER_FEED = 120;

const userFeed = new Map<string, NotificationPayload[]>();
const adminFeed: NotificationPayload[] = [];
const broadcastFeed: NotificationPayload[] = [];

const sortByCreatedAtDesc = (items: NotificationPayload[]): NotificationPayload[] => {
  return [...items].sort((a, b) => {
    const left = new Date(a.createdAt).getTime();
    const right = new Date(b.createdAt).getTime();
    return right - left;
  });
};

const upsert = (list: NotificationPayload[], payload: NotificationPayload): NotificationPayload[] => {
  const withoutCurrent = list.filter((item) => item.id !== payload.id);
  const next = [payload, ...withoutCurrent];
  return sortByCreatedAtDesc(next).slice(0, MAX_ITEMS_PER_FEED);
};

export const addUserNotification = (userId: string, payload: NotificationPayload): void => {
  if (!userId) return;
  const existing = userFeed.get(userId) || [];
  userFeed.set(userId, upsert(existing, payload));
};

export const addAdminNotification = (payload: NotificationPayload): void => {
  adminFeed.splice(0, adminFeed.length, ...upsert(adminFeed, payload));
};

export const addBroadcastNotification = (payload: NotificationPayload): void => {
  broadcastFeed.splice(0, broadcastFeed.length, ...upsert(broadcastFeed, payload));
};

export const getUserSeed = (userId: string): NotificationPayload[] => {
  const userItems = userFeed.get(userId) || [];
  const merged = [...userItems, ...broadcastFeed];
  const deduped = new Map<string, NotificationPayload>();
  merged.forEach((item) => {
    deduped.set(item.id, item);
  });
  return sortByCreatedAtDesc(Array.from(deduped.values())).slice(0, MAX_ITEMS_PER_FEED);
};

export const getAdminSeed = (): NotificationPayload[] => {
  const merged = [...adminFeed, ...broadcastFeed];
  const deduped = new Map<string, NotificationPayload>();
  merged.forEach((item) => {
    deduped.set(item.id, item);
  });
  return sortByCreatedAtDesc(Array.from(deduped.values())).slice(0, MAX_ITEMS_PER_FEED);
};
