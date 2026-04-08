"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { useBookingGuard } from "@/hooks/useBookingGuard";
import { useAuth } from "@/services/auth/context";
import { showToast } from "@/lib/toast";
import { cabs } from "@/data/cabs";
import type { Cab } from "@/data/cabs";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import s from "@/styles/booking.module.scss";

function CabBookingContent() {
  const searchParams = useSearchParams();
  const { processBookingAndPayment } = useBookingFlow();
  const { guardAction } = useBookingGuard();
  const { user } = useAuth();

  const cabId = searchParams.get("cabId") || "";
  const initialPickup = searchParams.get("pickup") || "";
  const initialDrop = searchParams.get("drop") || "";
  const initialDate = searchParams.get("date") || "";
  const initialTime = searchParams.get("time") || "10:00";
  const distanceKm = Math.max(1, Number(searchParams.get("distanceKm") || "20"));

  const [cab, setCab] = useState<(Cab & { _id?: string }) | null>(() => cabs.find((c) => c.id === cabId) || null);
  const [loadingCab, setLoadingCab] = useState(Boolean(cabId && !cab));
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  useEffect(() => {
    if (!cabId || cab) {
      setLoadingCab(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/cabs/${cabId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: (Cab & { _id?: string }) };
        if (!mounted || !json.data) return;
        const item = json.data;
        setCab({ ...item, id: item.id || item._id || cabId });
      } finally {
        if (mounted) setLoadingCab(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [cabId, cab]);

  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState(initialPickup);
  const [drop, setDrop] = useState(initialDrop);
  const [travelDate, setTravelDate] = useState(initialDate);
  const [pickupTime, setPickupTime] = useState(initialTime);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Once cab data is available, default pickup/drop to the first available point
  useEffect(() => {
    if (!cab) return;
    if (cab.pickupPoints && cab.pickupPoints.length > 0) {
      setPickup((prev) => cab.pickupPoints!.includes(prev) ? prev : (cab.pickupPoints![0] ?? prev));
    }
    if (cab.dropPoints && cab.dropPoints.length > 0) {
      setDrop((prev) => cab.dropPoints!.includes(prev) ? prev : (cab.dropPoints![0] ?? prev));
    }
  }, [cab]);

  if (loadingCab) {
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <p>Loading cab details...</p>
        </div>
      </div>
    );
  }

  if (!cab) {
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <p>Cab not found. Please go back and select a cab.</p>
          <Link href="/cabs" className={s.backLink}>← Back to cabs</Link>
        </div>
      </div>
    );
  }

  const distanceFare = Math.round(cab.pricePerKm * distanceKm);
  const baseFare = cab.baseFare;
  const taxes = Math.round((baseFare + distanceFare) * 0.05);
  const serviceFee = 49;
  const totalBeforeCoupon = baseFare + distanceFare + taxes + serviceFee;
  const totalAmount = Math.max(0, totalBeforeCoupon - appliedCouponDiscount);

  const submitBooking = async (finalAmount: number) => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      showToast.error("Please fill in all required fields.");
      return;
    }
    if (!pickup.trim() || !drop.trim()) {
      showToast.error("Please provide pickup and drop locations.");
      return;
    }
    if (!travelDate) {
      showToast.error("Please select a travel date.");
      return;
    }
    if (!pickupTime) {
      showToast.error("Please select pickup time.");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      showToast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await guardAction(async () => {
        await processBookingAndPayment(
          {
            itemId: cab.id,
            type: "cab",
            title: `${cab.carModel} — ${pickup}${drop ? ` → ${drop}` : ""}`,
            fromCode: pickup,
            toCode: drop || pickup,
            startDate: travelDate,
            scheduleTime: pickupTime || undefined,
            quantity: 1,
            amount: finalAmount,
            couponCode: appliedCouponCode || undefined,
            discountAmount: appliedCouponDiscount,
            contact: { name: name.trim(), email: email.trim(), phone: phone.trim() },
            passengers: [],
          },
          finalAmount,
          {
            onSuccess: (ref) => setConfirmedRef(ref),
          },
        );
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBooking(totalAmount);
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className={s.page}>
      <Link href="/cabs" className={s.backLink}>← Back to cabs</Link>

      {/* ── Booking Confirmed State ── */}
      {confirmedRef ? (
        <div className={s.formCard} style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "36px 28px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
          <h2 className={s.sectionTitle} style={{ marginBottom: 4 }}>Booking Confirmed!</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
            Booking Ref: <strong style={{ color: "var(--text-dark)" }}>{confirmedRef}</strong>
          </p>

          {/* Driver contact — shown only after booking is confirmed */}
          <div style={{ background: "var(--sky-pale)", borderRadius: 10, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
            <p style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
              Your Driver
            </p>
            <p style={{ fontWeight: 600, color: "var(--text-dark)" }}>{cab.driverName} · ★ {cab.driverRating}</p>
            {cab.driverPhone && (
              <p style={{ marginTop: 6, color: "var(--sky)", fontWeight: 600, fontSize: "1.05rem" }}>
                📞 {cab.driverPhone}
              </p>
            )}
            <p style={{ marginTop: 4, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              You may contact your driver for pickup coordination.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/dashboard/bookings?success=${confirmedRef}`} className={s.ctaBtn} style={{ textDecoration: "none", display: "inline-block" }}>
              View My Bookings
            </Link>
            <Link href="/cabs" className={s.backLink} style={{ alignSelf: "center" }}>
              Book Another Cab
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h1 className={s.title}>Confirm Your Cab Booking</h1>
          <div className={s.inner}>
        {/* ── Left column: cab summary + form ── */}
        <div>
          {/* Cab summary */}
          <div className={s.summaryCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.summaryImg} src={cab.image} alt={cab.carModel} loading="lazy" />
            <div className={s.summaryBody}>
              <div className={s.summaryName}>{cab.carModel} ({cab.brand})</div>
              <div className={s.summaryMeta}>
                {cab.type} · {cab.seatingCapacity} seats · {cab.fuelType}{cab.ac ? " · AC" : ""}
              </div>
              <div className={s.summaryMeta}>Driver: {cab.driverName} · ★ {cab.driverRating}</div>
              <div className={s.summaryRoute}>
                <div>📍 From: <strong>{pickup || "—"}</strong></div>
                {drop && <div>📍 To: <strong>{drop}</strong></div>}
                <div>📅 Date: <strong>{formatDate(travelDate)}</strong></div>
                <div>🕒 Time: <strong>{pickupTime || "—"}</strong></div>
                <div>📏 Distance: <strong>{distanceKm} km</strong></div>
              </div>
            </div>
          </div>

          {/* Traveler details form */}
          <div className={s.formCard}>
            <h2 className={s.sectionTitle}>Traveler Details</h2>
            <form onSubmit={handleBooking}>
              <div className={s.fieldFull}>
                <label className={s.label} htmlFor="bk-name">Full Name *</label>
                <input
                  id="bk-name"
                  className={s.input}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />
              </div>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label} htmlFor="bk-email">Email *</label>
                  <input
                    id="bk-email"
                    className={s.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className={s.label} htmlFor="bk-phone">Phone *</label>
                  <input
                    id="bk-phone"
                    className={s.input}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile"
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label} htmlFor="bk-pickup">Pickup *</label>
                  {cab.pickupPoints && cab.pickupPoints.length > 0 ? (
                    <select id="bk-pickup" className={s.input} value={pickup} onChange={(e) => setPickup(e.target.value)} required>
                      {cab.pickupPoints.map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="bk-pickup"
                      className={s.input}
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Pickup location"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className={s.label} htmlFor="bk-drop">Drop *</label>
                  {cab.dropPoints && cab.dropPoints.length > 0 ? (
                    <select id="bk-drop" className={s.input} value={drop} onChange={(e) => setDrop(e.target.value)} required>
                      {cab.dropPoints.map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="bk-drop"
                      className={s.input}
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="Drop location"
                      required
                    />
                  )}
                </div>
              </div>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label} htmlFor="bk-date">Travel Date *</label>
                  <input
                    id="bk-date"
                    className={s.input}
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={s.label} htmlFor="bk-time">Pickup Time *</label>
                  <input
                    id="bk-time"
                    className={s.input}
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button className={s.ctaBtn} type="submit" disabled={submitting}>
                {submitting ? "Processing…" : "Proceed to Payment"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right column: fare breakdown ── */}
        <BookingSidebar
          baseFare={baseFare}
          taxes={taxes}
          serviceFee={serviceFee}
          extraLines={[{ label: `Distance Fare (${distanceKm} km × ₹${cab.pricePerKm}/km)`, amount: distanceFare }]}
          serviceType="cab"
          initialCouponCode={appliedCouponCode}
          initialCouponDiscount={appliedCouponDiscount}
          onCouponApplied={({ code, discount }) => {
            setAppliedCouponCode(code);
            setAppliedCouponDiscount(discount);
          }}
          ctaLabel={submitting ? "Processing…" : "Proceed to Payment"}
          onProceed={(netAmount) => {
            if (submitting) return;
            void submitBooking(netAmount);
          }}
        />
      </div>
        </>
      )}
    </div>
  );
}

export default function CabBookingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20vh 24px", textAlign: "center", color: "#6b7f93" }}>Loading…</div>}>
      <CabBookingContent />
    </Suspense>
  );
}
