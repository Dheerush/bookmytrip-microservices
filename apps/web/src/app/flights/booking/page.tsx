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
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
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

const getTodayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

function getFlightSeatPool(cabin: CabinClass): string[] {
  const rows: Record<CabinClass, { start: number; end: number; cols: string[] }> = {
    business: { start: 1, end: 4, cols: ["A", "B", "C", "D"] },
    premiumEconomy: { start: 5, end: 9, cols: ["A", "B", "C", "D", "E", "F"] },
    economy: { start: 10, end: 35, cols: ["A", "B", "C", "D", "E", "F"] },
  };

  const cfg = rows[cabin];
  const seats: string[] = [];
  for (let row = cfg.start; row <= cfg.end; row += 1) {
    cfg.cols.forEach((col) => seats.push(`${row}${col}`));
  }
  return seats;
}

const getNextTravelerIndex = (assignments: Array<string | null>, currentIndex: number): number => {
  const nextEmptyIndex = assignments.findIndex((entry) => !entry);
  if (nextEmptyIndex >= 0) return nextEmptyIndex;
  return Math.min(currentIndex, Math.max(0, assignments.length - 1));
};

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
  const initialCouponCode = (searchParams.get("couponCode") || "").trim().toUpperCase();
  const [appliedCouponCode, setAppliedCouponCode] = useState(initialCouponCode);
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(
    Math.max(0, Number(searchParams.get("couponDiscount") || "0") || 0),
  );

  const [outbound, setOutbound] = useState<Flight | null>(flights.find((f) => f.id === outboundId) || null);
  const [inbound, setInbound] = useState<Flight | null>(flights.find((f) => f.id === returnId) || null);
  const [loading, setLoading] = useState(Boolean(outboundId && !outbound));

  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [travelersCount, setTravelersCount] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>(createTravelers(1));
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Array<string | null>>([null]);
  const [activeTravelerIndex, setActiveTravelerIndex] = useState(0);

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

  useEffect(() => {
    setSelectedSeats((prev) => {
      const trimmed = prev.slice(0, travelersCount);
      while (trimmed.length < travelersCount) {
        trimmed.push(null);
      }
      return trimmed;
    });
  }, [travelersCount]);

  useEffect(() => {
    setActiveTravelerIndex((prev) => Math.min(prev, Math.max(0, travelersCount - 1)));
  }, [travelersCount]);

  useEffect(() => {
    setSelectedSeats(Array.from({ length: travelersCount }, () => null));
    setActiveTravelerIndex(0);
  }, [cabinClass, travelersCount]);

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
  const boundedCouponDiscount = Math.min(appliedCouponDiscount, totalBeforeCoupon);
  const totalAmount = totalBeforeCoupon - boundedCouponDiscount;

  const revalidateCoupon = useCallback(async () => {
    if (!appliedCouponCode || !outbound) return;
    try {
      const res = await fetch("/api/admin/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ code: appliedCouponCode, amount: totalBeforeCoupon, serviceType: "flight" }),
      });
      const data = (await res.json()) as { success?: boolean; data?: { discount?: number } };
      if (data.success && data.data?.discount != null) {
        setAppliedCouponDiscount(data.data.discount);
      }
    } catch {
      // ignore network errors silently
    }
  }, [appliedCouponCode, outbound, totalBeforeCoupon]);

  useEffect(() => {
    void revalidateCoupon();
  }, [revalidateCoupon]);

  const seatPool = useMemo(() => getFlightSeatPool(cabinClass), [cabinClass]);

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

  const toggleSeat = (seat: string) => {
    setSelectedSeats((prev) => {
      const next = [...prev];
      const seatOwnerIndex = next.findIndex((entry) => entry === seat);

      if (seatOwnerIndex === activeTravelerIndex) {
        next[activeTravelerIndex] = null;
        setActiveTravelerIndex(getNextTravelerIndex(next, activeTravelerIndex));
        return next;
      }

      if (seatOwnerIndex >= 0) {
        next[seatOwnerIndex] = null;
      }

      next[activeTravelerIndex] = seat;
      setActiveTravelerIndex(getNextTravelerIndex(next, Math.min(activeTravelerIndex + 1, travelersCount - 1)));
      return next;
    });
  };

  const submitBooking = async (finalAmount: number) => {
    const today = getTodayIso();
    if (date < today) {
      showToast.error("Departure date cannot be in the past.");
      return;
    }
    if (tripType === "round-trip") {
      if (returnDate < today) {
        showToast.error("Return date cannot be in the past.");
        return;
      }
      if (returnDate < date) {
        showToast.error("Return date cannot be before departure date.");
        return;
      }
    }

    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast.error("Please fill contact details.");
      return;
    }
    if (contactPhone.replace(/\D/g, "").length !== 10) {
      showToast.error("Please enter a valid 10-digit contact number.");
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

    // Use selected seats if provided; else generate unique seat assignments.
    const seatSeed = outbound.flightCode || outbound.id;
    const autoSeats: string[] = [];
    for (let idx = 0; idx < travelersCount; idx += 1) {
      let candidate = generateFlightSeat(idx, cabinClass, seatSeed);
      let tries = 0;
      while (autoSeats.includes(candidate) && tries < 500) {
        tries += 1;
        candidate = generateFlightSeat(idx + tries, cabinClass, `${seatSeed}-${tries}`);
      }
      if (!autoSeats.includes(candidate)) {
        autoSeats.push(candidate);
      }
    }
    const hasManualSeatAssignments = selectedSeats.every((entry): entry is string => Boolean(entry));
    const assignedSeats = hasManualSeatAssignments ? selectedSeats : autoSeats;

    if (new Set(assignedSeats).size !== assignedSeats.length) {
      showToast.error("Seat assignment conflict detected. Please reselect seats.");
      return;
    }

    const passengersWithSeats = travelers.map((t, idx) => ({
      name: t.name.trim(),
      age: Number(t.age) || undefined,
      gender: t.gender,
      email: t.email.trim() || undefined,
      seatNumber: assignedSeats[idx],
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
            couponCode: appliedCouponCode || undefined,
            discountAmount: boundedCouponDiscount,
            contact: {
              name: contactName.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
            passengers: passengersWithSeats,
            metadata: {
              seatClass: cabinClass,
              boardingTerminal: outbound.boardingTerminal,
              flightTravel: {
                boardingAirport: outbound.boardingAirport || `${outbound.from} (${outbound.fromCode})`,
                destinationAirport: `${outbound.to} (${outbound.toCode})`,
                boardingTerminal: outbound.boardingTerminal,
              },
              seats: passengersWithSeats.map((p) => p.seatNumber),
            },
          },
          finalAmount,
        );
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitBooking(totalAmount);
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

              <div className={s.fieldFull} style={{ marginTop: 14 }}>
                <label className={s.label}>Seat Selection</label>
                <button
                  type="button"
                  className={s.input}
                  onClick={() => setSeatModalOpen(true)}
                  style={{ textAlign: "left", cursor: "pointer", fontWeight: 600 }}
                >
                  {selectedSeats.some(Boolean)
                    ? `Assigned: ${selectedSeats
                      .map((seat, idx) => (seat ? `${travelers[idx]?.name?.trim() || `Traveler ${idx + 1}`}: ${seat}` : null))
                      .filter(Boolean)
                      .join(" | ")}`
                    : "Choose Seat"}
                </button>
                <p style={{ marginTop: 6, fontSize: "0.75rem", color: "#6b7f93" }}>
                  Select {travelersCount} seat{travelersCount !== 1 ? "s" : ""}. If skipped, seats are auto-assigned. Selecting another seat auto-replaces the latest selection.
                </p>
              </div>

              <button className={s.ctaBtn} type="submit" disabled={submitting || seatsLeft <= 0}>
                {submitting ? "Processing..." : seatsLeft <= 0 ? "No Seats Available" : "Pay And Confirm"}
              </button>
            </form>
          </div>
        </div>

        {seatModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 18, 40, 0.55)",
              zIndex: 60,
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
            onClick={() => setSeatModalOpen(false)}
          >
            <div
              style={{
                width: "min(760px, 100%)",
                maxHeight: "80vh",
                overflow: "auto",
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid #d7e2f0",
                padding: 18,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#0f2b46" }}>Choose Your Seats ({cabinClass})</h3>
                <button type="button" onClick={() => setSeatModalOpen(false)} style={{ border: 0, background: "transparent", fontWeight: 700, cursor: "pointer" }}>Close</button>
              </div>
              <p style={{ margin: "0 0 12px", color: "#5b6f86", fontSize: "0.85rem" }}>
                Assign seats per traveler. Assigned: {selectedSeats.filter(Boolean).length}/{travelersCount}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 14 }}>
                {travelers.map((traveler, idx) => {
                  const assignedSeat = selectedSeats[idx];
                  const active = idx === activeTravelerIndex;
                  return (
                    <button
                      key={`traveler-seat-${idx}`}
                      type="button"
                      onClick={() => setActiveTravelerIndex(idx)}
                      style={{
                        borderRadius: 10,
                        border: active ? "1px solid #134b87" : "1px solid #d7e2f0",
                        background: active ? "#eef6ff" : "#fff",
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#0f2b46" }}>{traveler.name.trim() || `Traveler ${idx + 1}`}</div>
                      <div style={{ marginTop: 4, fontSize: "0.8rem", color: "#5b6f86" }}>{assignedSeat || "Seat not assigned"}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(56px, 1fr))", gap: 8 }}>
                {seatPool.map((seat) => {
                  const seatOwnerIndex = selectedSeats.findIndex((entry) => entry === seat);
                  const active = seatOwnerIndex >= 0;
                  const ownedByActiveTraveler = seatOwnerIndex === activeTravelerIndex;
                  return (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => toggleSeat(seat)}
                      style={{
                        borderRadius: 8,
                        border: active ? "1px solid #134b87" : "1px solid #c9d9ee",
                        background: ownedByActiveTraveler ? "#d7ebff" : active ? "#eef3f8" : "#fff",
                        color: "#0f2b46",
                        fontWeight: 600,
                        padding: "9px 6px",
                        cursor: "pointer",
                      }}
                    >
                      <div>{seat}</div>
                      {seatOwnerIndex >= 0 && (
                        <div style={{ marginTop: 4, fontSize: "0.68rem", color: "#5b6f86" }}>
                          T{seatOwnerIndex + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <BookingSidebar
          baseFare={baseFare}
          taxes={taxes}
          serviceFee={serviceFee}
          serviceType="flight"
          initialCouponCode={appliedCouponCode}
          initialCouponDiscount={boundedCouponDiscount}
          onCouponApplied={({ code, discount }) => {
            setAppliedCouponCode(code);
            setAppliedCouponDiscount(discount);
          }}
          ctaLabel={submitting ? "Processing..." : "Pay And Confirm"}
          onProceed={(netAmount) => {
            if (submitting || seatsLeft <= 0) return;
            void submitBooking(netAmount);
          }}
        />
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
