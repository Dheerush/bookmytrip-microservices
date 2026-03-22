"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Tag,
  Shield,
  CheckCircle,
  AlertCircle,
  Gift,
  Percent,
  LogIn,
  KeyRound,
  MessageSquare,
} from "lucide-react";
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

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1", category: "offers",
    icon: <Gift size={16} strokeWidth={1.5} />,
    title: "Flash Sale: 30% Off Flights!",
    message: "Book any domestic flight before Apr 5 and get 30% off. Use code FLYFAST30.",
    time: "2 hours ago", read: false,
  },
  {
    id: "2", category: "offers",
    icon: <Percent size={16} strokeWidth={1.5} />,
    title: "Exclusive Coupon: SUMMER2026",
    message: "Enjoy ₹2,000 off on hotel bookings above ₹10,000. Valid till Apr 30.",
    time: "5 hours ago", read: false,
  },
  {
    id: "3", category: "security",
    icon: <LogIn size={16} strokeWidth={1.5} />,
    title: "New Login Detected",
    message: "A new login was detected from Chrome on Windows. If this wasn't you, please change your password.",
    time: "1 day ago", read: false,
  },
  {
    id: "4", category: "security",
    icon: <KeyRound size={16} strokeWidth={1.5} />,
    title: "Password Changed Successfully",
    message: "Your account password was changed successfully on Mar 20, 2026.",
    time: "2 days ago", read: true,
  },
  {
    id: "5", category: "support",
    icon: <MessageSquare size={16} strokeWidth={1.5} />,
    title: "Complaint #1234 Resolved",
    message: "Your complaint regarding Booking BMT-FL-2026022801 has been resolved. Refund of ₹5,200 processed.",
    time: "3 days ago", read: true,
  },
  {
    id: "6", category: "offers",
    icon: <Tag size={16} strokeWidth={1.5} />,
    title: "Goa Deals: Hotels from ₹999/night",
    message: "Limited-period offer on beachfront hotels in Goa. Book now!",
    time: "4 days ago", read: true,
  },
  {
    id: "7", category: "security",
    icon: <Shield size={16} strokeWidth={1.5} />,
    title: "Login Attempt Blocked",
    message: "A suspicious login attempt was blocked from an unknown device. No action needed.",
    time: "5 days ago", read: true,
  },
];

const CATEGORY_FILTERS: { label: string; value: NotifCategory; icon: React.ReactNode }[] = [
  { label: "All", value: "all", icon: <Bell size={13} strokeWidth={1.6} /> },
  { label: "Offers & Coupons", value: "offers", icon: <Tag size={13} strokeWidth={1.6} /> },
  { label: "Security", value: "security", icon: <Shield size={13} strokeWidth={1.6} /> },
  { label: "Support", value: "support", icon: <MessageSquare size={13} strokeWidth={1.6} /> },
];

export default function NotificationsPage() {
  const [category, setCategory] = useState<NotifCategory>("all");
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const filtered = category === "all" ? notifications : notifications.filter((n) => n.category === category);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Notifications
            {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} new</span>}
          </h1>
          <p className={styles.subtitle}>Offers, coupons, security alerts, and support updates</p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            className={styles.markAllBtn}
            onClick={markAllRead}
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
