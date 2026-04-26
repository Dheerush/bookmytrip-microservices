"use client";

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";
import { getAuthHeaders } from "@/lib/http";
import { listInventory, type InventoryEntity } from "@/services/inventory/api";
import { adminGlobalSearch } from "@/services/search/api";

type BookingType = "flight" | "hotel" | "train" | "cab" | "tour";
type BookingStatus = "confirmed" | "completed" | "cancelled" | "pending" | "failed";

interface AdminBooking {
  _id: string;
  bookingRef: string;
  type: BookingType;
  status: BookingStatus;
  amount: number;
  userId?: string;
  title?: string;
  createdAt?: string;
}

interface AdminIssue {
  _id: string;
  issueRef: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  subject?: string;
  userId?: string;
  userName?: string;
  createdAt?: string;
}

interface AdminCoupon {
  _id: string;
  code: string;
  active: boolean;
  discountType: "percent" | "fixed";
  discountValue: number;
}

interface SearchSuggestion {
  id: string;
  label: string;
  meta: string;
  href: string;
}

const INVENTORY_TYPES: InventoryEntity[] = ["flights", "trains", "hotels", "cabs", "tours"];

const CARD_STYLE: CSSProperties = {
  padding: 16,
  border: "1px solid var(--border-soft)",
  borderRadius: 14,
  background: "var(--paper)",
  display: "grid",
  gap: 6,
};

const formatCurrency = (value: number) =>
  `INR ${Math.max(0, value).toLocaleString("en-IN")}`;

