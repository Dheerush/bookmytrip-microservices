"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Hotel, Train, Package, Eye, Download, Filter } from "lucide-react";
import { showToast } from "@/lib/toast";
import { getApiErrorMessage, getAuthHeaders, parseApiResponse } from "@/lib/http";
import styles from "./BookingHistory.module.scss";

type BookingType = "all" | "flight" | "hotel" | "train" | "package";
type BookingStatus = "confirmed" | "completed" | "cancelled" | "pending";

interface Booking {
  id: string;
  _id?: string;
  type: "flight" | "hotel" | "train" | "cab" | "package";
  title: string;
  bookingDate?: string;
  startDate?: string;
  createdAt?: string;
  status: BookingStatus;
  amount: number;
  bookingRef: string;
}

interface BookingApiItem {
  _id?: string;
  id?: string;
  type: Booking["type"];
  title: string;
  bookingDate?: string;
  createdAt?: string;
  status: BookingStatus;
  amount: number;
  bookingRef: string;
}

const SAMPLE_BOOKINGS: Booking[] = [
  { id: "1", type: "flight", title: "Delhi (DEL) → Goa (GOI)", bookingDate: "15 Mar 2026", status: "confirmed", amount: 8500, bookingRef: "BMT-FL-2026031501" },
  { id: "2", type: "hotel", title: "Taj Vivanta, Panaji, Goa", bookingDate: "15–18 Mar 2026", status: "confirmed", amount: 22000, bookingRef: "BMT-HT-2026031502" },
  { id: "3", type: "flight", title: "Mumbai (BOM) → Jaipur (JAI)", bookingDate: "28 Feb 2026", status: "completed", amount: 5200, bookingRef: "BMT-FL-2026022801" },
  { id: "4", type: "train", title: "Rajdhani Express – Delhi to Mumbai", bookingDate: "20 Jan 2026", status: "completed", amount: 2800, bookingRef: "BMT-TR-2026012001" },
  { id: "5", type: "package", title: "Manali Adventure (3N/4D)", bookingDate: "10–13 Dec 2025", status: "completed", amount: 35000, bookingRef: "BMT-PK-2025121001" },
  { id: "6", type: "hotel", title: "The Oberoi, Jaipur", bookingDate: "01–03 Nov 2025", status: "cancelled", amount: 18500, bookingRef: "BMT-HT-2025110101" },
];

const TYPE_FILTERS: { label: string; value: BookingType; icon: React.ReactNode }[] = [
  { label: "All", value: "all", icon: <Filter size={13} strokeWidth={1.6} /> },
  { label: "Flights", value: "flight", icon: <Plane size={13} strokeWidth={1.6} /> },
  { label: "Hotels", value: "hotel", icon: <Hotel size={13} strokeWidth={1.6} /> },
  { label: "Trains", value: "train", icon: <Train size={13} strokeWidth={1.6} /> },
  { label: "Packages", value: "package", icon: <Package size={13} strokeWidth={1.6} /> },
];

const typeIcon = (type: string) => {
  switch (type) {
    case "flight": return <Plane size={16} strokeWidth={1.5} />;
    case "hotel": return <Hotel size={16} strokeWidth={1.5} />;
    case "train": return <Train size={16} strokeWidth={1.5} />;
    case "package": return <Package size={16} strokeWidth={1.5} />;
    default: return <Plane size={16} strokeWidth={1.5} />;
  }
};

export default function BookingHistoryPage() {
  const [filter, setFilter] = useState<BookingType>("all");
  const [bookings, setBookings] = useState<Booking[]>(SAMPLE_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/bookings/me', { headers: getAuthHeaders() });
        const parsed = await parseApiResponse<{ bookings?: BookingApiItem[] }>(
          res,
          'Unable to load bookings right now.',
        );

        if (!parsed.ok || !parsed.payload) {
          throw new Error(getApiErrorMessage(parsed));
        }

        const data = parsed.payload;
        // Transform API response to match component interface
        const transformedBookings = (data.data?.bookings || []).map((b) => ({
          id: b._id || b.id || b.bookingRef,
          _id: b._id,
          type: b.type,
          title: b.title,
          bookingDate: b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN') : '',
          createdAt: b.createdAt,
          status: b.status,
          amount: b.amount,
          bookingRef: b.bookingRef,
        }));
        setBookings(transformedBookings.length > 0 ? transformedBookings : SAMPLE_BOOKINGS);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load bookings.';
        showToast.error(message);
        setBookings(SAMPLE_BOOKINGS);
        setError(message);
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filtered =
    filter === "all"
      ? bookings
      : bookings.filter((booking) => booking.type === filter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Booking History</h1>
        <p className={styles.subtitle}>View and manage all your past and upcoming bookings</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {TYPE_FILTERS.map((f) => (
          <motion.button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.active : ""}`}
            onClick={() => setFilter(f.value)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            {f.icon}
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span className={styles.colType}>Type</span>
          <span className={styles.colTitle}>Booking</span>
          <span className={styles.colDate}>Date</span>
          <span className={styles.colRef}>Reference</span>
          <span className={styles.colStatus}>Status</span>
          <span className={styles.colAmount}>Amount</span>
          <span className={styles.colActions}>Actions</span>
        </div>
        {loading ? (
          <div className={styles.empty}>Loading bookings...</div>
        ) : error ? (
          <div className={styles.empty}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No bookings found for this category.</div>
        ) : (
          filtered.map((booking, i) => (
            <motion.div
              key={booking.id}
              className={styles.row}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <span className={styles.colType}>
                <span className={styles.typeIcon}>{typeIcon(booking.type)}</span>
              </span>
              <span className={styles.colTitle}>{booking.title}</span>
              <span className={styles.colDate}>{booking.bookingDate || 'N/A'}</span>
              <span className={styles.colRef}>{booking.bookingRef}</span>
              <span className={styles.colStatus}>
                <span className={`${styles.statusBadge} ${styles[booking.status]}`}>{booking.status}</span>
              </span>
              <span className={styles.colAmount}>₹{booking.amount.toLocaleString('en-IN')}</span>
              <span className={styles.colActions}>
                <button className={styles.actionBtn} title="View Details"><Eye size={14} strokeWidth={1.6} /></button>
                <button className={styles.actionBtn} title="Download Invoice"><Download size={14} strokeWidth={1.6} /></button>
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
