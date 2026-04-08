"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { flights, type Flight } from "@/data/flights";
import { useAuth } from "@/services/auth/context";
import { useBookingGuard } from "@/hooks/useBookingGuard";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { showToast } from "@/lib/toast";
import { getAuthHeaders } from "@/lib/http";
import s from "@/styles/booking.module.scss";

type CabinClass = "economy" | "premiumEconomy" | "business";

type Traveler = {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  email: string;
};

const addDays = (isoDate: string, days: number): string => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0] || isoDate;
};

function createTravelers(count: number): Traveler[] {
  return Array.from({ length: count }, () => ({
    name: "",
    age: "",
    gender: "male",
    email: "",
  }));
}

function generateFlightSeat(index: number, cabin: CabinClass, seed: string): string {
  const rows: Record<CabinClass, { start: number; end: number }> = {
    business:       { start: 1,  end: 4  },
    premiumEconomy: { start: 5,  end: 9  },
    economy:        { start: 10, end: 35 },
  };
  const cols = cabin === "business" ? "ABCD" : "ABCDEF";
  const range = rows[cabin];
  // Simple deterministic offset using seed chars to spread assignments
  const seedOffset = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const span = range.end - range.start + 1;
  const row = range.start + ((seedOffset + index * 3) % span);
  const col = cols[(seedOffset + index * 2) % cols.length];
  return `${row}${col}`;
}

function FlightBookingContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { guardAction } = useBookingGuard();
  const { processBookingAndPayment } = useBookingFlow();

  const outboundId = searchParams.get("outboundId") || "";
  const returnId = searchParams.get("returnId") || "";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const returnDate = searchParams.get("returnDate") || addDays(date, 3);
  const tripType = (searchParams.get("tripType") as "one-way" | "round-trip") || "one-way";
  const couponCode = (searchParams.get("couponCode") || "").trim().toUpperCase();
  const [couponDiscount, setCouponDiscount] = useState(
    Math.max(0, Number(searchParams.get("couponDiscount") || "0") || 0),
  );

  const [outbound, setOutbound] = useState<Flight | null>(flights.find((f) => f.id === outboundId) || null);
  const [inbound, setInbound] = useState<Flight | null>(flights.find((f) => f.id === returnId) || null);
  const [loading, setLoading] = useState(Boolean(outboundId && !outbound));

  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [travelersCount, setTravelersCount] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>(createTravelers(1));

  const [contactName, setContactName] = useState(user?.fullName || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!outboundId || outbound) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/flights/${outboundId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: (Flight & { _id?: string }) };
        if (!mounted || !json.data) return;
        const item = json.data;
        setOutbound({ ...item, id: item.id || item._id || outboundId });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [outboundId, outbound]);

  useEffect(() => {
    if (!returnId || inbound) return;
    let mounted = true;

    const run = async () => {
      try {
        const res = await fetch(`/api/flights/${returnId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: (Flight & { _id?: string }) };
        if (!mounted || !json.data) return;
        const item = json.data;
        setInbound({ ...item, id: item.id || item._id || returnId });
      } catch {
        // best-effort fallback already tried static data
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [returnId, inbound]);

  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === travelersCount) return prev;
      if (prev.length > travelersCount) return prev.slice(0, travelersCount);
      return [...prev, ...createTravelers(travelersCount - prev.length)];
    });
  }, [travelersCount]);

  const farePerTraveler = useMemo(() => {
    if (!outbound) return 0;
    const onward = outbound.fare[cabinClass] || 0;
    const back = tripType === "round-trip" && inbound ? inbound.fare[cabinClass] || 0 : 0;
    return onward + back;
  }, [outbound, inbound, tripType, cabinClass]);

  // Compute fares — safe with 0 defaults before flight loads
  const baseFare = farePerTraveler * travelersCount;
  const taxes = Math.round(baseFare * 0.05);
  const serviceFee = 249 * (tripType === "round-trip" ? 2 : 1);
  const totalBeforeCoupon = baseFare + taxes + serviceFee;
  const appliedCouponDiscount = Math.min(couponDiscount, totalBeforeCoupon);
  const totalAmount = totalBeforeCoupon - appliedCouponDiscount;

  const revalidateCoupon = useCallback(async () => {
    if (!couponCode || !outbound) return;
    try {
      const res = await fetch("/api/admin/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ code: couponCode, amount: totalBeforeCoupon, serviceType: "flight" }),
      });
      const data = (await res.json()) as { success?: boolean; data?: { discount?: number } };
      if (data.success && data.data?.discount != null) {
        setCouponDiscount(data.data.discount);
      }
    } catch {
      // ignore network errors silently
    }
  }, [couponCode, outbound, totalBeforeCoupon]);

  useEffect(() => {
    void revalidateCoupon();
  }, [revalidateCoupon]);

  if (loading) {
    return <div className={s.page} style={{ padding: "18vh 24px", textAlign: "center" }}>Loading flight details...</div>;
  }

  if (!outbound) {
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <p>Flight not found. Please select a flight again.</p>
          <Link href="/flights" className={s.backLink}>Back to flights</Link>
        </div>
      </div>
    );
  }

  const updateTraveler = (index: number, key: keyof Traveler, value: string) => {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
  };

  const seatsLeft = outbound.seatsLeft ?? 999;
  const maxTravelers = Math.min(9, seatsLeft);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast.error("Please fill contact details.");
      return;
    }

    const hasInvalidTraveler = travelers.some((t) => !t.name.trim());
    if (hasInvalidTraveler) {
      showToast.error("Please enter all traveler names.");
      return;
    }

    // Duplicate traveller check
    const names = travelers.map((t) => t.name.trim().toLowerCase()).filter(Boolean);
    if (names.length !== new Set(names).size) {
      showToast.error("Each traveller must have a unique name.");
      return;
    }

    // Overbooking guard
    if (travelersCount > seatsLeft) {
      showToast.error(`Only ${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} are available on this flight.`);
      return;
    }

    // Generate seat assignments
    const seatSeed = outbound.flightCode || outbound.id;
    const passengersWithSeats = travelers.map((t, idx) => ({
      name: t.name.trim(),
      age: Number(t.age) || undefined,
      gender: t.gender,
      email: t.email.trim() || undefined,
      seatNumber: generateFlightSeat(idx, cabinClass, seatSeed),
    }));

    setSubmitting(true);
    try {
      await guardAction(async () => {
        await processBookingAndPayment(
          {
            itemId: tripType === "round-trip" && inbound ? `${outbound.id}|${inbound.id}` : outbound.id,
            type: "flight",
            title:
              tripType === "round-trip" && inbound
                ? `${outbound.fromCode} -> ${outbound.toCode} + ${inbound.fromCode} -> ${inbound.toCode}`
                : `${outbound.fromCode} -> ${outbound.toCode} (${outbound.airline})`,
            fromCode: outbound.fromCode,
            toCode: outbound.toCode,
            startDate: date,
            endDate: tripType === "round-trip" ? returnDate : undefined,
            scheduleTime: outbound.boardingTime || undefined,
            quantity: travelersCount,
            amount: baseFare,
            couponCode: couponCode || undefined,
            discountAmount: appliedCouponDiscount,
            contact: {
              name: contactName.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
            passengers: passengersWithSeats,
            metadata: {
              seatClass: cabinClass,
              boardingTerminal: outbound.boardingTerminal,
              seats: passengersWithSeats.map((p) => p.seatNumber),
            },
          },
          totalAmount,
        );
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.page}>
      <Link href="/flights" className={s.backLink}>Back to flights</Link>
      <h1 className={s.title}>Flight Booking</h1>

      <div className={s.inner}>
        <div>
          <div className={s.summaryCard}>
            <div className={s.summaryBody}>
              <div className={s.summaryName}>{outbound.airline} ({outbound.flightCode})</div>
              <div className={s.summaryMeta}>{outbound.from} ({outbound.fromCode}) {"->"} {outbound.to} ({outbound.toCode})</div>
              {(outbound.boardingAirport || outbound.boardingTerminal || outbound.boardingTime) && (
                <div className={s.summaryMeta}>
                  Boarding: {[outbound.boardingAirport, outbound.boardingTerminal].filter(Boolean).join(" • ")}
                  {outbound.boardingTime ? ` at ${outbound.boardingTime}` : ""}
                </div>
              )}
              <div className={s.summaryMeta}>Depart: {date}</div>
              {tripType === "round-trip" && inbound && (
                <div className={s.summaryMeta}>Return: {inbound.fromCode} {"->"} {inbound.toCode} on {returnDate}</div>
              )}
            </div>
          </div>

          <div className={s.formCard}>
            <h2 className={s.sectionTitle}>Trip And Traveler Details</h2>
            <form onSubmit={handleSubmit}>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Cabin Class</label>
                  <select className={s.input} value={cabinClass} onChange={(e) => setCabinClass(e.target.value as CabinClass)}>
                    <option value="economy">Economy</option>
                    <option value="premiumEconomy">Premium Economy</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div>
                  <label className={s.label}>Travelers</label>
                  {seatsLeft <= 0 ? (
                    <p style={{ color: "#c0392b", fontWeight: 600, fontSize: "0.82rem", margin: "6px 0 0" }}>No seats available</p>
                  ) : (
                    <>
                      <input
                        className={s.input}
                        type="number"
                        min={1}
                        max={maxTravelers}
                        value={travelersCount}
                        onChange={(e) => setTravelersCount(Math.max(1, Math.min(maxTravelers, Number(e.target.value) || 1)))}
                      />
                      {seatsLeft <= 5 && (
                        <p style={{ color: "#e67e22", fontSize: "0.75rem", margin: "4px 0 0" }}>Only {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left!</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className={s.fieldFull}>
                <label className={s.label}>Contact Name</label>
                <input className={s.input} value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Contact Email</label>
                  <input className={s.input} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div>
                  <label className={s.label}>Contact Phone</label>
                  <input
                    className={s.input}
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                </div>
              </div>

              {travelers.map((traveler, idx) => (
                <div key={`traveler-${idx}`} className={s.fieldFull} style={{ marginTop: 12 }}>
                  <label className={s.label}>Traveler {idx + 1}</label>
                  <div className={s.fieldRow}>
                    <input
                      className={s.input}
                      placeholder="Full name"
                      value={traveler.name}
                      onChange={(e) => updateTraveler(idx, "name", e.target.value)}
                    />
                    <input
                      className={s.input}
                      placeholder="Age"
                      type="number"
                      min={0}
                      value={traveler.age}
                      onChange={(e) => updateTraveler(idx, "age", e.target.value)}
                    />
                  </div>
                  <div className={s.fieldRow}>
                    <select
                      className={s.input}
                      value={traveler.gender}
                      onChange={(e) => updateTraveler(idx, "gender", e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      className={s.input}
                      type="email"
                      placeholder="Traveler email (optional)"
                      value={traveler.email}
                      onChange={(e) => updateTraveler(idx, "email", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button className={s.ctaBtn} type="submit" disabled={submitting || seatsLeft <= 0}>
                {submitting ? "Processing..." : seatsLeft <= 0 ? "No Seats Available" : "Pay And Confirm"}
              </button>
            </form>
          </div>
        </div>

        <div className={s.fareCard}>
          <h2 className={s.fareTitle}>Fare Summary</h2>
          <div className={s.fareLine}>
            <span>Per traveler ({cabinClass})</span>
            <span>INR {farePerTraveler.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareLine}>
            <span>Travelers x {travelersCount}</span>
            <span>INR {baseFare.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareLine}>
            <span>Taxes (5%)</span>
            <span>INR {taxes.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareLine}>
            <span>Service fee</span>
            <span>INR {serviceFee.toLocaleString("en-IN")}</span>
          </div>
          {appliedCouponDiscount > 0 && (
            <div className={s.fareLine}>
              <span>Coupon ({couponCode})</span>
              <span>-INR {appliedCouponDiscount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className={s.fareTotal}>
            <span>Total</span>
            <span>INR {totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlightBookingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20vh 24px", textAlign: "center" }}>Loading...</div>}>
      <FlightBookingContent />
    </Suspense>
  );
}
