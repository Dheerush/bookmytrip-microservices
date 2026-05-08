"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gift, TicketPercent } from "lucide-react";
import { parseApiResponse } from "@/lib/http";
import styles from "./DealsBanner.module.scss";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  applicableOn: string[];
  endsAt: string;
  createdAt?: string;
}

interface Offer {
  _id: string;
  title: string;
  headline: string;
  details: string;
  ctaLabel?: string;
  ctaUrl?: string;
  endsAt: string;
}

const BANNER_IMAGES = [
  "/home/vacation2.jpg",
  "/recommended-destination/Abroad/dubai1.jpg",
  "/recommended-destination/India/goa1.jpg",
];

const serviceLabel = (service?: string) => {
  switch (service) {
    case "flight": return "Flights";
    case "hotel": return "Hotels";
    case "train": return "Trains";
    case "cab": return "Cabs";
    case "tour":
    case "package": return "Packages";
    default: return "All Trips";
  }
};

export default function DealsBanner() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [offersRes, couponsRes] = await Promise.all([
          fetch("/api/admin/offers/public", { cache: "no-store" }),
          fetch("/api/admin/coupons/public", { cache: "no-store" }),
        ]);

        const offersParsed = await parseApiResponse<{ items: Offer[] }>(offersRes, "Unable to fetch offers.");
        const couponsParsed = await parseApiResponse<{ items: Coupon[] }>(couponsRes, "Unable to fetch coupons.");

        if (!mounted) return;
        setOffers(offersParsed.payload?.data?.items || []);
        setCoupons(couponsParsed.payload?.data?.items || []);
      } catch {
        if (!mounted) return;
        setOffers([]);
        setCoupons([]);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const spotlight = offers[0];
  const latestCoupons = useMemo(() => {
    return [...coupons]
      .sort((left, right) => new Date(right.createdAt || right.endsAt).getTime() - new Date(left.createdAt || left.endsAt).getTime())
      .slice(0, 3);
  }, [coupons]);

  const image = BANNER_IMAGES[(spotlight?.title.length || latestCoupons.length) % BANNER_IMAGES.length];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.layout}>
          <article className={styles.heroCard} style={{ backgroundImage: `linear-gradient(110deg, rgba(8, 20, 35, 0.74), rgba(8, 20, 35, 0.18)), url('${image}')` }}>
            <p className={styles.eyebrow}>Latest Coupon Window</p>
            <h2 className={styles.title}>{spotlight?.title || "Prices Crashing On Premium Escapes"}</h2>
            <p className={styles.subtext}>{spotlight?.headline || "Working coupons and seasonal offers, pulled live so travellers only see active savings."}</p>
            <div className={styles.codeRow}>
              {latestCoupons.map((coupon) => (
                <span key={coupon._id} className={styles.liveCode}>{coupon.code}</span>
              ))}
            </div>
            <div className={styles.actions}>
              <Link href="/deals" className={styles.primaryBtn}>
                <Gift size={15} />
                Explore Deals
              </Link>
              <Link href={spotlight?.ctaUrl || "/deals"} className={styles.secondaryBtn}>
                {spotlight?.ctaLabel || "View Campaign"}
                <ArrowRight size={15} />
              </Link>
            </div>
          </article>

          <div className={styles.sideRail}>
            {latestCoupons.map((coupon) => (
              <article key={coupon._id} className={styles.couponCard}>
                <div className={styles.iconWrap}>
                  <TicketPercent size={16} />
                </div>
                <p className={styles.code}>{coupon.code}</p>
                <h3 className={styles.cardTitle}>
                  {coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`} on {serviceLabel(coupon.applicableOn[0])}
                </h3>
                <p className={styles.details}>{coupon.description}</p>
                <span className={styles.expiry}>Valid till {new Date(coupon.endsAt).toLocaleDateString("en-IN")}</span>
              </article>
            ))}
            {latestCoupons.length === 0 ? (
              <article className={styles.couponCard}>
                <div className={styles.iconWrap}>
                  <TicketPercent size={16} />
                </div>
                <p className={styles.code}>LIVE</p>
                <h3 className={styles.cardTitle}>Fresh savings show up here</h3>
                <p className={styles.details}>As soon as admin coupons are active, this rail will feature the newest working codes.</p>
              </article>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
