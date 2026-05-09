"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin } from "lucide-react";
import { travelDiaries, type TravelDiary } from "@/data/travelDiaries";
import styles from "./TravelDiaries.module.scss";

type Filter = "india" | "abroad" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "india", label: "India" },
  { id: "abroad", label: "Abroad" },
  { id: "all", label: "All" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DiaryCard({ diary }: { diary: TravelDiary }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={diary.image}
          alt={diary.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={styles.image}
        />
        <div className={styles.imageOverlay} />
        <span className={styles.categoryBadge}>{diary.category === "india" ? "India" : "Abroad"}</span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.cardTitle}>{diary.title}</h3>
        <p className={styles.location}><MapPin size={13} /> {diary.city}, {diary.country}</p>
        <p className={styles.excerpt}>{diary.excerpt}</p>

        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <Calendar size={12} />
            {formatDate(diary.date)}
          </span>
          <span className={styles.metaItem}>
            <Clock size={12} />
            {diary.readTime}
          </span>
        </div>

        <div className={styles.author}>
          <span className={styles.authorInitial}>
            {diary.author.charAt(0)}
          </span>
          <span className={styles.authorName}>{diary.author}</span>
        </div>

        <div className={styles.ctaRow}>
          <Link href={`/packages?destination=${encodeURIComponent(diary.city)}`} className={styles.bookBtn}>
            Book This Journey
          </Link>
          <Link href={`/travel-diaries/${diary.slug}`} className={styles.readBtn}>
            Read Full Story
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function TravelDiaries() {
  const [activeFilter, setActiveFilter] = useState<Filter>("india");

  const filtered =
    activeFilter === "all"
      ? travelDiaries
      : travelDiaries.filter((d) => d.category === activeFilter);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Section header */}
        <div className={styles.header}>
          <p className={styles.eyebrow}>Stories from the Road</p>
          <h2 className={styles.title}>Travel Diaries</h2>
          <span className={styles.divider} aria-hidden="true" />
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${activeFilter === f.id ? styles.filterActive : ""}`}
              onClick={() => setActiveFilter(f.id)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map((diary) => (
            <DiaryCard key={diary.id} diary={diary} />
          ))}
        </div>

        <div className={styles.viewAll}>
          <Link href="/travel-diaries" className={styles.viewAllBtn}>
            Read All Diaries →
          </Link>
        </div>
      </div>
    </section>
  );
}
