"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import s from "@/styles/search.module.scss";
import { flights, type Flight } from "@/data/flights";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;

type SortKey = "price-asc" | "price-desc" | "duration" | "rating";

const AIRLINES = [...new Set(flights.map((f) => f.airline))];
const STOP_OPTIONS = ["Non-stop", "1 Stop", "2+ Stops"];

function FlightsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  const [sort, setSort] = useState<SortKey>("price-asc");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Flight | null>(null);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedAirlines(new Set());
    setSelectedStops(new Set());
    setSort("price-asc");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    router.push(`/flights${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filtered = useMemo(() => {
    let list = [...flights];

    if (selectedAirlines.size)
      list = list.filter((f) => selectedAirlines.has(f.airline));

    if (selectedStops.size) {
      list = list.filter((f) => {
        if (selectedStops.has("Non-stop") && f.stops === 0) return true;
        if (selectedStops.has("1 Stop") && f.stops === 1) return true;
        if (selectedStops.has("2+ Stops") && f.stops >= 2) return true;
        return false;
      });
    }

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.discountedPrice - b.discountedPrice); break;
      case "price-desc": list.sort((a, b) => b.discountedPrice - a.discountedPrice); break;
      case "duration":   list.sort((a, b) => a.duration.localeCompare(b.duration)); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
  }, [selectedAirlines, selectedStops, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Flight Search Results</h1>
        <p className={s.subtitle}>{filtered.length} flights found</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 From</label>
            <input className={s.searchFieldInput} placeholder="Delhi, Mumbai…" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 To</label>
            <input className={s.searchFieldInput} placeholder="Goa, Jaipur…" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Depart</label>
            <input className={s.searchFieldInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className={s.searchBarBtn} type="button" onClick={handleSearch}>🔍 Search</button>
        </div>
      </div>

      <div className={s.grid}>
        {/* ── Left: Filters ── */}
        <aside className={s.filters}>
          <h3 className={s.filterTitle}>Filters</h3>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Airlines</span>
            {AIRLINES.map((a) => (
              <label key={a} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedAirlines.has(a)}
                  onChange={() => setSelectedAirlines(toggleSet(selectedAirlines, a))}
                />
                {a}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Stops</span>
            {STOP_OPTIONS.map((o) => (
              <label key={o} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedStops.has(o)}
                  onChange={() => setSelectedStops(toggleSet(selectedStops, o))}
                />
                {o}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Sort By</span>
            <select
              className={s.filterSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="duration">Duration</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <button className={s.clearBtn} type="button" onClick={clearFilters}>
            ✕ Clear All Filters
          </button>
        </aside>

        {/* ── Center: Results ── */}
        <div className={s.results}>
          <div className={s.sortBar}>
            <span className={s.sortLabel}>Sort:</span>
            {(["price-asc", "price-desc", "duration", "rating"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`${s.sortBtn} ${sort === k ? s.sortBtnActive : ""}`}
                onClick={() => setSort(k)}
              >
                {k === "price-asc" ? "Price ↑" : k === "price-desc" ? "Price ↓" : k === "duration" ? "Duration" : "Rating"}
              </button>
            ))}
          </div>

          {paged.length === 0 && <div className={s.noResults}>No flights match your filters.</div>}

          {paged.map((flight) => (
            <div key={flight.id} className={s.card}>
              <div className={s.cardRow}>
                <div className={s.cardMain}>
                  <span className={s.airline}>{flight.airline}</span>
                  <span className={s.flightCode}> · {flight.flightCode}</span>
                  <div className={s.route}>
                    <div>
                      <div className={s.time}>{flight.departureTime}</div>
                      <div className={s.cityCode}>{flight.fromCode}</div>
                    </div>
                    <div className={s.routeLine}>
                      <span className={s.duration}>{flight.duration}</span>
                      <div className={s.dashes} />
                      <span className={s.stops}>
                        {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                        {flight.stopCities.length > 0 && ` · ${flight.stopCities.join(", ")}`}
                      </span>
                    </div>
                    <div>
                      <div className={s.time}>{flight.arrivalTime}</div>
                      <div className={s.cityCode}>{flight.toCode}</div>
                    </div>
                  </div>
                  <div className={s.tags}>
                    {flight.meals && <span className={s.tag}>🍽 Meals</span>}
                    {flight.refundable && <span className={s.tag}>↩ Refundable</span>}
                    <span className={s.tag}>💼 {flight.baggage.cabin} cabin</span>
                    <span className={s.tag}>🧳 {flight.baggage.checkin} check-in</span>
                  </div>
                </div>
                <div className={s.cardRight}>
                  <div className={s.originalPrice}>₹{flight.originalPrice.toLocaleString("en-IN")}</div>
                  <div className={s.price}>₹{flight.discountedPrice.toLocaleString("en-IN")}</div>
                  <div className={s.perPerson}>per adult</div>
                  {flight.seatsLeft <= 10 && (
                    <div className={s.seatsLeft}>{flight.seatsLeft} seats left</div>
                  )}
                  <button
                    className={s.bookBtn}
                    type="button"
                    onClick={() => setSelected(flight)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} />
        </div>

        {/* ── Right: Booking sidebar ── */}
        <BookingSidebar
          baseFare={selected?.discountedPrice ?? paged[0]?.discountedPrice ?? 0}
          taxes={Math.round((selected?.discountedPrice ?? paged[0]?.discountedPrice ?? 0) * 0.05)}
          serviceFee={249}
          discount={
            selected
              ? selected.originalPrice - selected.discountedPrice
              : paged[0]
                ? paged[0].originalPrice - paged[0].discountedPrice
                : 0
          }
          ctaLabel="Proceed to Payment"
        />
      </div>
    </div>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.header}><h1 className={s.title}>Loading flights…</h1></div></div>}>
      <FlightsContent />
    </Suspense>
  );
}
