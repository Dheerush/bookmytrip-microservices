"use client";

import React from "react";
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

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function DashboardHomePage() {
  const { user } = useAuth();
  const displayName = user?.fullName || user?.email?.split("@")[0] || "Traveller";

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
          {RECENT_BOOKINGS.map((booking) => (
            <motion.div
              key={booking.id}
              className={styles.bookingRow}
              whileHover={{ background: "var(--sky-pale)" }}
              transition={{ duration: 0.15 }}
            >
              <div className={styles.bookingIcon}>
                {booking.type === "Flight" ? <Plane size={16} strokeWidth={1.5} /> : <Hotel size={16} strokeWidth={1.5} />}
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
