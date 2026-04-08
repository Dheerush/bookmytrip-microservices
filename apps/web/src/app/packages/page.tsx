"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.scss";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";

const TABS = [
  { label: "All", value: "all" },
  { label: "India", value: "India" },
  { label: "Abroad", value: "Abroad" },
];

const REGION_EMOJI: Record<string, string> = {
  India: "🏰",
  Abroad: "✈️",
};

interface NormalizedPackage {
  id: string;
  name: string;
  region: string;
  cities?: string[];
  countries?: string[];
  duration: string;
  activities: string[];
  price: number;
  images: string[];
  reviews: Array<unknown>;
  guide: { rating: number; name: string };
}

interface TourApiItem {
  _id: string;
  title: string;
  city: string;
  country: string;
  durationDays: number;
  basePrice: number;
  discountPrice?: number;
  heroImage: string;
  images?: string[];
  tags?: string[];
}

function PackagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("region") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "price_asc");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [apiTours, setApiTours] = useState<TourApiItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const updateQuery = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "30");
    params.set("sort", sort);
    if (city) params.set("city", city);

    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tours/search?${params.toString()}`);
        const parsed = await parseApiResponse<{ items: TourApiItem[] }>(response, "Unable to fetch packages.");
        if (!mounted) return;
        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch packages.");
        }
        setApiTours(parsed.payload.data.items || []);
      } catch (error) {
        if (!mounted) return;
        showToast.error(error instanceof Error ? error.message : "Unable to fetch packages.");
        setApiTours([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [city, sort]);

  const mergedPackages = useMemo<NormalizedPackage[]>(() => {
    return apiTours.map((tour) => ({
      id: tour._id,
      name: tour.title,
      region: tour.country === "India" ? "India" : "Abroad",
      cities: [tour.city],
      countries: [tour.country],
      duration: `${tour.durationDays} days`,
      guide: { rating: 4.5, name: "BMT Local Expert" },
      activities: tour.tags || [],
      price: tour.discountPrice || tour.basePrice,
      images: tour.images || [tour.heroImage],
      reviews: [],
    }));
  }, [apiTours]);

  const filtered =
    activeTab === "all"
      ? mergedPackages
      : mergedPackages.filter((p) => p.region === activeTab);
  const visible = showAll ? filtered : filtered.slice(0, 6);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.eyebrow}>Handpicked for You</p>
          <h1 className={styles.title}>Travel Packages</h1>
          <span className={styles.divider} aria-hidden="true" />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`${styles.tab} ${activeTab === t.value ? styles.tabActive : ""}`}
              onClick={() => {
                setActiveTab(t.value);
                updateQuery({ region: t.value === "all" ? null : t.value });
                setShowAll(false);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            value={city}
            placeholder="Filter by city"
            onChange={(event) => {
              const next = event.target.value;
              setCity(next);
              updateQuery({ city: next || null });
            }}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d0d7e2" }}
          />
          <select
            value={sort}
            onChange={(event) => {
              const next = event.target.value;
              setSort(next);
              updateQuery({ sort: next === "price_asc" ? null : next });
            }}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d0d7e2" }}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="duration">Duration</option>
          </select>
        </div>
        {loading && <div className={styles.empty}>Fetching live packages...</div>}

        {/* Grid */}
        <div className={styles.grid}>
          {visible.length === 0 && (
            <div className={styles.empty}>No packages found.</div>
          )}
          {visible.map((pkg) => {
            const destinations =
              pkg.region === "India"
                ? pkg.cities?.join(", ")
                : pkg.countries?.join(", ") || pkg.cities?.join(", ");

            const hasImg = !!pkg.images?.[0] && !imgErrors[pkg.id];

            return (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.id}`}
                className={styles.card}
              >
                {/* Image */}
                <div className={styles.imageWrap}>
                  {hasImg ? (
                    <img
                      src={pkg.images[0]}
                      alt={pkg.name}
                      className={styles.image}
                      onError={() =>
                        setImgErrors((e) => ({ ...e, [pkg.id]: true }))
                      }
                    />
                  ) : (
                    <span className={styles.placeholder}>
                      {REGION_EMOJI[pkg.region] || "🌍"}
                    </span>
                  )}
                  <div className={styles.imageOverlay} />
                  <span className={styles.regionBadge}>{pkg.region}</span>
                </div>

                {/* Body */}
                <div className={styles.body}>
                  <h2 className={styles.name}>{pkg.name}</h2>

                  <div className={styles.location}>
                    <span className={styles.locationPin}>📍</span>
                    <span>{destinations}</span>
                  </div>

                  <div className={styles.meta}>
                    <span className={styles.duration}>{pkg.duration}</span>
                    <span className={styles.rating}>
                      ★ {pkg.guide.rating}
                    </span>
                  </div>

                  <div className={styles.tags}>
                    {pkg.activities.slice(0, 3).map((a: string) => (
                      <span key={a} className={styles.tag}>
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className={styles.pricing}>
                    <span className={styles.price}>
                      ₹{pkg.price.toLocaleString("en-IN")}
                      <span className={styles.shine} aria-hidden="true" />
                    </span>
                    <span className={styles.perPerson}>per person</span>
                  </div>

                  <div className={styles.footer}>
                    <span className={styles.guide}>
                      👤 {pkg.guide.name}
                    </span>
                    <span className={styles.reviews}>
                      {pkg.reviews.length} review
                      {pkg.reviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All */}
        {filtered.length > 6 && (
          <div className={styles.viewAll}>
            {!showAll ? (
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => setShowAll(true)}
              >
                View All {filtered.length} Packages →
              </button>
            ) : (
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => setShowAll(false)}
              >
                Show Less ↑
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.container}><div className={styles.empty}>Loading packages...</div></div></div>}>
      <PackagesContent />
    </Suspense>
  );
}