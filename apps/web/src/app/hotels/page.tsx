"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import s from "@/styles/search.module.scss";
import { hotels } from "@/data/hotels";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
type SortKey = "price-asc" | "price-desc" | "rating" | "stars";

const CITIES = [...new Set(hotels.map((h) => h.city))];

function HotelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [checkin, setCheckin] = useState(searchParams.get("checkin") || "");
  const [checkout, setCheckout] = useState(searchParams.get("checkout") || "");

  const [sort, setSort] = useState<SortKey>("price-asc");
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [wifiOnly, setWifiOnly] = useState(false);
  const [foodOnly, setFoodOnly] = useState(false);
  const [poolOnly, setPoolOnly] = useState(false);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedCities(new Set());
    setWifiOnly(false);
    setFoodOnly(false);
    setPoolOnly(false);
    setSort("price-asc");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    router.push(`/hotels${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filtered = useMemo(() => {
    let list = [...hotels];
    if (selectedCities.size) list = list.filter((h) => selectedCities.has(h.city));
    if (wifiOnly) list = list.filter((h) => h.wifi);
    if (foodOnly) list = list.filter((h) => h.foodIncluded !== "none");
    if (poolOnly) list = list.filter((h) => h.pool);

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
      case "price-desc": list.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
      case "stars":      list.sort((a, b) => b.stars - a.stars); break;
    }
    return list;
  }, [selectedCities, wifiOnly, foodOnly, poolOnly, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Hotel Search Results</h1>
        <p className={s.subtitle}>{filtered.length} hotels found</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 City / Hotel</label>
            <input className={s.searchFieldInput} placeholder="Search city or hotel…" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Check-in</label>
            <input className={s.searchFieldInput} type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Check-out</label>
            <input className={s.searchFieldInput} type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
          </div>
          <button className={s.searchBarBtn} type="button" onClick={handleSearch}>🔍 Search</button>
        </div>
      </div>

      <div className={s.grid} style={{ gridTemplateColumns: "260px 1fr" }}>
        {/* ── Left: Filters ── */}
        <aside className={s.filters}>
          <h3 className={s.filterTitle}>Filters</h3>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>City</span>
            {CITIES.map((c) => (
              <label key={c} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedCities.has(c)}
                  onChange={() => setSelectedCities(toggleSet(selectedCities, c))}
                />
                {c}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Amenities</span>
            <label className={s.filterOption}>
              <input type="checkbox" checked={wifiOnly} onChange={() => setWifiOnly(!wifiOnly)} />
              Free WiFi
            </label>
            <label className={s.filterOption}>
              <input type="checkbox" checked={foodOnly} onChange={() => setFoodOnly(!foodOnly)} />
              Meals Included
            </label>
            <label className={s.filterOption}>
              <input type="checkbox" checked={poolOnly} onChange={() => setPoolOnly(!poolOnly)} />
              Pool
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
              <option value="stars">Stars</option>
            </select>
          </div>

          <button className={s.clearBtn} type="button" onClick={clearFilters}>
            ✕ Clear All Filters
          </button>
        </aside>
        <div className={s.results}>
          <div className={s.sortBar}>
            <span className={s.sortLabel}>Sort:</span>
            {(["price-asc", "price-desc", "rating", "stars"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`${s.sortBtn} ${sort === k ? s.sortBtnActive : ""}`}
                onClick={() => setSort(k)}
              >
                {k === "price-asc" ? "Price ↑" : k === "price-desc" ? "Price ↓" : k === "rating" ? "Rating" : "Stars"}
              </button>
            ))}
          </div>

          {paged.length === 0 && <div className={s.noResults}>No hotels match your filters.</div>}

          {paged.map((hotel) => (
            <div key={hotel.id} className={s.card}>
              <div className={s.hotelCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={s.hotelImg}
                  src={hotel.image}
                  alt={hotel.name}
                  loading="lazy"
                />
                <div className={s.hotelInfo}>
                  <div className={s.hotelName}>{hotel.name}</div>
                  <div className={s.hotelCity}>{hotel.city}</div>
                  <div className={s.stars}>
                    {"★".repeat(hotel.stars)}{"☆".repeat(5 - hotel.stars)}
                  </div>
                  <div className={s.amenities}>
                    {hotel.amenities.slice(0, 5).map((a) => (
                      <span key={a} className={s.amenity}>{a}</span>
                    ))}
                    {hotel.amenities.length > 5 && (
                      <span className={s.amenity}>+{hotel.amenities.length - 5} more</span>
                    )}
                  </div>
                  <span className={`${s.foodBadge} ${hotel.foodIncluded !== "none" ? s.foodIncluded : s.foodNone}`}>
                    {hotel.foodIncluded === "all-meals"
                      ? "🍽 All Meals Included"
                      : hotel.foodIncluded === "breakfast"
                        ? "🥐 Breakfast Included"
                        : "No Meals"}
                  </span>
                </div>
                <div className={s.hotelPricing}>
                  <div className={s.originalPrice}>₹{hotel.originalPrice.toLocaleString("en-IN")}</div>
                  <div className={s.price}>₹{hotel.pricePerNight.toLocaleString("en-IN")}</div>
                  <div className={s.perPerson}>per night</div>
                  <div className={s.rating}>★ {hotel.rating}</div>
                  <Link href={`/hotels/${hotel.id}`} className={s.detailsLink}>
                    More Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.header}><h1 className={s.title}>Loading hotels…</h1></div></div>}>
      <HotelsContent />
    </Suspense>
  );
}