export default function AdminDashboardPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [inventoryTotals, setInventoryTotals] = useState<Record<InventoryEntity, number>>({
    flights: 0,
    trains: 0,
    hotels: 0,
    cabs: 0,
    tours: 0,
  });

  const [bookingTypeFilter, setBookingTypeFilter] = useState<"all" | BookingType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!hydrated || user?.role !== "admin") return;

    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingsRes, issuesRes, couponsRes, ...inventoryRes] = await Promise.all([
          fetch("/api/bookings/admin?page=1&limit=500", { headers: getAuthHeaders() }),
          fetch("/api/users/issues/admin", { headers: getAuthHeaders() }),
          fetch("/api/admin/coupons", { headers: getAuthHeaders() }),
          ...INVENTORY_TYPES.map((entity) => listInventory(entity, { page: 1, limit: 1, includeInactive: true })),
        ]);

        const bookingsJson = (await bookingsRes.json()) as { data?: { bookings?: AdminBooking[] } };
        const issuesJson = (await issuesRes.json()) as { data?: { items?: AdminIssue[] } };
        const couponsJson = (await couponsRes.json()) as { data?: { items?: AdminCoupon[] } };

        if (!mounted) return;

        const nextTotals: Record<InventoryEntity, number> = {
          flights: 0,
          trains: 0,
          hotels: 0,
          cabs: 0,
          tours: 0,
        };
        inventoryRes.forEach((result, index) => {
          nextTotals[INVENTORY_TYPES[index]] = result.total || 0;
        });

        setBookings(bookingsJson.data?.bookings || []);
        setIssues(issuesJson.data?.items || []);
        setCoupons(couponsJson.data?.items || []);
        setInventoryTotals(nextTotals);
      } catch {
        if (!mounted) return;
        setError("Unable to load live admin metrics right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [hydrated, user?.role]);

  if (!hydrated || user?.role !== "admin") return null;

  const filteredBookings = bookingTypeFilter === "all"
    ? bookings
    : bookings.filter((booking) => booking.type === bookingTypeFilter);

  const bookingStatusCounts: Record<BookingStatus, number> = {
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    failed: 0,
  };
  filteredBookings.forEach((booking) => {
    bookingStatusCounts[booking.status] += 1;
  });

  const bookingTypeCounts: Record<BookingType, number> = {
    flight: 0,
    hotel: 0,
    train: 0,
    cab: 0,
    tour: 0,
  };
  bookings.forEach((booking) => {
    bookingTypeCounts[booking.type] += 1;
  });

  const issueStatusCounts: Record<AdminIssue["status"], number> = {
    open: 0,
    "in-progress": 0,
    resolved: 0,
    closed: 0,
  };
  issues.forEach((issue) => {
    issueStatusCounts[issue.status] += 1;
  });

  const totalRevenue = bookings
    .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);

  const activeCouponCount = coupons.filter((coupon) => coupon.active).length;
  const totalInventory = Object.values(inventoryTotals).reduce((sum, count) => sum + count, 0);
  const usersWithActivity = new Set([
    ...bookings.map((booking) => booking.userId).filter(Boolean),
    ...issues.map((issue) => issue.userId).filter(Boolean),
  ]).size;

  const bookingTrend = useMemo(() => {
    const days: { key: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      days.push({
        key,
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        count: 0,
      });
    }

    const map = new Map(days.map((day) => [day.key, day]));
    filteredBookings.forEach((booking) => {
      const key = (booking.createdAt || "").slice(0, 10);
      const day = map.get(key);
      if (day) day.count += 1;
    });

    return days;
  }, [filteredBookings]);

  useEffect(() => {
    if (!debouncedQuery || user?.role !== "admin") {
      setSearchSuggestions([]);
      setActiveSuggestionIndex(-1);
      return;
    }

    let active = true;
    const run = async () => {
      try {
        const items = await adminGlobalSearch({ q: debouncedQuery, limit: 4 });
        if (!active) return;
        setSearchSuggestions(items);
        setActiveSuggestionIndex(items.length > 0 ? 0 : -1);
      } catch {
        if (!active) return;
        setSearchSuggestions([]);
        setActiveSuggestionIndex(-1);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [debouncedQuery, user?.role]);

  const bookingMax = Math.max(...bookingTrend.map((day) => day.count), 1);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!searchSuggestions.length) {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveSuggestionIndex((prev) => (prev <= 0 ? searchSuggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = searchSuggestions[activeSuggestionIndex] || searchSuggestions[0];
      if (selected) {
        router.push(selected.href);
        setSearchOpen(false);
      }
      return;
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Admin Command Center</h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          Live operational metrics across bookings, support, coupons, and inventory.
        </p>
      </div>

      <div style={{ position: "relative", maxWidth: 700 }}>
        <input
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setSearchOpen(true);
            setActiveSuggestionIndex(-1);
          }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setSearchOpen(false), 120);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Quick global search: booking ref, complaint ID, coupon code, inventory..."
          style={{
            width: "100%",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
            padding: "12px 14px",
            background: "var(--paper)",
          }}
        />

        {searchOpen && searchSuggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 20,
              border: "1px solid var(--border-soft)",
              borderRadius: 12,
              background: "var(--paper)",
              boxShadow: "0 8px 22px rgba(15, 43, 70, 0.12)",
              overflow: "hidden",
            }}
          >
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  router.push(suggestion.href);
                  setSearchOpen(false);
                }}
                style={{
                  width: "100%",
                  border: 0,
                  borderBottom: index === searchSuggestions.length - 1 ? "none" : "1px solid #eef3f8",
                  padding: "10px 12px",
                  textAlign: "left",
                  background: activeSuggestionIndex === index ? "#eef6ff" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, color: "#123655" }}>{suggestion.label}</div>
                <div style={{ fontSize: "0.8rem", color: "#5f7489", marginTop: 2 }}>{suggestion.meta}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ ...CARD_STYLE, borderColor: "#f3c4c4", color: "#8e2020" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600 }}>Total Bookings</div>
          <div style={{ fontSize: 24 }}>{bookings.length}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Recent 500 records</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600 }}>Gross Revenue</div>
          <div style={{ fontSize: 24 }}>{formatCurrency(totalRevenue)}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Confirmed + completed</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600 }}>Open Complaints</div>
          <div style={{ fontSize: 24 }}>{issueStatusCounts.open + issueStatusCounts["in-progress"]}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Open + in-progress tickets</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600 }}>Active Coupons</div>
          <div style={{ fontSize: 24 }}>{activeCouponCount}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Live promotional campaigns</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600 }}>Users With Activity</div>
          <div style={{ fontSize: 24 }}>{usersWithActivity}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>From bookings + issues</div>
        </div>
        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 600 }}>Total Inventory Units</div>
          <div style={{ fontSize: 24 }}>{totalInventory}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Across all service types</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <div style={CARD_STYLE}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>Booking Breakdown</div>
            <select
              value={bookingTypeFilter}
              onChange={(event) => setBookingTypeFilter(event.target.value as "all" | BookingType)}
              style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: "6px 8px", background: "#fff" }}
            >
              <option value="all">All services</option>
              <option value="flight">Flights</option>
              <option value="hotel">Hotels</option>
              <option value="train">Trains</option>
              <option value="cab">Cabs</option>
              <option value="tour">Tours</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            {Object.entries(bookingStatusCounts).map(([status, count]) => {
              const width = filteredBookings.length > 0 ? `${(count / filteredBookings.length) * 100}%` : "0%";
              return (
                <div key={status}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                    <span style={{ textTransform: "capitalize" }}>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ marginTop: 4, height: 8, borderRadius: 99, background: "#edf2f7", overflow: "hidden" }}>
                    <div style={{ width, height: "100%", background: "#1f6fb2" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#5f7489" }}>
            Type mix: F {bookingTypeCounts.flight} · H {bookingTypeCounts.hotel} · T {bookingTypeCounts.train} · C {bookingTypeCounts.cab} · P {bookingTypeCounts.tour}
          </div>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 700 }}>7-Day Booking Trend</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(28px, 1fr))", gap: 8, alignItems: "end", marginTop: 10, minHeight: 150 }}>
            {bookingTrend.map((day) => (
              <div key={day.key} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#4c647b" }}>{day.count}</div>
                <div
                  style={{
                    width: 22,
                    height: `${Math.max(10, Math.round((day.count / bookingMax) * 100))}px`,
                    borderRadius: 8,
                    background: "linear-gradient(180deg, #2f8bd5 0%, #175286 100%)",
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: "#5f7489" }}>{day.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 700 }}>Support Pipeline</div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {Object.entries(issueStatusCounts).map(([status, count]) => (
              <div key={status} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ textTransform: "capitalize" }}>{status}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ fontWeight: 700 }}>Inventory Totals By Service</div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {INVENTORY_TYPES.map((entity) => {
              const count = inventoryTotals[entity];
              const width = totalInventory > 0 ? `${(count / totalInventory) * 100}%` : "0%";
              return (
                <div key={entity}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                    <span style={{ textTransform: "capitalize" }}>{entity}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ marginTop: 4, height: 8, borderRadius: 99, background: "#edf2f7", overflow: "hidden" }}>
                    <div style={{ width, height: "100%", background: "#1f6fb2" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && <p style={{ margin: 0, color: "var(--text-muted)" }}>Refreshing live metrics...</p>}
    </section>
  );
}
