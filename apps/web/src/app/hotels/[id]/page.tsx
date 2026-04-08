"use client";

import { useState, useEffect, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { hotels, type Hotel } from "@/data/hotels";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import styles from "./page.module.scss";

interface Props {
  params: Promise<{ id: string }>;
}

export default function HotelDetailPage({ params }: Props) {
  const { id } = use(params);
  const staticHotel = hotels.find((h) => h.id === id);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [nights, setNights] = useState(1);
  const [apiHotel, setApiHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(!staticHotel);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (staticHotel) return;
    let mounted = true;

    const run = async () => {
      try {
        const res = await fetch(`/api/hotels/${id}`);
        if (!res.ok) return;
        const json = await res.json() as { data?: (Hotel & { _id?: string }); success?: boolean };
        const hotel = json.data;
        if (!mounted || !hotel) return;
        setApiHotel({
          ...hotel,
          id: hotel.id || hotel._id || id,
        });
      } catch {
        // ignore and show not found state below
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [id, staticHotel]);

  if (loading) {
    return <div className={styles.page}>Loading hotel details...</div>;
  }

  const hotel = staticHotel ?? apiHotel;
  if (!hotel) return notFound();

  const room = hotel.rooms[selectedRoom];
  const baseTotal = room.price * nights;
  const discount = (room.originalPrice - room.price) * nights;
  const taxes = Math.round(baseTotal * 0.12);
  const serviceFee = 399;
  const netAmount = baseTotal + taxes + serviceFee - discount;

  const handleProceedToPayment = (_netAmount: number) => {
    const params = new URLSearchParams({
      hotelId: hotel.id,
      roomIndex: String(selectedRoom),
      nights: String(nights),
    });
    if (appliedCouponCode && appliedCouponDiscount > 0) {
      params.set("couponCode", appliedCouponCode);
      params.set("couponDiscount", String(Math.round(appliedCouponDiscount)));
    }
    router.push(`/hotels/booking?${params.toString()}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* ── LEFT COLUMN: Gallery + Info ── */}
        <div className={styles.main}>
          {/* Gallery */}
          <div className={styles.gallery}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.mainImage}
              src={hotel.images[activeImg]}
              alt={hotel.name}
            />
            <div className={styles.thumbStrip}>
              {hotel.images.map((img, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={img}
                  className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                  src={img}
                  alt={`${hotel.name} ${i + 1}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.name}>{hotel.name}</h1>
            <p className={styles.city}>{hotel.address}</p>
            <div className={styles.starRow}>
              <span className={styles.stars}>{"★".repeat(hotel.stars)}{"☆".repeat(5 - hotel.stars)}</span>
              <span className={styles.ratingBadge}>★ {hotel.rating}</span>
              <span className={styles.reviewCount}>{hotel.reviewCount.toLocaleString("en-IN")} reviews</span>
            </div>
          </div>

          {/* Description */}
          <section className={styles.section}>
            <p className={styles.description}>{hotel.description}</p>
          </section>

          {/* Amenities */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Amenities</h2>
            <div className={styles.amenitiesGrid}>
              {hotel.amenities.map((a) => (
                <span key={a} className={styles.amenityChip}>{a}</span>
              ))}
            </div>
          </section>

          {/* Room selection */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Choose Your Room</h2>
            <div className={styles.roomCards}>
              {hotel.rooms.map((r, i) => (
                <button
                  key={r.type}
                  type="button"
                  className={`${styles.roomCard} ${i === selectedRoom ? styles.roomActive : ""}`}
                  onClick={() => setSelectedRoom(i)}
                >
                  <div className={styles.roomType}>{r.type}</div>
                  <div className={styles.roomMeta}>{r.bedType} · {r.size} · Max {r.maxGuests} guests</div>
                  <div className={styles.roomPrice}>
                    <span className={styles.roomOriginal}>₹{r.originalPrice.toLocaleString("en-IN")}</span>
                    <span className={styles.roomCurrent}>₹{r.price.toLocaleString("en-IN")}</span>
                    <span className={styles.roomUnit}>/night</span>
                  </div>
                  <div className={styles.roomAvail}>{r.available} rooms left</div>
                </button>
              ))}
            </div>
          </section>

          {/* Refund Policy */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Refund Policy</h2>
            <div className={`${styles.policyBadge} ${
              hotel.refundPolicy === "full"
                ? styles.policyFull
                : hotel.refundPolicy === "partial"
                  ? styles.policyPartial
                  : styles.policyNone
            }`}>
              {hotel.refundPolicy === "full" ? "✅ Full Refund" : hotel.refundPolicy === "partial" ? "⚠️ Partial Refund" : "❌ Non-Refundable"}
            </div>
            <p className={styles.policyText}>{hotel.refundDescription}</p>
          </section>

          {/* Check-in / Check-out times */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Timings</h2>
            <p className={styles.timings}>
              Check-in: <strong>{hotel.checkInTime}</strong> &nbsp;|&nbsp; Check-out: <strong>{hotel.checkOutTime}</strong>
            </p>
          </section>

          {/* Offers */}
          {hotel.offers.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Ongoing Offers</h2>
              <div className={styles.offers}>
                {hotel.offers.map((o) => (
                  <div key={o.code} className={styles.offerCard}>
                    <div className={styles.offerTitle}>{o.title}</div>
                    <p className={styles.offerDesc}>{o.description}</p>
                    <div className={styles.offerCode}>
                      Use code: <strong>{o.code}</strong> — {o.discount}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          <div className={styles.tags}>
            {hotel.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Booking ── */}
        <div className={styles.bookingCol}>
          <div className={styles.nightsSelector}>
            <label className={styles.nightsLabel}>Duration (nights)</label>
            <input
              className={styles.nightsInput}
              type="number"
              min={1}
              max={30}
              value={nights}
              onChange={(e) => setNights(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <BookingSidebar
            baseFare={baseTotal}
            taxes={taxes}
            serviceFee={serviceFee}
            discount={discount}
            extraLines={[
              { label: `${room.type} × ${nights} night${nights > 1 ? "s" : ""}`, amount: 0 },
            ]}
            serviceType="hotel"
            ctaLabel="Proceed to Payment"
            onCouponApplied={({ code, discount: value }) => {
              setAppliedCouponCode(code);
              setAppliedCouponDiscount(value);
            }}
            onProceed={handleProceedToPayment}
          />
        </div>
      </div>
    </div>
  );
}
