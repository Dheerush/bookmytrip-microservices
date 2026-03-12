"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import s from "@/styles/search.module.scss";
import { cabs, type Cab } from "@/data/cabs";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
type SortKey = "price-asc" | "price-desc" | "rating" | "seats";
const CAB_TYPES: Cab["type"][] = ["Sedan", "SUV", "MUV", "Hatchback", "Luxury"];
const FUEL_TYPES: Cab["fuelType"][] = ["Petrol", "Diesel", "CNG", "Electric"];

function CabsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [pickup, setPickup] = useState(searchParams.get("pickup") || "");
  const [drop, setDrop] = useState(searchParams.get("drop") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");

  const [sort, setSort] = useState<SortKey>("price-asc");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedFuel, setSelectedFuel] = useState<Set<string>>(new Set());
  const [acOnly, setAcOnly] = useState(false);
  const [selected, setSelected] = useState<Cab | null>(null);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSelectedFuel(new Set());
    setAcOnly(false);
    setSort("price-asc");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (pickup) params.set("pickup", pickup);
    if (drop) params.set("drop", drop);
    if (date) params.set("date", date);
    router.push(`/cabs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filtered = useMemo(() => {
    let list = [...cabs];
    if (selectedTypes.size) list = list.filter((c) => selectedTypes.has(c.type));
    if (selectedFuel.size) list = list.filter((c) => selectedFuel.has(c.fuelType));
    if (acOnly) list = list.filter((c) => c.ac);

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.baseFare - b.baseFare); break;
      case "price-desc": list.sort((a, b) => b.baseFare - a.baseFare); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
      case "seats":      list.sort((a, b) => b.seatingCapacity - a.seatingCapacity); break;
    }
    return list;
  }, [selectedTypes, selectedFuel, acOnly, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Cab Search Results</h1>
        <p className={s.subtitle}>{filtered.length} cabs available</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 Pickup</label>
            <input className={s.searchFieldInput} placeholder="Pickup location…" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 Drop</label>
            <input className={s.searchFieldInput} placeholder="Drop location…" value={drop} onChange={(e) => setDrop(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Date</label>
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
            <span className={s.filterGroupLabel}>Vehicle Type</span>
            {CAB_TYPES.map((t) => (
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
            <span className={s.filterGroupLabel}>Fuel Type</span>
            {FUEL_TYPES.map((f) => (
              <label key={f} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedFuel.has(f)}
                  onChange={() => setSelectedFuel(toggleSet(selectedFuel, f))}
                />
                {f}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Amenities</span>
            <label className={s.filterOption}>
              <input type="checkbox" checked={acOnly} onChange={() => setAcOnly(!acOnly)} />
              AC Only
            </label>
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
              <option value="rating">Rating</option>
              <option value="seats">Seating</option>
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
            {(["price-asc", "price-desc", "rating", "seats"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`${s.sortBtn} ${sort === k ? s.sortBtnActive : ""}`}
                onClick={() => setSort(k)}
              >
                {k === "price-asc" ? "Price ↑" : k === "price-desc" ? "Price ↓" : k === "rating" ? "Rating" : "Seats"}
              </button>
            ))}
          </div>

          {paged.length === 0 && <div className={s.noResults}>No cabs match your filters.</div>}

          {paged.map((cab) => (
            <div key={cab.id} className={s.card}>
              <div className={s.cabCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={s.cabImg}
                  src={cab.image}
                  alt={cab.carModel}
                  loading="lazy"
                />
                <div className={s.cabInfo}>
                  <div className={s.cabModel}>{cab.carModel}</div>
                  <div className={s.cabMeta}>{cab.city} · {cab.seatingCapacity} seats · {cab.fuelType} · {cab.luggage}</div>
                  <span className={s.cabType}>{cab.type}</span>
                  <div className={s.cabFeatures}>
                    {cab.features.map((f) => (
                      <span key={f} className={s.cabFeature}>{f}</span>
                    ))}
                  </div>
                  <div className={s.tags}>
                    <span className={s.tag}>🚗 {cab.brand}</span>
                    <span className={s.tag}>👤 {cab.driverName} (★ {cab.driverRating})</span>
                  </div>
                </div>
                <div className={s.cabPricing}>
                  <div className={s.price}>₹{cab.baseFare}</div>
                  <div className={s.cabPerKm}>+ ₹{cab.pricePerKm}/km</div>
                  <div className={s.rating}>★ {cab.rating}</div>
                  <button
                    className={s.bookBtn}
                    type="button"
                    onClick={() => setSelected(cab)}
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
          baseFare={selected?.baseFare ?? paged[0]?.baseFare ?? 0}
          taxes={Math.round((selected?.baseFare ?? paged[0]?.baseFare ?? 0) * 0.05)}
          serviceFee={49}
          discount={0}
          ctaLabel="Confirm Booking"
        />
      </div>
    </div>
  );
}

export default function CabsPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.header}><h1 className={s.title}>Loading cabs…</h1></div></div>}>
      <CabsContent />
    </Suspense>
  );
}
