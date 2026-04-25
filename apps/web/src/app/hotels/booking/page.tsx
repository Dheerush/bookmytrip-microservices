"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { hotels, type Hotel } from "@/data/hotels";
import { useAuth } from "@/services/auth/context";
import { useBookingGuard } from "@/hooks/useBookingGuard";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { showToast } from "@/lib/toast";
import { getAuthHeaders } from "@/lib/http";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import s from "@/styles/booking.module.scss";

type Traveler = {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  email: string;
};

const getTodayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDays = (isoDate: string, days: number): string => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0] || isoDate;
};

const clampToTodayIso = (value: string): string => {
  if (!value) return getTodayIso();
  const today = getTodayIso();
  return value < today ? today : value;
};

const buildRoomNumber = (roomIndex: number): string => {
  const block = String.fromCharCode(65 + (roomIndex % 6));
  const serial = String(100 + ((Date.now() + roomIndex) % 899));
  return `${block}-${serial}`;
};

function createTravelers(count: number): Traveler[] {
  return Array.from({ length: count }, () => ({
    name: "",
    age: "",
    gender: "male",
    email: "",
  }));
}

function HotelBookingContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { guardAction } = useBookingGuard();
  const { processBookingAndPayment } = useBookingFlow();

  const hotelId = searchParams.get("hotelId") || "";
  const roomIndex = Math.max(0, Number(searchParams.get("roomIndex") || "0"));
  const initialNights = Math.max(1, Number(searchParams.get("nights") || "1"));
  const checkIn = clampToTodayIso(searchParams.get("checkIn") || getTodayIso());

  const [hotel, setHotel] = useState<Hotel | null>(hotels.find((h) => h.id === hotelId) || null);
  const [loading, setLoading] = useState(Boolean(hotelId && !hotel));

  const initialCouponCode = (searchParams.get("couponCode") || "").trim().toUpperCase();
  const [appliedCouponCode, setAppliedCouponCode] = useState(initialCouponCode);
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(
    Math.max(0, Number(searchParams.get("couponDiscount") || "0") || 0),
  );

  const [selectedRoomIndex, setSelectedRoomIndex] = useState(roomIndex);
  const [rooms, setRooms] = useState(1);
  const [nights, setNights] = useState(initialNights);
  const [travelersCount, setTravelersCount] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>(createTravelers(1));

  const [contactName, setContactName] = useState(user?.fullName || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hotelId || hotel) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/hotels/${hotelId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: (Hotel & { _id?: string }) };
        if (!mounted || !json.data) return;
        const item = json.data;
        setHotel({ ...item, id: item.id || item._id || hotelId });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [hotelId, hotel]);

  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === travelersCount) return prev;
      if (prev.length > travelersCount) return prev.slice(0, travelersCount);
      return [...prev, ...createTravelers(travelersCount - prev.length)];
    });
  }, [travelersCount]);

  const selectedRoom = useMemo(() => {
    if (!hotel) return null;
    return hotel.rooms[selectedRoomIndex] || hotel.rooms[0] || null;
  }, [hotel, selectedRoomIndex]);

  useEffect(() => {
    if (!selectedRoom) return;
    if (selectedRoom.available <= 0) {
      setRooms(1);
      return;
    }
    if (rooms > selectedRoom.available) {
      setRooms(selectedRoom.available);
    }
  }, [rooms, selectedRoom]);

  const requestedCheckOut = addDays(checkIn, nights);
  const stayNights = Math.max(1, nights);
  const isRoomSoldOut = (selectedRoom?.available || 0) <= 0;
  const hasEnoughRooms = selectedRoom ? rooms <= selectedRoom.available : false;

  // Compute fares — safe with 0 defaults before hotel/room loads
  const baseRoomFare = selectedRoom ? selectedRoom.price * rooms * nights : 0;
  const discount = selectedRoom ? (selectedRoom.originalPrice - selectedRoom.price) * rooms * nights : 0;
  const taxes = Math.round(baseRoomFare * 0.12);
  const serviceFee = 399;
  const subtotal = Math.max(0, baseRoomFare + taxes + serviceFee - discount);
  const appliedCoupon = Math.min(appliedCouponDiscount, subtotal);
  const totalAmount = subtotal - appliedCoupon;

  const revalidateCoupon = useCallback(async () => {
    if (!appliedCouponCode || !hotel) return;
    try {
      const res = await fetch("/api/admin/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ code: appliedCouponCode, amount: subtotal, serviceType: "hotel" }),
      });
      const data = (await res.json()) as { success?: boolean; data?: { discount?: number } };
      if (data.success && data.data?.discount != null) {
        setAppliedCouponDiscount(data.data.discount);
      }
    } catch {
      // ignore network errors silently
    }
  }, [appliedCouponCode, hotel, subtotal]);

  useEffect(() => {
    void revalidateCoupon();
  }, [revalidateCoupon]);

  if (loading) {
    return <div className={s.page} style={{ padding: "18vh 24px", textAlign: "center" }}>Loading hotel details...</div>;
  }

  if (!hotel || !selectedRoom) {
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <p>Hotel details are unavailable. Please choose your stay again.</p>
          <Link href="/hotels" className={s.backLink}>Back to hotels</Link>
        </div>
      </div>
    );
  }

  const updateTraveler = (index: number, key: keyof Traveler, value: string) => {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
  };

  const submitBooking = async (finalAmount: number) => {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast.error("Please fill contact details.");
      return;
    }
    if (checkIn < getTodayIso()) {
      showToast.error("Check-in date cannot be in the past.");
      return;
    }
    if (requestedCheckOut <= checkIn) {
      showToast.error("Check-out must be after check-in.");
      return;
    }
    if (!selectedRoom || isRoomSoldOut || !hasEnoughRooms) {
      showToast.error("Selected room type is fully booked for requested rooms.");
      return;
    }
    if (contactPhone.replace(/\D/g, "").length !== 10) {
      showToast.error("Please enter a valid 10-digit contact number.");
      return;
    }

    const hasInvalidTraveler = travelers.some((t) => !t.name.trim());
    if (hasInvalidTraveler) {
      showToast.error("Please enter all guest names.");
      return;
    }

    setSubmitting(true);
    try {
      await guardAction(async () => {
        await processBookingAndPayment(
          {
            itemId: hotel.id,
            type: "hotel",
            title: `${hotel.name} - ${selectedRoom.type}`,
            city: hotel.city,
            startDate: checkIn,
            endDate: requestedCheckOut,
            quantity: rooms,
            amount: baseRoomFare,
            couponCode: appliedCouponCode || undefined,
            discountAmount: appliedCoupon > 0 ? appliedCoupon : undefined,
            contact: {
              name: contactName.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
            passengers: travelers.map((t) => ({
              name: t.name.trim(),
              age: Number(t.age) || undefined,
              gender: t.gender,
              email: t.email.trim() || undefined,
            })),
            metadata: {
              hotelStay: {
                address: hotel.address,
                roomType: selectedRoom.type,
                roomNumber: buildRoomNumber(selectedRoomIndex),
                checkInTime: hotel.checkInTime,
                checkOutTime: hotel.checkOutTime,
                nights: stayNights,
                roomsBooked: rooms,
              },
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
      <Link href={`/hotels/${hotel.id}`} className={s.backLink}>Back to hotel</Link>
      <h1 className={s.title}>Hotel Booking</h1>

      <div className={s.inner}>
        <div>
          <div className={s.summaryCard}>
            <div className={s.summaryBody}>
              <div className={s.summaryName}>{hotel.name}</div>
              <div className={s.summaryMeta}>{hotel.city}</div>
              <div className={s.summaryMeta}>{hotel.address}</div>
              <div className={s.summaryMeta}>Room: {selectedRoom.type}</div>
              <div className={s.summaryMeta}>Check-in: {checkIn} | Check-out: {requestedCheckOut}</div>
            </div>
          </div>

          <div className={s.formCard}>
            <h2 className={s.sectionTitle}>Stay And Guest Details</h2>
            <form onSubmit={handleSubmit}>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Room Type</label>
                  <select
                    className={s.input}
                    value={selectedRoomIndex}
                    onChange={(e) => setSelectedRoomIndex(Number(e.target.value) || 0)}
                  >
                    {hotel.rooms.map((room, idx) => (
                      <option key={`${room.type}-${idx}`} value={idx}>{room.type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={s.label}>Nights</label>
                  <input
                    className={s.input}
                    type="number"
                    min={1}
                    max={30}
                    value={nights}
                    onChange={(e) => setNights(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Rooms</label>
                  <input
                    className={s.input}
                    type="number"
                    min={1}
                    max={Math.max(1, selectedRoom.available || 1)}
                    value={rooms}
                    onChange={(e) => setRooms(Math.max(1, Math.min(Math.max(1, selectedRoom.available || 1), Number(e.target.value) || 1)))}
                  />
                  <p style={{ marginTop: 6, fontSize: "0.78rem", color: isRoomSoldOut ? "#b42318" : "#667085" }}>
                    {isRoomSoldOut ? "Fully booked" : `${selectedRoom.available} room${selectedRoom.available > 1 ? "s" : ""} available`}
                  </p>
                </div>
                <div>
                  <label className={s.label}>Guests</label>
                  <input
                    className={s.input}
                    type="number"
                    min={1}
                    max={10}
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  />
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
                <div key={`guest-${idx}`} className={s.fieldFull} style={{ marginTop: 12 }}>
                  <label className={s.label}>Guest {idx + 1}</label>
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
                      placeholder="Guest email (optional)"
                      value={traveler.email}
                      onChange={(e) => updateTraveler(idx, "email", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button className={s.ctaBtn} type="submit" disabled={submitting || isRoomSoldOut || !hasEnoughRooms}>
                {submitting ? "Processing..." : isRoomSoldOut ? "Fully Booked" : "Pay And Confirm"}
              </button>
            </form>
          </div>
        </div>

        <BookingSidebar
          baseFare={baseRoomFare}
          taxes={taxes}
          serviceFee={serviceFee}
          discount={discount}
          serviceType="hotel"
          initialCouponCode={appliedCouponCode}
          initialCouponDiscount={appliedCoupon}
          onCouponApplied={({ code, discount: value }) => {
            setAppliedCouponCode(code);
            setAppliedCouponDiscount(value);
          }}
          ctaLabel={submitting ? "Processing..." : isRoomSoldOut ? "Fully Booked" : "Pay And Confirm"}
          onProceed={(netAmount) => {
            if (submitting || isRoomSoldOut || !hasEnoughRooms) return;
            void submitBooking(netAmount);
          }}
        />
      </div>
    </div>
  );
}

export default function HotelBookingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20vh 24px", textAlign: "center" }}>Loading...</div>}>
      <HotelBookingContent />
    </Suspense>
  );
}
