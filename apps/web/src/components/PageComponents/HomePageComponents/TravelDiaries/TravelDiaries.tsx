"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
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

const DIARY_STORY: Record<string, string> = {
  "delhi-chandni-chowk": "From Jama Masjid's sunrise azaan to late-night parathas in tiny alleys, this route captures Delhi's layered soul in one walk.",
  "darjeeling-tiger-hill": "The jeep ride before dawn, local chai at the summit, and then the Himalayas lighting up in gold make this a once-in-a-lifetime ritual.",
  "alleppey-houseboat": "Slow mornings with coconut pancakes, village canals, and sunset canoe rides turn a short trip into a deeply calming reset.",
  "jodhpur-blue-city": "Clock tower bazaars, indigo rooftops, and stories from old artisans reveal why Jodhpur feels cinematic from every angle.",
  "spiti-valley-camping": "High-altitude roads, moonlike landscapes, and stargazing camps make Spiti a journey that feels larger than life.",
  "marrakech-souks": "Handmade lamps, hidden riads, and rooftop mint tea create a sensory maze that rewards every wrong turn.",
  "kyoto-autumn": "Shrine trails, tea ceremonies, and soft autumn light over temple gardens make Kyoto quietly unforgettable.",
  "iceland-golden-circle": "A loop of geysers, black-sand detours, and geothermal lagoons with dramatic weather every few hours.",
  "santorini-sunsets": "Blue domes, cliffside paths, and sea-view tavernas that stretch into long sunset evenings.",
  "patagonia-argentina": "Glacier treks, wild wind, and vast silence define a raw adventure at the edge of the continent.",
};

const DIARY_GALLERY: Record<string, string[]> = {
  "delhi-chandni-chowk": ["/travel-diaries/india/delhi1.jpg", "/travel-diaries/india/jodhpur1.jpg"],
  "darjeeling-tiger-hill": ["/travel-diaries/india/darjeeling1.jpg", "/travel-diaries/india/spiti1.jpg"],
  "alleppey-houseboat": ["/travel-diaries/india/kerela1.jpeg", "/travel-diaries/india/delhi1.jpg"],
  "jodhpur-blue-city": ["/travel-diaries/india/jodhpur1.jpg", "/travel-diaries/india/darjeeling1.jpg"],
  "spiti-valley-camping": ["/travel-diaries/india/spiti1.jpg", "/travel-diaries/india/kerela1.jpeg"],
  "marrakech-souks": ["/travel-diaries/abroad/morocco1.jpg", "/travel-diaries/abroad/greece1.jpg"],
  "kyoto-autumn": ["/travel-diaries/abroad/kyoto1.jpg", "/travel-diaries/abroad/iceland1.jpg"],
  "iceland-golden-circle": ["/travel-diaries/abroad/iceland1.jpg", "/travel-diaries/abroad/patagonia1.jpg"],
  "santorini-sunsets": ["/travel-diaries/abroad/greece1.jpg", "/travel-diaries/abroad/morocco1.jpg"],
  "patagonia-argentina": ["/travel-diaries/abroad/patagonia1.jpg", "/travel-diaries/abroad/iceland1.jpg"],
};

function DiaryCard({ diary }: { diary: TravelDiary }) {
  const story = DIARY_STORY[diary.slug] || diary.excerpt;
  const gallery = DIARY_GALLERY[diary.slug] || [diary.image, diary.image];

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
        <p className={styles.excerpt}>{diary.excerpt}</p>
        <p className={styles.story}>{story}</p>

        <div className={styles.galleryRow}>
          {gallery.slice(0, 2).map((img, idx) => (
            <div key={`${diary.slug}-${idx}`} className={styles.galleryItem}>
              <Image
                src={img}
                alt={`${diary.title} gallery ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 45vw, 160px"
                className={styles.galleryImage}
              />
            </div>
          ))}
        </div>

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
