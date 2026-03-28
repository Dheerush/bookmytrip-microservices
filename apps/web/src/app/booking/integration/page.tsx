"use client";

import { FormEvent, useEffect, useState } from "react";
import { getAuthHeaders, parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import ButtonLoader from "@/components/ui/ButtonLoader/ButtonLoader";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type BookingItem = {
  _id: string;
  bookingRef: string;
  type: string;
  title: string;
  status: string;
  amount: number;
  startDate: string;
};

const initialForm = {
  type: "flight",
  itemId: "",
  title: "",
  fromCode: "",
  toCode: "",
  startDate: "",
  quantity: "1",
  amount: "0",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export default function BookingIntegrationPage() {
  const { user, hydrated } = useRequireAuth("Please login to access booking integration.");
  const [form, setForm] = useState(initialForm);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!hydrated || !user) return;
    setForm((prev) => ({
      ...prev,
      contactName: user.fullName || "",
      contactEmail: user.email,
    }));
  }, [hydrated, user]);

  const fetchMyBookings = async () => {
    try {
      setLoadingList(true);
      const response = await fetch("/api/bookings/me?page=1&limit=20", {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const parsed = await parseApiResponse<{ bookings: BookingItem[] }>(response, "Unable to fetch booking history.");
      if (!parsed.ok || !parsed.payload?.data) {
        throw new Error(parsed.payload?.message || "Unable to fetch booking history.");
      }
      setBookings(parsed.payload.data.bookings || []);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to fetch booking history.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void fetchMyBookings();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setCreating(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: form.type,
          itemId: form.itemId,
          title: form.title,
          fromCode: form.fromCode || undefined,
          toCode: form.toCode || undefined,
          startDate: form.startDate,
          quantity: Number(form.quantity),
          amount: Number(form.amount),
          contact: {
            name: form.contactName,
            email: form.contactEmail,
            phone: form.contactPhone,
          },
          passengers: [],
          metadata: {
            source: "booking-integration-page",
          },
        }),
      });

      const parsed = await parseApiResponse<{ bookingRef: string }>(response, "Unable to create booking.");
      if (!parsed.ok || !parsed.payload?.data) {
        throw new Error(parsed.payload?.message || "Unable to create booking.");
      }

      showToast.success(`Booking created: ${parsed.payload.data.bookingRef}`);
      await fetchMyBookings();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to create booking.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 16px", display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>Booking Integration (Live API)</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>
        Create bookings directly against /api/bookings and verify the latest responses from booking-service.
      </p>

      <form onSubmit={handleSubmit} style={{ border: "1px solid var(--border-soft)", borderRadius: 12, padding: 14, background: "var(--paper)", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Type</span>
          <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="train">Train</option>
            <option value="cab">Cab</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 4 }}><span>Item ID</span><input required value={form.itemId} onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Title</span><input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>From Code</span><input value={form.fromCode} onChange={(event) => setForm((prev) => ({ ...prev, fromCode: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>To Code</span><input value={form.toCode} onChange={(event) => setForm((prev) => ({ ...prev, toCode: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Start Date</span><input type="date" required value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Quantity</span><input type="number" min={1} value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Amount</span><input type="number" min={0} value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Contact Name</span><input required value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Contact Email</span><input type="email" required value={form.contactEmail} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} /></label>
        <label style={{ display: "grid", gap: 4 }}><span>Contact Phone</span><input required value={form.contactPhone} onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} /></label>
        <div style={{ gridColumn: "1 / -1" }}>
          <ButtonLoader type="submit" loading={creating} loadingText="Creating booking...">Create Booking</ButtonLoader>
        </div>
      </form>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Latest My Bookings</h2>
        <ButtonLoader type="button" onClick={fetchMyBookings} loading={loadingList} loadingText="Refreshing...">Refresh</ButtonLoader>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {bookings.length === 0 && <div style={{ color: "var(--text-muted)" }}>No bookings found yet.</div>}
        {bookings.map((booking) => (
          <article key={booking._id} style={{ border: "1px solid var(--border-soft)", borderRadius: 10, background: "var(--paper)", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{booking.bookingRef}</strong>
              <span style={{ textTransform: "capitalize" }}>{booking.status}</span>
            </div>
            <p style={{ margin: "6px 0", color: "var(--text-muted)" }}>{booking.title} ({booking.type})</p>
            <p style={{ margin: 0 }}>₹{booking.amount.toLocaleString("en-IN")} • {new Date(booking.startDate).toLocaleDateString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
