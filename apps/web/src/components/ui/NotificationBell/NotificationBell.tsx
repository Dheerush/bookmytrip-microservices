"use client";
import React, { useRef, useState, useEffect } from "react";
import { Bell, X, CheckCheck, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import styles from "./NotificationBell.module.scss";

const TYPE_ICON: Record<string, string> = {
  booking: "✈️",
  cancellation: "❌",
  refund: "💰",
  login: "🔐",
  security: "🛡️",
  signup: "🎉",
  support: "🎫",
  default: "🔔",
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const handleItemClick = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.bellBtn}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.6} className={open ? styles.bellActive : ""} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Notifications</span>
            <div className={styles.headerActions}>
              {notifications.length > 0 && (
                <button className={styles.markReadBtn} onClick={markAllRead}>
                  <CheckCheck size={14} strokeWidth={1.8} />
                  Mark all read
                </button>
              )}
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} strokeWidth={1.2} className={styles.emptyIcon} />
                <p>All caught up!</p>
                <span>No new notifications</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.unread : ""}`}
                  onClick={() => handleItemClick(n)}
                >
                  <span className={styles.itemIcon}>
                    {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                  </span>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{n.title}</div>
                    <div className={styles.itemMessage}>{n.message}</div>
                    <div className={styles.itemMeta}>
                      {timeAgo(n.createdAt)}
                      {n.link && <ExternalLink size={10} strokeWidth={1.8} />}
                    </div>
                  </div>
                  {!n.read && <span className={styles.dot} />}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.dropdownFooter}>
              <button
                className={styles.viewAllBtn}
                onClick={() => { setOpen(false); router.push("/dashboard/notifications"); }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
