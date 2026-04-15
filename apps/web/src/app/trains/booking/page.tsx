"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trains, type Train } from "@/data/trains";
import { useAuth } from "@/services/auth/context";
import { useBookingGuard } from "@/hooks/useBookingGuard";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { showToast } from "@/lib/toast";
import { getAuthHeaders } from "@/lib/http";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import s from "@/styles/booking.module.scss";

type SeatClass = "sleeper" | "ac3Tier" | "ac2Tier" | "ac1st";
type BerthPreference = "noPreference" | "lower" | "middle" | "upper";

type Traveler = {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  email: string;
};

function createTravelers(count: number): Traveler[] {
  return Array.from({ length: count }, () => ({
    name: "",
    age: "",
    gender: "male",
    email: "",
  }));
}

const COACH_CODES: Record<SeatClass, string> = {
  sleeper: "S",
  ac3Tier: "B",
  ac2Tier: "A",
  ac1st: "H",
};

function generateTrainBerth(index: number, cls: SeatClass, coachNum: number, preference: BerthPreference): string {
  const lowerSeq = [1, 4, 7];
  const middleSeq = [2, 5, 8];
  const upperSeq = [3, 6];
  const preferredOrder =
    preference === "lower"
      ? [...lowerSeq, ...middleSeq, ...upperSeq]
      : preference === "middle"
        ? [...middleSeq, ...lowerSeq, ...upperSeq]
        : preference === "upper"
          ? [...upperSeq, ...lowerSeq, ...middleSeq]
          : [1, 2, 3, 4, 5, 6, 7, 8];
  const berth = preferredOrder[index % preferredOrder.length] || ((index % 8) + 1);
  return `${COACH_CODES[cls]}${coachNum}/${berth}`;
}

function parseBerthType(seatNumber: string): "Lower" | "Middle" | "Upper" | "Unknown" {
  const match = seatNumber.match(/\/(\d+)$/);
  const berth = Number(match?.[1] || 0);
  if ([1, 4, 7].includes(berth)) return "Lower";
  if ([2, 5, 8].includes(berth)) return "Middle";
  if ([3, 6].includes(berth)) return "Upper";
  return "Unknown";
}

function TrainBookingContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { guardAction } = useBookingGuard();
  const { processBookingAndPayment } = useBookingFlow();

  const trainId = searchParams.get("trainId") || "";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const defaultClass = (searchParams.get("class") as SeatClass) || "sleeper";

  const [train, setTrain] = useState<Train | null>(trains.find((t) => t.id === trainId) || null);
  const [loading, setLoading] = useState(Boolean(trainId && !train));

  const initialCouponCode = (searchParams.get("couponCode") || "").trim().toUpperCase();
  const [appliedCouponCode, setAppliedCouponCode] = useState(initialCouponCode);
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(
    Math.max(0, Number(searchParams.get("couponDiscount") || "0") || 0),
  );

  const [seatClass, setSeatClass] = useState<SeatClass>(defaultClass);
  const [berthPreference, setBerthPreference] = useState<BerthPreference>("noPreference");
  const [travelersCount, setTravelersCount] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>(createTravelers(1));

  const [contactName, setContactName] = useState(user?.fullName || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!trainId || train) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/trains/${trainId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: (Train & { _id?: string }) };
        if (!mounted || !json.data) return;
        const item = json.data;
        setTrain({ ...item, id: item.id || item._id || trainId });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [trainId, train]);

  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === travelersCount) return prev;
      if (prev.length > travelersCount) return prev.slice(0, travelersCount);
      return [...prev, ...createTravelers(travelersCount - prev.length)];
    });
  }, [travelersCount]);

  const farePerTraveler = useMemo(() => {
    if (!train) return 0;
    return train.fare[seatClass] || 0;
  }, [train, seatClass]);

  // Compute fares — safe with 0 defaults before train loads
  const baseFare = farePerTraveler * travelersCount;
  const taxes = Math.round(baseFare * 0.05);
  const serviceFee = 149;
  const subtotal = baseFare + taxes + serviceFee;
  const appliedCoupon = Math.min(appliedCouponDiscount, subtotal);
  const totalAmount = subtotal - appliedCoupon;

  const revalidateCoupon = useCallback(async () => {
    if (!appliedCouponCode || !train) return;
    try {
      const res = await fetch("/api/admin/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ code: appliedCouponCode, amount: subtotal, serviceType: "train" }),
      });
      const data = (await res.json()) as { success?: boolean; data?: { discount?: number } };
      if (data.success && data.data?.discount != null) {
        setAppliedCouponDiscount(data.data.discount);
      }
    } catch {
      // ignore network errors silently
    }
  }, [appliedCouponCode, train, subtotal]);

  useEffect(() => {
    void revalidateCoupon();
  }, [revalidateCoupon]);

  if (loading) {
    return <div className={s.page} style={{ padding: "18vh 24px", textAlign: "center" }}>Loading train details...</div>;
  }

  if (!train) {
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <p>Train not found. Please select a train again.</p>
          <Link href="/trains" className={s.backLink}>Back to trains</Link>
        </div>
      </div>
    );
  }

  const updateTraveler = (index: number, key: keyof Traveler, value: string) => {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
  };

  const seatsAvailable = train.seatsAvailable?.[seatClass] ?? 999;
  const maxTravelers = Math.min(9, seatsAvailable);

  const submitBooking = async (finalAmount: number) => {
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
    if (travelersCount > seatsAvailable) {
      showToast.error(`Only ${seatsAvailable} seat${seatsAvailable !== 1 ? "s" : ""} are available in ${seatClass} class.`);
      return;
    }

    // Generate berth assignments
    const berthSeed = train.trainNumber || train.id;
    const seedOffset = berthSeed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const groupCoach = Math.max(1, Math.floor(seedOffset / 9) + 1);
    const passengersWithBerths = travelers.map((t, idx) => ({
      name: t.name.trim(),
      age: Number(t.age) || undefined,
      gender: t.gender,
      email: t.email.trim() || undefined,
      seatNumber: generateTrainBerth(idx, seatClass, groupCoach, berthPreference),
    }));
    const passengerBerths = passengersWithBerths.map((passenger) => {
      const seat = passenger.seatNumber || "";
      const [coach = "", berthNum = ""] = seat.split("/");
      return {
        name: passenger.name,
        seatNumber: seat,
        coach,
        berthNumber: berthNum,
        berthType: parseBerthType(seat),
      };
    });

    setSubmitting(true);
    try {
      await guardAction(async () => {
        await processBookingAndPayment(
          {
            itemId: train.id,
            type: "train",
            title: `${train.name} (${train.trainNumber})`,
            fromCode: train.fromCode,
            toCode: train.toCode,
            startDate: date,
            scheduleTime: train.departureTime || undefined,
            quantity: travelersCount,
            amount: baseFare,
            couponCode: appliedCouponCode || undefined,
            discountAmount: appliedCoupon > 0 ? appliedCoupon : undefined,
            contact: {
              name: contactName.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
            passengers: passengersWithBerths,
            metadata: {
              seatClass,
              berthPreference,
              platformNumber: train.platformNumber,
              berths: passengersWithBerths.map((p) => p.seatNumber),
              passengerBerths,
              trainFromStationName: train.fromStationName || train.from,
              trainFromStationCode: train.fromStationCode || train.fromCode,
              trainToStationName: train.toStationName || train.to,
              trainToStationCode: train.toStationCode || train.toCode,
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
      <Link href="/trains" className={s.backLink}>Back to trains</Link>
      <h1 className={s.title}>Train Booking</h1>

      <div className={s.inner}>
        <div>
          <div className={s.summaryCard}>
            <div className={s.summaryBody}>
              <div className={s.summaryName}>{train.name} ({train.trainNumber})</div>
              <div className={s.summaryMeta}>{train.from} ({train.fromCode}) {"->"} {train.to} ({train.toCode})</div>
              {(train.fromStationName || train.toStationName) && (
                <div className={s.summaryMeta}>
                  Stations: {train.fromStationName || train.from} ({train.fromStationCode || train.fromCode}) {"->"} {train.toStationName || train.to} ({train.toStationCode || train.toCode})
                </div>
              )}
              {train.platformNumber && <div className={s.summaryMeta}>Platform: {train.platformNumber}</div>}
              <div className={s.summaryMeta}>Departure: {date}</div>
              <div className={s.summaryMeta}>{train.departureTime} to {train.arrivalTime} ({train.duration})</div>
            </div>
          </div>

          <div className={s.formCard}>
            <h2 className={s.sectionTitle}>Seat And Traveler Details</h2>
            <form onSubmit={handleSubmit}>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Class</label>
                  <select className={s.input} value={seatClass} onChange={(e) => setSeatClass(e.target.value as SeatClass)}>
                    <option value="sleeper">Sleeper</option>
                    <option value="ac3Tier">AC 3 Tier</option>
                    <option value="ac2Tier">AC 2 Tier</option>
                    <option value="ac1st">AC First</option>
                  </select>
                </div>
                <div>
                  <label className={s.label}>Berth Preference</label>
                  <select className={s.input} value={berthPreference} onChange={(e) => setBerthPreference(e.target.value as BerthPreference)}>
                    <option value="noPreference">No Preference</option>
                    <option value="lower">Lower</option>
                    <option value="middle">Middle</option>
                    <option value="upper">Upper</option>
                  </select>
                </div>
                <div>
                  <label className={s.label}>Travelers</label>
                  {seatsAvailable <= 0 ? (
                    <p style={{ color: "#c0392b", fontWeight: 600, fontSize: "0.82rem", margin: "6px 0 0" }}>No seats available in this class</p>
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
                      {seatsAvailable <= 5 && (
                        <p style={{ color: "#e67e22", fontSize: "0.75rem", margin: "4px 0 0" }}>Only {seatsAvailable} seat{seatsAvailable !== 1 ? "s" : ""} left!</p>
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
                    <select className={s.input} value={traveler.gender} onChange={(e) => updateTraveler(idx, "gender", e.target.value)}>
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

              <button className={s.ctaBtn} type="submit" disabled={submitting || seatsAvailable <= 0}>
                {submitting ? "Processing..." : seatsAvailable <= 0 ? "No Seats Available" : "Pay And Confirm"}
              </button>
            </form>
          </div>
        </div>

        <BookingSidebar
          baseFare={baseFare}
          taxes={taxes}
          serviceFee={serviceFee}
          serviceType="train"
          initialCouponCode={appliedCouponCode}
          initialCouponDiscount={appliedCoupon}
          onCouponApplied={({ code, discount }) => {
            setAppliedCouponCode(code);
            setAppliedCouponDiscount(discount);
          }}
          ctaLabel={submitting ? "Processing..." : seatsAvailable <= 0 ? "No Seats Available" : "Pay And Confirm"}
          onProceed={(netAmount) => {
            if (submitting || seatsAvailable <= 0) return;
            void submitBooking(netAmount);
          }}
        />
      </div>
    </div>
  );
}

export default function TrainBookingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20vh 24px", textAlign: "center" }}>Loading...</div>}>
      <TrainBookingContent />
    </Suspense>
  );
}
