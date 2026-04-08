"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Tag,
  Shield,
  CheckCircle,
  AlertCircle,
  Gift,
  MessageSquare,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import styles from "./Notifications.module.scss";

type NotifCategory = "all" | "offers" | "security" | "support";

interface Notification {
  id: string;
  category: "offers" | "security" | "support";
  icon: React.ReactNode;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const CATEGORY_FILTERS: { label: string; value: NotifCategory; icon: React.ReactNode }[] = [
  { label: "All", value: "all", icon: <Bell size={13} strokeWidth={1.6} /> },
  { label: "Offers & Coupons", value: "offers", icon: <Tag size={13} strokeWidth={1.6} /> },
  { label: "Security", value: "security", icon: <Shield size={13} strokeWidth={1.6} /> },
  { label: "Support", value: "support", icon: <MessageSquare size={13} strokeWidth={1.6} /> },
];

export default function NotificationsPage() {
  const { notifications: socketNotifications, unreadCount, markAllRead, connected } = useNotifications();
  const [category, setCategory] = useState<NotifCategory>("all");
  const [locallyRead, setLocallyRead] = useState<Record<string, boolean>>({});

  const notifications = useMemo<Notification[]>(() => {
    return socketNotifications.map((n) => {
      const mappedCategory: Notification["category"] =
        n.type === "support" || n.type === "booking" || n.type === "cancellation" || n.type === "refund"
          ? "support"
          : n.type === "login" || n.type === "security"
            ? "security"
            : "offers";

      const icon =
        mappedCategory === "offers"
          ? <Gift size={16} strokeWidth={1.5} />
          : mappedCategory === "security"
            ? <Shield size={16} strokeWidth={1.5} />
            : <MessageSquare size={16} strokeWidth={1.5} />;

      const parsedDate = new Date(n.createdAt);
      const time = Number.isNaN(parsedDate.getTime())
        ? "Just now"
        : parsedDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

      return {
        id: n.id,
        category: mappedCategory,
        icon,
        title: n.title,
        message: n.message,
        time,
        read: Boolean(n.read || locallyRead[n.id]),
      };
    });
  }, [socketNotifications, locallyRead]);

  const filtered = category === "all" ? notifications : notifications.filter((n) => n.category === category);

  const markAllLocallyRead = () => {
    const next: Record<string, boolean> = {};
    notifications.forEach((n) => { next[n.id] = true; });
    setLocallyRead(next);
    markAllRead();
  };

  const markRead = (id: string) => {
    setLocallyRead((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Notifications
            {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} new</span>}
          </h1>
          <p className={styles.subtitle}>
            {connected ? "Live stream connected" : "Connecting live stream..."} · Offers, coupons, security alerts, and support updates
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            className={styles.markAllBtn}
            onClick={markAllLocallyRead}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CheckCircle size={14} strokeWidth={1.6} />
            Mark all as read
          </motion.button>
        )}
      </div>

      {/* Category Filters */}
      <div className={styles.filters}>
        {CATEGORY_FILTERS.map((f) => (
          <motion.button
            key={f.value}
            className={`${styles.filterBtn} ${category === f.value ? styles.active : ""}`}
            onClick={() => setCategory(f.value)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            {f.icon}
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Notification List */}
      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              className={styles.empty}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AlertCircle size={32} strokeWidth={1.2} />
              <span>No notifications in this category</span>
            </motion.div>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                className={`${styles.notifCard} ${!notif.read ? styles.unread : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => markRead(notif.id)}
              >
                <div className={`${styles.notifIcon} ${styles[notif.category]}`}>
                  {notif.icon}
                </div>
                <div className={styles.notifContent}>
                  <div className={styles.notifHeader}>
                    <span className={styles.notifTitle}>{notif.title}</span>
                    {!notif.read && <span className={styles.dot} />}
                  </div>
                  <p className={styles.notifMessage}>{notif.message}</p>
                  <span className={styles.notifTime}>{notif.time}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
