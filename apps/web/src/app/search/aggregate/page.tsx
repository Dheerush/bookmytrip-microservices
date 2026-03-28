"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { aggregateSearch, AggregateSearchResult } from "@/services/search/api";
import { showToast } from "@/lib/toast";

const emptyResult: AggregateSearchResult = {
  flights: { ok: true, items: [], total: 0 },
  trains: { ok: true, items: [], total: 0 },
  hotels: { ok: true, items: [], total: 0 },
  cabs: { ok: true, items: [], total: 0 },
};

function AggregateSearchContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AggregateSearchResult>(emptyResult);
  const [loading, setLoading] = useState(false);

  const query = useMemo(
    () => ({
      categories: searchParams.get("categories") || "all",
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      date: searchParams.get("date") || undefined,
      city: searchParams.get("city") || undefined,
      checkIn: searchParams.get("checkIn") || undefined,
      checkOut: searchParams.get("checkOut") || undefined,
      cabCity: searchParams.get("cabCity") || undefined,
      distanceKm: Number(searchParams.get("distanceKm") || "12"),
      passengers: Number(searchParams.get("passengers") || "1"),
      guests: Number(searchParams.get("guests") || "2"),
      rooms: Number(searchParams.get("rooms") || "1"),
    }),
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        const data = await aggregateSearch(query);
        if (!mounted) return;
        setResult(data);
      } catch (error) {
        if (!mounted) return;
        showToast.error(error instanceof Error ? error.message : "Unable to aggregate search.");
        setResult(emptyResult);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [query]);

  const cards = [
    { title: "Flights", key: "flights" as const },
    { title: "Trains", key: "trains" as const },
    { title: "Hotels", key: "hotels" as const },
    { title: "Cabs", key: "cabs" as const },
  ];

  return (
    <section style={{ padding: "32px 18px", maxWidth: 1120, margin: "0 auto", display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Unified Search (search-service aggregate)</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>
        This page wires the frontend directly with /api/search/aggregate and shows per-entity results from the live backend.
      </p>
      {loading && <div style={{ color: "var(--text-muted)" }}>Aggregating search results...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {cards.map((card) => {
          const section = result[card.key];
          return (
            <article key={card.key} style={{ border: "1px solid var(--border-soft)", borderRadius: 12, padding: 12, background: "var(--paper)" }}>
              <h2 style={{ margin: 0, fontSize: "1rem" }}>{card.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: "1.2rem", fontWeight: 700 }}>{section.total}</p>
              <p style={{ margin: "2px 0 10px", color: section.ok ? "var(--text-muted)" : "crimson" }}>
                {section.ok ? "Healthy" : section.error || "Upstream failed"}
              </p>
              <div style={{ display: "grid", gap: 6 }}>
                {section.items.slice(0, 3).map((entry, index) => (
                  <pre
                    key={`${card.key}-${index}`}
                    style={{ margin: 0, fontSize: 11, padding: 8, borderRadius: 8, background: "#f8fafc", overflow: "auto" }}
                  >
                    {JSON.stringify(entry, null, 2)}
                  </pre>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function AggregateSearchPage() {
  return (
    <Suspense fallback={<section style={{ padding: "32px 18px" }}>Loading aggregate search...</section>}>
      <AggregateSearchContent />
    </Suspense>
  );
}
