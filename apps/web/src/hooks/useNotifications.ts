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
    socket.on("notification", (payload: Omit<AppNotification, "read">) => {
      setNotificationMap((prev) => {
        const existing = prev[user.id] ?? loadFromStorage(user.id);
        if (existing.some((n) => n.id === payload.id)) return prev;
        return {
          ...prev,
          [user.id]: [{ ...payload, read: false }, ...existing].slice(0, 50),
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

  const pushLocalNotification = useCallback((item: Omit<AppNotification, "read">) => {
    if (!userId) return;
    setNotificationMap((prev) => {
      const existing = prev[userId] ?? loadFromStorage(userId);
      if (existing.some((entry) => entry.id === item.id)) return prev;
      return {
        ...prev,
        [userId]: [{ ...item, read: false }, ...existing].slice(0, 50),
      };
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    const run = async () => {
      try {
        const response = await fetch("/api/admin/coupons/public");
        if (!response.ok) return;

        const payload = await response.json() as {
          data?: { items?: Array<{ code?: string; description?: string; discountType?: string; discountValue?: number; maxDiscount?: number }> };
        };

        if (!mounted) return;
        const coupons = payload.data?.items || [];

        coupons.forEach((coupon) => {
          const code = String(coupon.code || "").trim();
          if (!code) return;
          const discountLabel = coupon.discountType === "percent"
            ? `${coupon.discountValue || 0}% off`
            : `INR ${Number(coupon.discountValue || 0).toLocaleString("en-IN")} off`;

          pushLocalNotification({
            id: `coupon:${code}`,
            type: "offers",
            title: `New coupon: ${code}`,
            message: `${discountLabel}${coupon.description ? ` • ${coupon.description}` : ""}`,
            link: "/dashboard/notifications",
            createdAt: new Date().toISOString(),
          });
        });
      } catch {
        // Ignore transient fetch failures.
      }
    };

    void run();
    const intervalId = window.setInterval(() => {
      void run();
    }, 120_000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [pushLocalNotification, userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount, connected, markAllRead, markRead, pushLocalNotification };
}
