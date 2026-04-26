"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/services/auth/context";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

const SOCKET_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL || "http://localhost:5099";

const STORAGE_KEY = "bmt_notifications";

const loadFromStorage = (userId: string): AppNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (userId: string, items: AppNotification[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items.slice(0, 50)));
  } catch { /* ignore quota errors */ }
};

let socket: Socket | null = null;

const mergeIncomingNotifications = (
  existing: AppNotification[],
  incoming: Array<Omit<AppNotification, "read">>,
): AppNotification[] => {
  const byId = new Map(existing.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    const previous = byId.get(item.id);
    byId.set(item.id, {
      ...item,
      read: previous?.read ?? false,
    });
  });

  return Array.from(byId.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 120);
};

export function useNotifications() {
  const { user, token } = useAuth();
  const userId = user?.id ?? null;
  const [notificationMap, setNotificationMap] = useState<Record<string, AppNotification[]>>({});
  const [connected, setConnected] = useState(false);

  const notifications = useMemo(() => {
    if (!userId) return [];
    return notificationMap[userId] ?? loadFromStorage(userId);
  }, [notificationMap, userId]);

  // Persist to localStorage whenever notifications list changes
  useEffect(() => {
    if (!userId) return;
    saveToStorage(userId, notifications);
  }, [notifications, userId]);

  useEffect(() => {
    if (!user || !token) {
      socket?.disconnect();
      socket = null;
      return;
    }

    // Reuse existing connected socket when navigating between pages
    if (socket?.connected) return;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("notification:seed", (seedPayload: Array<Omit<AppNotification, "read">>) => {
      setNotificationMap((prev) => {
        const existing = prev[user.id] ?? loadFromStorage(user.id);
        return {
          ...prev,
          [user.id]: mergeIncomingNotifications(existing, seedPayload || []),
        };
      });
    });
    socket.on("notification", (payload: Omit<AppNotification, "read">) => {
      setNotificationMap((prev) => {
        const existing = prev[user.id] ?? loadFromStorage(user.id);
        return {
          ...prev,
          [user.id]: mergeIncomingNotifications(existing, [payload]),
        };
      });
    });

    return () => {
      // Only fully disconnect when user logs out (user/token becomes null)
      // Keep socket alive during normal navigation
    };
  }, [user, token]);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    setNotificationMap((prev) => {
      const existing = prev[userId] ?? loadFromStorage(userId);
      return {
        ...prev,
        [userId]: existing.map((n) => ({ ...n, read: true })),
      };
    });
  }, [userId]);

  const markRead = useCallback((id: string) => {
    if (!userId) return;
    setNotificationMap((prev) => {
      const existing = prev[userId] ?? loadFromStorage(userId);
      return {
        ...prev,
        [userId]: existing.map((item) => (item.id === id ? { ...item, read: true } : item)),
      };
    });
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount, connected, markAllRead, markRead };
}
