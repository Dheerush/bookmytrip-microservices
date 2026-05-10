"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plane,
  Hotel,
  CreditCard,
  TrendingUp,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/services/auth/context";
import { getAuthHeaders, parseApiResponse } from "@/lib/http";
import styles from "./DashboardHome.module.scss";

const QUICK_STATS = [
  { label: "Total Bookings", value: "12", icon: <Calendar size={20} strokeWidth={1.5} />, color: "sky" },
  { label: "Flights Taken", value: "5", icon: <Plane size={20} strokeWidth={1.5} />, color: "gold" },
  { label: "Hotels Stayed", value: "4", icon: <Hotel size={20} strokeWidth={1.5} />, color: "sky" },
  { label: "Total Spent", value: "₹1,24,500", icon: <CreditCard size={20} strokeWidth={1.5} />, color: "gold" },
];

const RECENT_BOOKINGS = [
  { id: 1, type: "Flight", title: "Delhi → Goa", date: "15 Mar 2026", status: "Confirmed", amount: "₹8,500" },
  { id: 2, type: "Hotel", title: "Taj Vivanta, Goa", date: "15–18 Mar 2026", status: "Completed", amount: "₹22,000" },
  { id: 3, type: "Flight", title: "Mumbai → Jaipur", date: "28 Feb 2026", status: "Completed", amount: "₹5,200" },
];

interface BookingApiItem {
  id?: string;
  _id?: string;
  type?: string;
  title?: string;
  bookingDate?: string;
  startDate?: string;
  createdAt?: string;
  status?: string;
  amount?: number;
  bookingRef?: string;
}

interface DashboardBooking {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
  amount: string;
  createdAtTs: number;
}

const formatBookingDate = (booking: BookingApiItem): string => {
  const candidate = booking.startDate || booking.bookingDate || booking.createdAt;
  if (!candidate) return "Recent";
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return "Recent";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatAmount = (amount?: number): string => {
  if (typeof amount !== "number") return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function DashboardHomePage() {
  const { user, token } = useAuth();
  const displayName = user?.fullName || user?.email?.split("@")[0] || "Traveller";
  const [recentBookings, setRecentBookings] = useState<DashboardBooking[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setRecentBookings(RECENT_BOOKINGS.map((booking) => ({
        ...booking,
        id: String(booking.id),
        createdAtTs: Date.now(),
      })));
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    let active = true;
    const run = async () => {
      try {
        const response = await fetch("/api/bookings/me", { headers: getAuthHeaders() });
        const parsed = await parseApiResponse<{ bookings?: BookingApiItem[] }>(response, "Unable to fetch bookings.");
        if (!active || !parsed.ok) return;

        const normalized = (parsed.payload?.data?.bookings || [])
          .map((booking) => {
            const createdAtValue = booking.createdAt || booking.startDate || booking.bookingDate || "";
            const createdAtTs = new Date(createdAtValue).getTime();

            return {
              id: booking._id || booking.id || booking.bookingRef || `${booking.title || "booking"}-${createdAtValue}`,
              type: String(booking.type || "Trip").toLowerCase(),
              title: booking.title || booking.bookingRef || "Booking",
              date: formatBookingDate(booking),
              status: booking.status || "Confirmed",
              amount: formatAmount(booking.amount),
              createdAtTs: Number.isNaN(createdAtTs) ? 0 : createdAtTs,
            } as DashboardBooking;
          })
          .sort((a, b) => b.createdAtTs - a.createdAtTs)
          .slice(0, 3);

        if (normalized.length > 0) {
          setRecentBookings(normalized);
        }
      } catch {
        // Keep graceful fallback cards on dashboard if bookings API fails.
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [token]);

  const latestBookings = useMemo(() => recentBookings.slice(0, 3), [recentBookings]);

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Welcome */}
      <motion.div className={styles.welcome} variants={itemVariants}>
        <h1 className={styles.greeting}>
          Welcome back, <span className={styles.name}>{displayName}</span>
        </h1>
        <p className={styles.subtitle}>Here&apos;s a quick overview of your travel activity</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className={styles.statsGrid} variants={itemVariants}>
        {QUICK_STATS.map((stat) => (
          <motion.div
            key={stat.label}
            className={`${styles.statCard} ${styles[stat.color]}`}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(11,25,41,0.08)" }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Bookings */}
      <motion.div className={styles.section} variants={itemVariants}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={16} strokeWidth={1.6} />
            Recent Bookings
          </h2>
        </div>
        <div className={styles.bookingsList}>
          {latestBookings.map((booking) => (
            <motion.div
              key={booking.id}
              className={styles.bookingRow}
              whileHover={{ background: "var(--sky-pale)" }}
              transition={{ duration: 0.15 }}
            >
              <div className={styles.bookingIcon}>
                {booking.type === "flight" ? <Plane size={16} strokeWidth={1.5} /> : <Hotel size={16} strokeWidth={1.5} />}
              </div>
              <div className={styles.bookingInfo}>
                <span className={styles.bookingTitle}>{booking.title}</span>
                <span className={styles.bookingDate}>{booking.date}</span>
              </div>
              <span className={`${styles.bookingStatus} ${styles[booking.status.toLowerCase()]}`}>
                {booking.status}
              </span>
              <span className={styles.bookingAmount}>{booking.amount}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Saved Places */}
      <motion.div className={styles.section} variants={itemVariants}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <MapPin size={16} strokeWidth={1.6} />
            Saved Destinations
          </h2>
        </div>
        <div className={styles.placesGrid}>
          {["Goa", "Manali", "Jaipur", "Kerala"].map((place) => (
            <div key={place} className={styles.placeChip}>
              <MapPin size={12} strokeWidth={1.6} />
              {place}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
