"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import s from "@/styles/search.module.scss";
import { trains, type Train } from "@/data/trains";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
type SortKey = "price-asc" | "price-desc" | "duration" | "rating";
const TYPES = [...new Set(trains.map((t) => t.type))];

function TrainsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  const [sort, setSort] = useState<SortKey>("price-asc");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedClass, setSelectedClass] = useState<"sleeper" | "ac3Tier" | "ac2Tier" | "ac1st">("sleeper");
  const [selected, setSelected] = useState<Train | null>(null);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSelectedClass("sleeper");
    setSort("price-asc");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    router.push(`/trains${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filtered = useMemo(() => {
    let list = [...trains];
    if (selectedTypes.size) list = list.filter((t) => selectedTypes.has(t.type));

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.fare[selectedClass] - b.fare[selectedClass]); break;
      case "price-desc": list.sort((a, b) => b.fare[selectedClass] - a.fare[selectedClass]); break;
      case "duration":   list.sort((a, b) => a.duration.localeCompare(b.duration)); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
  }, [selectedTypes, sort, selectedClass]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const classLabel: Record<string, string> = {
    sleeper: "Sleeper",
    ac3Tier: "AC 3-Tier",
    ac2Tier: "AC 2-Tier",
    ac1st: "AC First",
  };

  const current = selected ?? paged[0] ?? null;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Train Search Results</h1>
        <p className={s.subtitle}>{filtered.length} trains found</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>🚉 From</label>
            <input className={s.searchFieldInput} placeholder="New Delhi…" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>🚉 To</label>
            <input className={s.searchFieldInput} placeholder="Mumbai CST…" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Journey</label>
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
            <span className={s.filterGroupLabel}>Train Type</span>
            {TYPES.map((t) => (
              <label key={t} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedTypes.has(t)}
                  onChange={() => setSelectedTypes(toggleSet(selectedTypes, t))}
                />
                {t}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Travel Class</span>
            {(["sleeper", "ac3Tier", "ac2Tier", "ac1st"] as const).map((c) => (
              <label key={c} className={s.filterOption}>
                <input
                  type="radio"
                  name="class"
                  checked={selectedClass === c}
                  onChange={() => setSelectedClass(c)}
                />
                {classLabel[c]}
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

          {paged.length === 0 && <div className={s.noResults}>No trains match your filters.</div>}

          {paged.map((train) => (
            <div key={train.id} className={s.card}>
              <div className={s.cardRow}>
                <div className={s.cardMain}>
                  <span className={s.trainName}>{train.name}</span>
                  <span className={s.trainNumber}> #{train.trainNumber}</span>
                  <span className={s.trainType}>{train.type}</span>

                  <div className={s.route}>
                    <div>
                      <div className={s.time}>{train.departureTime}</div>
                      <div className={s.cityCode}>{train.fromCode}</div>
                    </div>
                    <div className={s.routeLine}>
                      <span className={s.duration}>{train.duration}</span>
                      <div className={s.dashes} />
                      <span className={s.stops}>
                        {train.stops} stop{train.stops !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div>
                      <div className={s.time}>{train.arrivalTime}</div>
                      <div className={s.cityCode}>{train.toCode}</div>
                    </div>
                  </div>

                  <div className={s.pnr}>PNR: {train.pnr}</div>

                  <div className={s.fareTable}>
                    <span className={s.fareChip}>
                      SL: <strong>₹{train.fare.sleeper.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.sleeper} seats)
                    </span>
                    <span className={s.fareChip}>
                      3A: <strong>₹{train.fare.ac3Tier.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.ac3Tier} seats)
                    </span>
                    <span className={s.fareChip}>
                      2A: <strong>₹{train.fare.ac2Tier.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.ac2Tier} seats)
                    </span>
                    <span className={s.fareChip}>
                      1A: <strong>₹{train.fare.ac1st.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.ac1st} seats)
                    </span>
                  </div>

                  <div className={s.tags}>
                    <span className={s.tag}>👨 Adult: ₹{train.fareCategories[selectedClass].adult.toLocaleString("en-IN")}</span>
                    <span className={s.tag}>👶 Child: ₹{train.fareCategories[selectedClass].child.toLocaleString("en-IN")}</span>
                    <span className={s.tag}>👴 Senior: ₹{train.fareCategories[selectedClass].seniorCitizen.toLocaleString("en-IN")}</span>
                    <span className={s.tag}>🎖 Military: ₹{train.fareCategories[selectedClass].military.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className={s.cardRight}>
                  <div className={s.price}>₹{train.fare[selectedClass].toLocaleString("en-IN")}</div>
                  <div className={s.perPerson}>per adult · {classLabel[selectedClass]}</div>
                  <div className={s.rating}>★ {train.rating}</div>
                  <button
                    className={s.bookBtn}
                    type="button"
                    onClick={() => setSelected(train)}
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
          baseFare={current?.fare[selectedClass] ?? 0}
          taxes={Math.round((current?.fare[selectedClass] ?? 0) * 0.05)}
          serviceFee={149}
          ctaLabel="Proceed to Payment"
        />
      </div>
    </div>
  );
}

export default function TrainsPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.header}><h1 className={s.title}>Loading trains…</h1></div></div>}>
      <TrainsContent />
    </Suspense>
  );
}
