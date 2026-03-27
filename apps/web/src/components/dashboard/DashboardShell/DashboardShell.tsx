"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  AlertTriangle,
  Database,
  FileClock,
  MessageSquare,
  Settings,
  LogOut,
  Compass,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import Logo from "@/components/ui/Logo/Logo";
import { useAuth } from "@/services/auth/context";
import styles from "./DashboardShell.module.scss";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const USER_NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.6} /> },
  { label: "Booking History", href: "/dashboard/bookings", icon: <ClipboardList size={18} strokeWidth={1.6} /> },
  { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={18} strokeWidth={1.6} />, badge: 3 },
  { label: "Issues", href: "/dashboard/issues", icon: <AlertTriangle size={18} strokeWidth={1.6} /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.6} /> },
];

const VENDOR_NAV_ITEMS: SidebarItem[] = [
  { label: "Vendor Dashboard", href: "/dashboard/vendor", icon: <LayoutDashboard size={18} strokeWidth={1.6} /> },
  { label: "Bookings", href: "/dashboard/bookings", icon: <ClipboardList size={18} strokeWidth={1.6} /> },
  { label: "Reviews", href: "/dashboard/vendor/reviews", icon: <MessageSquare size={18} strokeWidth={1.6} /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.6} /> },
];

const ADMIN_NAV_ITEMS: SidebarItem[] = [
  { label: "Admin Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={18} strokeWidth={1.6} /> },
  { label: "Inventory", href: "/dashboard/admin/inventory", icon: <Database size={18} strokeWidth={1.6} /> },
  { label: "Requests", href: "/dashboard/admin/requests", icon: <FileClock size={18} strokeWidth={1.6} /> },
  { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={18} strokeWidth={1.6} />, badge: 5 },
  { label: "Complaints", href: "/dashboard/issues", icon: <AlertTriangle size={18} strokeWidth={1.6} /> },
  { label: "Data Management", href: "/dashboard/admin/data", icon: <Database size={18} strokeWidth={1.6} /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} strokeWidth={1.6} /> },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const normalizedRole = user?.role === "admin" ? "admin" : user?.role === "vendor" ? "vendor" : "user";
  const navItems = normalizedRole === "admin" ? ADMIN_NAV_ITEMS : normalizedRole === "vendor" ? VENDOR_NAV_ITEMS : USER_NAV_ITEMS;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className={styles.sidebarHeader}>
        <Logo variant="dark" />
      </div>

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.avatarRing}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className={styles.avatarImg} /> // eslint-disable-line @next/next/no-img-element
          ) : (
            <span className={styles.avatarInitial}>{displayName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{displayName}</span>
          <span className={styles.userEmail}>{user?.email}</span>
          <span className={styles.userEmail}>{normalizedRole.toUpperCase()}</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <motion.button
            key={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ""}`}
            onClick={() => { router.push(item.href); setMobileOpen(false); }}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className={styles.badge}>{item.badge}</span>
            )}
            {isActive(item.href) && (
              <ChevronRight size={14} strokeWidth={1.8} className={styles.activeChevron} />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={styles.sidebarFooter}>
        <motion.button
          className={styles.exploreBtn}
          onClick={() => router.push("/")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Compass size={16} strokeWidth={1.6} />
          Explore BookMyTrip
        </motion.button>

        <motion.button
          className={styles.logoutBtn}
          onClick={handleLogout}
          whileHover={{ x: 2 }}
          transition={{ duration: 0.15 }}
        >
          <LogOut size={16} strokeWidth={1.6} />
          Log Out
        </motion.button>
      </div>
    </>
  );

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className={styles.mobileSidebar}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
                <X size={20} strokeWidth={1.6} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={styles.content}>
        <header className={styles.topBar}>
          <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}>
            <Menu size={20} strokeWidth={1.6} />
          </button>
          <div className={styles.breadcrumb}>
            {pathname === "/dashboard" ? "Dashboard" : navItems.find((i) => isActive(i.href))?.label || "Dashboard"}
          </div>
        </header>
        <div className={styles.contentInner}>{children}</div>
      </main>
    </div>
  );
}
