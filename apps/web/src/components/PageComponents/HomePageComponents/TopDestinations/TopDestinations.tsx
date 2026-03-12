"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { destinations, type Destination } from "@/data/destinations";
import styles from "./TopDestinations.module.scss";

type Tab = "international" | "indian";

const TABS: { id: Tab; label: string }[] = [
  { id: "international", label: "International" },
  { id: "indian", label: "Indian Destinations" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN").format(price);
}

function DestinationCard({ dest }: { dest: Destination }) {
  const discount = Math.round(
    ((dest.originalPrice - dest.discountedPrice) / dest.originalPrice) * 100,
  );

  return (
    <Link href={`/top-destinations/${dest.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={dest.image}
          alt={dest.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={styles.image}
        />
        <span className={styles.badge}>{discount}% OFF</span>
        <div className={styles.imageOverlay} />
      </div>

      <div className={styles.body}>
        <div className={styles.location}>
          <MapPin size={13} />
          <span>
            {dest.name}, {dest.country}
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.duration}>{dest.duration}</span>
          <span className={styles.rating}>
            <Star size={12} fill="currentColor" />
            {dest.rating}
          </span>
        </div>

        <div className={styles.tags}>
          {dest.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.pricing}>
          <span className={styles.original}>₹{formatPrice(dest.originalPrice)}</span>
          <span className={styles.discounted}>
            ₹{formatPrice(dest.discountedPrice)}
            <span className={styles.shine} aria-hidden="true" />
          </span>
          <span className={styles.perPerson}>per person</span>
        </div>
      </div>
    </Link>
  );
}

export default function TopDestinations() {
  const [activeTab, setActiveTab] = useState<Tab>("international");

  const filtered = destinations.filter((d) => d.category === activeTab);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Section header */}
        <div className={styles.header}>
          <p className={styles.eyebrow}>Curated for You</p>
          <h2 className={styles.title}>Top Destinations</h2>
          <span className={styles.divider} aria-hidden="true" />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map((dest) => (
            <DestinationCard key={dest.id} dest={dest} />
          ))}
        </div>

        <div className={styles.viewAll}>
          <Link href="/top-destinations" className={styles.viewAllBtn}>
            View All Destinations →
          </Link>
        </div>
      </div>
    </section>
  );
}
