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

  const active = useMemo(() => items[index] || FALLBACK[0], [items, index]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Traveller Voices</p>
          <h2 className={styles.title}>Stories Travellers Still Talk About</h2>
          <p className={styles.subtext}>A premium review reel near the close of the home page, shaped to feel editorial instead of generic.</p>
        </div>

        <div className={styles.carouselWrap}>
          <div className={styles.rail}>
            {items.slice(0, 4).map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.railItem} ${idx === index ? styles.railItemActive : ""}`}
                onClick={() => setIndex(idx)}
              >
                <span className={styles.railRating}>{stars(item.rating)}</span>
                <strong>{item.title}</strong>
                <span>{item.displayName || "Verified Traveller"}</span>
              </button>
            ))}
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
