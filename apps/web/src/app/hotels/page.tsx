"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import s from "@/styles/search.module.scss";
import { hotels, type Hotel } from "@/data/hotels";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
type SortKey = "price-asc" | "price-desc" | "rating" | "stars";

type HotelSuggestion = {
  label: string;
  value: string;
  city: string;
};

const cityOptions = Array.from(new Set(hotels.map((hotel) => hotel.city)));
const hotelSuggestionsSource: HotelSuggestion[] = [
  ...cityOptions.map((city) => ({ label: `${city} (city)`, value: city, city })),
  ...hotels.map((hotel) => ({ label: `${hotel.name} - ${hotel.city}`, value: hotel.name, city: hotel.city })),
];

const resolveHotelCity = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const byCity = cityOptions.find((city) => city.toLowerCase() === trimmed.toLowerCase());
  if (byCity) return byCity;

  const byHotel = hotels.find((hotel) => hotel.name.toLowerCase() === trimmed.toLowerCase());
  if (byHotel) return byHotel.city;

  return trimmed;
};

function HotelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Number(searchParams.get("page") || "1");

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [checkin, setCheckin] = useState(searchParams.get("checkin") || "");
  const [checkout, setCheckout] = useState(searchParams.get("checkout") || "");

  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "price-asc");
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    new Set((searchParams.get("cities") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [wifiOnly, setWifiOnly] = useState(searchParams.get("wifi") === "true");
  const [foodOnly, setFoodOnly] = useState(searchParams.get("food") === "true");
  const [poolOnly, setPoolOnly] = useState(searchParams.get("pool") === "true");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiResults, setApiResults] = useState<Hotel[] | null>(null);
  const [apiTotalPages, setApiTotalPages] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const updateQuery = (next: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (resetPage) params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    setSort((searchParams.get("sort") as SortKey) || "price-asc");
    setSelectedCities(
      new Set((searchParams.get("cities") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setWifiOnly(searchParams.get("wifi") === "true");
    setFoodOnly(searchParams.get("food") === "true");
    setPoolOnly(searchParams.get("pool") === "true");
  }, [searchParams]);

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
    updateQuery({ cities: null, wifi: null, food: null, pool: null, sort: null });
  };

  const handleSearch = () => {
    if (!resolveHotelCity(city)) {
      showToast.error("Choose a valid city or hotel from suggestions.");
      return;
    }

    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (sort !== "price-asc") params.set("sort", sort);
    if (selectedCities.size) params.set("cities", Array.from(selectedCities).join(","));
    if (wifiOnly) params.set("wifi", "true");
    if (foodOnly) params.set("food", "true");
    if (poolOnly) params.set("pool", "true");
    router.push(`/hotels${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const citySuggestions = useMemo(() => {
    const term = city.trim().toLowerCase();
    if (!term) return [] as HotelSuggestion[];

    return hotelSuggestionsSource
      .filter((option) => option.label.toLowerCase().includes(term) || option.city.toLowerCase().includes(term))
      .slice(0, 8);
  }, [city]);

  const filtered = useMemo(() => {
    let list = [...(apiResults || [])];
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
  }, [apiResults, selectedCities, wifiOnly, foodOnly, poolOnly, sort]);

  const cities = useMemo(() => {
    return Array.from(new Set((apiResults || []).map((hotel) => hotel.city)));
  }, [apiResults]);

  useEffect(() => {
    const canUseApi = Boolean(city && checkin && checkout);
    if (!canUseApi) {
      setApiResults(null);
      setApiTotalPages(null);
      setApiError(null);
      return;
    }

    const sortMap: Record<SortKey, string> = {
      "price-asc": "price_asc",
      "price-desc": "price_desc",
      rating: "rating",
      stars: "stars",
    };

    const params = new URLSearchParams({
      city: resolveHotelCity(city) || city,
      checkIn: checkin,
      checkOut: checkout,
      sort: sortMap[sort],
      page: String(page),
      limit: String(PER_PAGE),
    });

    if (wifiOnly) params.set("wifi", "true");
    if (foodOnly) params.set("foodIncluded", "breakfast");
    if (poolOnly) params.set("pool", "true");

    let mounted = true;
    const run = async () => {
      try {
        setApiLoading(true);
        setApiError(null);

        const res = await fetch(`/api/hotels/search?${params.toString()}`);
        const parsed = await parseApiResponse<{
          results: Array<{ hotel: Hotel & { _id?: string } }>;
          totalPages: number;
        }>(
          res,
          "Unable to fetch hotels right now.",
        );

        if (!mounted) return;

        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch hotels right now.");
        }

        const normalized = (parsed.payload.data.results || []).map((entry) => {
          const hotel = entry.hotel;
          return {
            ...hotel,
            id: hotel.id || hotel._id || "",
          };
        });

        setApiResults(normalized);
        setApiTotalPages(parsed.payload.data.totalPages || 1);
      } catch (error) {
        if (!mounted) return;
        setApiError(error instanceof Error ? error.message : "Unable to fetch hotels right now.");
        setApiResults(null);
        setApiTotalPages(null);
      } finally {
        if (mounted) setApiLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [city, checkin, checkout, sort, wifiOnly, foodOnly, poolOnly, page]);

  useEffect(() => {
    if (apiError) {
      showToast.error(apiError);
    }
  }, [apiError]);

  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Hotel Search Results</h1>
        <p className={s.subtitle}>{city && checkin && checkout ? `${filtered.length} hotels on this page` : "Search to load live hotels"}</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 City / Hotel</label>
            <input
              className={s.searchFieldInput}
              placeholder="Search city or hotel…"
              value={city}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onChange={(e) => setCity(e.target.value)}
            />
            {showSuggestions && citySuggestions.length > 0 && (
              <div className={s.suggestions}>
                {citySuggestions.map((option) => (
                  <button
                    key={`${option.value}-${option.city}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setCity(option.value);
                      setShowSuggestions(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
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
            {cities.map((c) => (
              <label key={c} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedCities.has(c)}
                  onChange={() => {
                    const next = toggleSet(selectedCities, c);
                    setSelectedCities(next);
                    updateQuery({ cities: next.size ? Array.from(next).join(",") : null });
                  }}
                />
                {c}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Amenities</span>
            <label className={s.filterOption}>
              <input
                type="checkbox"
                checked={wifiOnly}
                onChange={() => {
                  const next = !wifiOnly;
                  setWifiOnly(next);
                  updateQuery({ wifi: next ? "true" : null });
                }}
              />
              Free WiFi
            </label>
            <label className={s.filterOption}>
              <input
                type="checkbox"
                checked={foodOnly}
                onChange={() => {
                  const next = !foodOnly;
                  setFoodOnly(next);
                  updateQuery({ food: next ? "true" : null });
                }}
              />
              Meals Included
            </label>
            <label className={s.filterOption}>
              <input
                type="checkbox"
                checked={poolOnly}
                onChange={() => {
                  const next = !poolOnly;
                  setPoolOnly(next);
                  updateQuery({ pool: next ? "true" : null });
                }}
              />
              Pool
            </label>
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Sort By</span>
            <select
              className={s.filterSelect}
              value={sort}
              onChange={(e) => {
                const value = e.target.value as SortKey;
                setSort(value);
                updateQuery({ sort: value === "price-asc" ? null : value });
              }}
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
                onClick={() => {
                  setSort(k);
                  updateQuery({ sort: k === "price-asc" ? null : k });
                }}
              >
                {k === "price-asc" ? "Price ↑" : k === "price-desc" ? "Price ↓" : k === "rating" ? "Rating" : "Stars"}
              </button>
            ))}
          </div>

          {paged.length === 0 && <div className={s.noResults}>{city && checkin && checkout ? "No hotels match your filters." : "Enter City, Check-in and Check-out to load live hotels."}</div>}
          {apiError && <div className={s.noResults}>{apiError}</div>}
          {apiLoading && <div className={s.noResults}>Fetching latest hotels…</div>}

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
