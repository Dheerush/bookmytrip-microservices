"use client";

import { useState } from "react";
import Link from "next/link";
import { packages } from "../../data/packages";
import styles from "./page.module.scss";

const TABS = [
  { label: "All", value: "all" },
  { label: "India", value: "India" },
  { label: "Abroad", value: "Abroad" },
];

const REGION_EMOJI: Record<string, string> = {
  India: "🏰",
  Abroad: "✈️",
};

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filtered =
    activeTab === "all"
      ? packages
      : packages.filter((p) => p.region === activeTab);
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
                setShowAll(false);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

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
                    {pkg.activities.slice(0, 3).map((a) => (
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