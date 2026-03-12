"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Search } from "lucide-react";
import { destinations, type Destination } from "@/data/destinations";
import styles from "./page.module.scss";

type Category = "all" | "international" | "indian";
type SortKey = "price-asc" | "price-desc" | "rating" | "reviews";

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
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className={styles.image}
        />
        <span className={styles.badge}>{discount}% OFF</span>
        <div className={styles.overlay} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.location}>
          <MapPin size={14} />
          <span>{dest.name}, {dest.country}</span>
        </div>

        <div className={styles.meta}>
          <span className={styles.duration}>{dest.duration}</span>
          <span className={styles.ratingBadge}>
            <Star size={12} fill="currentColor" /> {dest.rating}
          </span>
          <span className={styles.reviews}>({dest.reviewCount.toLocaleString("en-IN")} reviews)</span>
        </div>

        <div className={styles.tags}>
          {dest.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        <div className={styles.pricing}>
          <span className={styles.original}>₹{formatPrice(dest.originalPrice)}</span>
          <span className={styles.discounted}>₹{formatPrice(dest.discountedPrice)}</span>
          <span className={styles.perPerson}>per person</span>
        </div>

        <div className={styles.cta}>
          <span className={styles.explore}>Explore Package →</span>
        </div>
      </div>
    </Link>
  );
}

export default function TopDestinationsPage() {
  const [category, setCategory] = useState<Category>("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...destinations];

    if (category !== "all") {
      list = list.filter((d) => d.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.discountedPrice - b.discountedPrice); break;
      case "price-desc": list.sort((a, b) => b.discountedPrice - a.discountedPrice); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
      case "reviews":    list.sort((a, b) => b.reviewCount - a.reviewCount); break;
    }

    return list;
  }, [category, sort, search]);

  return (
    <div className={styles.page}>
      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Handpicked Experiences</p>
          <h1 className={styles.heroTitle}>Top Destinations</h1>
          <p className={styles.heroSub}>
            Discover incredible places — from the beaches of Goa to the streets of Paris.
            Your next adventure starts here.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search destinations, countries, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.controls}>
            <div className={styles.tabs}>
              {([
                { id: "all", label: "All" },
                { id: "international", label: "International" },
                { id: "indian", label: "India" },
              ] as { id: Category; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${category === tab.id ? styles.tabActive : ""}`}
                  onClick={() => setCategory(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviewed</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        <p className={styles.count}>{filtered.length} destinations found</p>

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map((dest) => (
            <DestinationCard key={dest.id} dest={dest} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            No destinations match your search. Try different keywords.
          </div>
        )}
      </div>
    </div>
  );
}
