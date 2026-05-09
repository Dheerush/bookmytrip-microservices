"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import styles from "./TestimonialsCarousel.module.scss";

type FeaturedReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  itemType: string;
  itemId: string;
  displayName?: string;
  createdAt?: string;
};

const FALLBACK: FeaturedReview[] = [
  {
    id: "f-1",
    rating: 5,
    title: "Seamless End-to-End Booking",
    comment: "From choosing flights to local transfers and hotel check-in, everything was perfectly coordinated and stress-free.",
    itemType: "tour",
    itemId: "featured-1",
    displayName: "Aarav M.",
  },
  {
    id: "f-2",
    rating: 5,
    title: "Premium Stay Experience",
    comment: "Room quality, check-in support, and curated city experiences exceeded expectations for our family vacation.",
    itemType: "hotel",
    itemId: "featured-2",
    displayName: "Naina R.",
  },
  {
    id: "f-3",
    rating: 4,
    title: "Reliable International Package",
    comment: "Great itinerary planning and responsive support. The team handled our international travel details very professionally.",
    itemType: "package",
    itemId: "featured-3",
    displayName: "Karan S.",
  },
];

function stars(count: number) {
  return "★".repeat(Math.max(1, Math.min(5, Math.round(count))));
}

const serviceLabel = (value: string) => {
  switch (value) {
    case "tour":
    case "package": return "Packages";
    case "flight": return "Flights";
    case "hotel": return "Hotels";
    case "train": return "Trains";
    case "cab": return "Cabs";
    default: return value;
  }
};

type CategoryInsight = {
  key: string;
  label: string;
  average: number;
  count: number;
};

export default function TestimonialsCarousel() {
  const [items, setItems] = useState<FeaturedReview[]>(FALLBACK);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch("/api/reviews/featured?limit=8", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json() as { data?: { items?: FeaturedReview[] } };
        const next = json.data?.items || [];
        if (!mounted || next.length === 0) return;
        setItems(next);
      } catch {
        // keep fallback cards
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (index >= items.length) {
      setIndex(0);
    }
  }, [index, items.length]);

  const active = useMemo(() => items[index] || FALLBACK[0], [items, index]);

  const metrics = useMemo(() => {
    const total = items.length;
    const avgRating = total > 0
      ? items.reduce((sum, item) => sum + item.rating, 0) / total
      : 0;
    const recommendScore = total > 0
      ? Math.round((items.filter((item) => item.rating >= 4).length / total) * 100)
      : 0;

    const categories = items.reduce<Map<string, { label: string; sum: number; count: number }>>((acc, item) => {
      const key = item.itemType || "other";
      const current = acc.get(key) || {
        label: serviceLabel(key),
        sum: 0,
        count: 0,
      };
      current.sum += item.rating;
      current.count += 1;
      acc.set(key, current);
      return acc;
    }, new Map());

    const categoryRatings: CategoryInsight[] = Array.from(categories.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        average: value.sum / value.count,
        count: value.count,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.average - a.average;
      })
      .slice(0, 3);

    const uniqueTravellers = new Set(
      items
        .map((item) => item.displayName)
        .filter((name): name is string => Boolean(name && name.trim())),
    ).size;

    return {
      total,
      avgRating,
      recommendScore,
      categoryRatings,
      uniqueTravellers,
    };
  }, [items]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Traveller Voices</p>
          <h2 className={styles.title}>Stories Travellers Still Talk About</h2>
          <p className={styles.subtext}>A premium review reel near the close of the home page, shaped to feel editorial instead of generic.</p>
        </div>

        <div className={styles.carouselWrap}>
          <div className={styles.insightsCol}>
            <article className={`${styles.insightCard} ${styles.insightCardPrimary}`}>
              <p className={styles.cardLabel}>Overall traveller rating</p>
              <div className={styles.scoreRow}>
                <p className={styles.bigScore}>{metrics.avgRating.toFixed(1)}</p>
                <p className={styles.scoreStars}>{stars(metrics.avgRating)}</p>
              </div>
              <p className={styles.cardHint}>Based on {metrics.total} featured stories</p>
            </article>

            <article className={styles.insightCard}>
              <p className={styles.cardLabel}>Average rating by category</p>
              <div className={styles.categoryList}>
                {metrics.categoryRatings.map((category) => (
                  <div className={styles.categoryItem} key={category.key}>
                    <div className={styles.categoryHead}>
                      <span>{category.label}</span>
                      <span>{category.average.toFixed(1)}</span>
                    </div>
                    <div className={styles.categoryTrack}>
                      <span style={{ width: `${Math.max(8, (category.average / 5) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.insightCard}>
              <p className={styles.cardLabel}>Booking confidence</p>
              <p className={styles.bigPercent}>{metrics.recommendScore}%</p>
              <p className={styles.cardHint}>rated 4 stars or more</p>
              <p className={styles.cardHint}>{metrics.uniqueTravellers || metrics.total} verified travellers</p>
            </article>
          </div>

          <div className={styles.stage}>
            <AnimatePresence mode="wait">
              <motion.article
                key={active.id}
                className={styles.card}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <span className={styles.rating}>{stars(active.rating)}</span>
                <h3 className={styles.cardTitle}>{active.title}</h3>
                <p className={styles.comment}>{active.comment}</p>
                <div className={styles.metaRow}>
                  <span>{active.displayName || "Verified Traveller"}</span>
                  <span className={styles.dot} />
                  <span>{serviceLabel(active.itemType)}</span>
                </div>
                <div className={styles.footerRow}>
                  <div className={styles.dots} role="tablist" aria-label="Testimonials">
                    {items.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.dotBtn} ${idx === index ? styles.dotActive : ""}`}
                        onClick={() => setIndex(idx)}
                        aria-label={`Show testimonial ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <Link href="/reviews" className={styles.linkBtn}>
                    Read Reviews
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
