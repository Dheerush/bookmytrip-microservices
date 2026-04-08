"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const loadedRef = useRef(false);

  // Load persisted notifications from localStorage once per user session
  useEffect(() => {
    if (!user?.id || loadedRef.current) return;
    loadedRef.current = true;
    const stored = loadFromStorage(user.id);
    if (stored.length > 0) setNotifications(stored);
  }, [user?.id]);

  // Persist to localStorage whenever notifications list changes
  useEffect(() => {
    if (!user?.id || !loadedRef.current) return;
    saveToStorage(user.id, notifications);
  }, [notifications, user?.id]);

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
      setNotifications((prev) => {
        // Deduplicate by id
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [{ ...payload, read: false }, ...prev].slice(0, 50);
      });
    });

    return () => {
      // Only fully disconnect when user logs out (user/token becomes null)
      // Keep socket alive during normal navigation
    };
  }, [user, token]);

  // Disconnect cleanly when user logs out
  useEffect(() => {
    if (!user && socket) {
      socket.disconnect();
      socket = null;
      loadedRef.current = false;
      setNotifications([]);
      setConnected(false);
    }
  }, [user]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount, connected, markAllRead };
}
