"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Search, User } from "lucide-react";
import { travelDiaries, type TravelDiary } from "@/data/travelDiaries";
import styles from "./page.module.scss";

type Category = "all" | "india" | "abroad";
type SortKey = "date-desc" | "date-asc" | "read-time";

export default function TravelDiariesPage() {
  const [category, setCategory] = useState<Category>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...travelDiaries];

    if (category !== "all") {
      list = list.filter((d) => d.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.author.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case "date-desc": list.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc":  list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "read-time": list.sort((a, b) => parseInt(a.readTime) - parseInt(b.readTime)); break;
    }

    return list;
  }, [category, sort, search]);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Stories That Inspire</p>
          <h1 className={styles.heroTitle}>Travel Diaries</h1>
          <p className={styles.heroSub}>
            From ancient temples of Kyoto to the glaciers of Patagonia — read real stories
            from fellow travellers and plan your next escape.
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
              placeholder="Search by title, city, country, author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.controls}>
            <div className={styles.tabs}>
              {([
                { id: "all", label: "All" },
                { id: "india", label: "India" },
                { id: "abroad", label: "Abroad" },
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
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="read-time">Quick Reads</option>
            </select>
          </div>
        </div>

        <p className={styles.count}>{filtered.length} stories</p>

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map((diary) => (
            <DiaryCard key={diary.id} diary={diary} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            No stories match your search. Try different keywords.
          </div>
        )}
      </div>
    </div>
  );
}

function DiaryCard({ diary }: { diary: TravelDiary }) {
  const formatted = new Date(diary.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/travel-diaries/${diary.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={diary.image}
          alt={diary.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className={styles.image}
        />
        <span className={styles.categoryBadge}>
          {diary.category === "india" ? "🇮🇳 India" : "🌍 Abroad"}
        </span>
        <div className={styles.overlay} />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{diary.title}</h3>

        <div className={styles.location}>
          <MapPin size={13} />
          <span>{diary.city}, {diary.country}</span>
        </div>

        <p className={styles.excerpt}>{diary.excerpt}</p>

        <div className={styles.footer}>
          <div className={styles.author}>
            <User size={14} />
            <span>{diary.author}</span>
          </div>
          <div className={styles.footerMeta}>
            <span className={styles.date}>{formatted}</span>
            <span className={styles.readTime}>
              <Clock size={12} /> {diary.readTime}
            </span>
          </div>
        </div>

        <div className={styles.cta}>
          <span className={styles.readMore}>Read Story →</span>
        </div>
      </div>
    </Link>
  );
}
