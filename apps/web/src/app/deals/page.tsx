"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Sparkles, TicketPercent } from "lucide-react";
import { parseApiResponse } from "@/lib/http";
import styles from "./page.module.scss";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  endsAt: string;
  applicableOn: string[];
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

type CouponFilter = "all" | "flight" | "hotel" | "train" | "cab" | "package";
type SortBy = "recommended" | "newest";

const FILTERS: Array<{ value: CouponFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "flight", label: "Flights" },
  { value: "hotel", label: "Hotels" },
  { value: "train", label: "Trains" },
  { value: "cab", label: "Cabs" },
  { value: "package", label: "Packages" },
];

const normalizeCouponType = (value: string) => (value === "tour" ? "package" : value);

const getServicePath = (svc: string) => {
  switch (svc) {
    case "flight": return "/flights";
    case "train": return "/trains";
    case "hotel": return "/hotels";
    case "cab": return "/cabs";
    case "tour":
    case "package": return "/packages";
    default: return "/";
  }
};

const endsSoon = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 && ms <= 1000 * 60 * 60 * 24 * 3;
};

export default function DealsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recommended");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [offersRes, couponsRes] = await Promise.all([
          fetch("/api/admin/offers/public"),
          fetch("/api/admin/coupons/public"),
        ]);

        const offersParsed = await parseApiResponse<{ items: Offer[] }>(offersRes, "Unable to fetch offers.");
        const couponsParsed = await parseApiResponse<{ items: Coupon[] }>(couponsRes, "Unable to fetch coupons.");

        setOffers(offersParsed.payload?.data?.items || []);
        setCoupons(couponsParsed.payload?.data?.items || []);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const spotlight = useMemo(() => offers.slice(0, 3), [offers]);
  const filteredCoupons = useMemo(() => {
    const next = coupons.filter((coupon) => {
      if (filter === "all") return true;
      return coupon.applicableOn.map(normalizeCouponType).includes(filter);
    });

    next.sort((left, right) => {
      if (sortBy === "newest") {
        return new Date(right.createdAt || right.endsAt).getTime() - new Date(left.createdAt || left.endsAt).getTime();
      }

      const leftScore = (left.discountType === "percent" ? left.discountValue : left.discountValue / 100) + (endsSoon(left.endsAt) ? 8 : 0);
      const rightScore = (right.discountType === "percent" ? right.discountValue : right.discountValue / 100) + (endsSoon(right.endsAt) ? 8 : 0);
      return rightScore - leftScore;
    });

    return next;
  }, [coupons, filter, sortBy]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Live Deals</p>
        <h1>Deals & Offers</h1>
        <p>Active offers from admin campaigns and currently valid coupons across flights, hotels, trains, cabs, and tours.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2><Sparkles size={18} /> Seasonal Campaigns</h2>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading live offers...</p>
        ) : spotlight.length === 0 ? (
          <p className={styles.empty}>No active campaigns right now.</p>
        ) : (
          <div className={styles.offerGrid}>
            {spotlight.map((offer) => (
              <article key={offer._id} className={styles.offerCard}>
                <h3>{offer.title}</h3>
                <p className={styles.headline}>{offer.headline}</p>
                <p>{offer.details}</p>
                <div className={styles.offerFooter}>
                  <span className={styles.expiry}><Clock3 size={14} /> Ends {new Date(offer.endsAt).toLocaleDateString("en-IN")}</span>
                  {offer.ctaUrl ? (
                    <Link href={offer.ctaUrl}>{offer.ctaLabel || "Explore"}</Link>
                  ) : (
                    <Link href="/">Explore</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2><TicketPercent size={18} /> Active Coupons</h2>
          <div className={styles.controlRow}>
            <div className={styles.filterRow}>
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`${styles.filterBtn} ${filter === item.value ? styles.filterBtnActive : ""}`}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className={styles.sortWrap}>
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
                <option value="recommended">Recommended</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading live coupons...</p>
        ) : filteredCoupons.length === 0 ? (
          <p className={styles.empty}>No active coupons right now.</p>
        ) : (
          <div className={styles.couponGrid}>
            {filteredCoupons.map((coupon) => {
              const service = normalizeCouponType(coupon.applicableOn[0] || "all");
              const link = getServicePath(service);
              return (
                <article key={coupon._id} className={styles.couponCard}>
                  <div className={styles.code}>{coupon.code}</div>
                  <p className={styles.desc}>{coupon.description}</p>
                  <p className={styles.value}>
                    {coupon.discountType === "percent" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    {coupon.maxDiscount ? ` · up to ₹${coupon.maxDiscount}` : ""}
                  </p>
                  <p className={styles.tags}>
                    Applies on: {coupon.applicableOn.length > 0 ? coupon.applicableOn.join(", ") : "all services"}
                  </p>
                  <div className={styles.row}>
                    <span className={`${styles.soon} ${endsSoon(coupon.endsAt) ? styles.soonHot : ""}`}>
                      {endsSoon(coupon.endsAt) ? "Expiring soon" : `Valid till ${new Date(coupon.endsAt).toLocaleDateString("en-IN")}`}
                    </span>
                    <Link href={link}>Use this coupon</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
