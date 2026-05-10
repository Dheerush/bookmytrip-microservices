"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import s from "@/styles/search.module.scss";
import { type Hotel } from "@/data/hotels";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
type SortKey = "price-asc" | "price-desc" | "rating" | "stars";

type HotelSuggestion = {
  label: string;
  value: string;
  city: string;
  kind?: "city" | "hotel";
};

const CITY_ALIASES: Record<string, string> = {
  delhi: "new delhi",
  "new delhi": "new delhi",
  bombay: "mumbai",
  bengaluru: "bangalore",
};

const DEFAULT_HOTEL_CITY = "New Delhi";

const resolveHotelCity = (value: string, suggestions: HotelSuggestion[]): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalizedInput = CITY_ALIASES[trimmed.toLowerCase()] || trimmed.toLowerCase();

  const byCity = suggestions.find((option) => option.city.toLowerCase() === normalizedInput);
  if (byCity) return byCity.city;

  const byHotel = suggestions.find((option) => option.value.toLowerCase() === normalizedInput || option.label.toLowerCase().includes(normalizedInput));
  if (byHotel) return byHotel.city;

  const labelCityMatch = trimmed.match(/\s-\s(.+)$/);
  if (labelCityMatch?.[1]) {
    return labelCityMatch[1].trim();
  }

  return CITY_ALIASES[trimmed.toLowerCase()] || trimmed;
};

const getTodayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getTomorrowIso = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const clampToTodayIso = (value: string): string => {
  if (!value) return getTodayIso();
  const today = getTodayIso();
  return value < today ? today : value;
};

function HotelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Number(searchParams.get("page") || "1");
  const committedCity = searchParams.get("city") || "";
  const committedCheckin = clampToTodayIso(searchParams.get("checkin") || "");
  const committedCheckout = clampToTodayIso(searchParams.get("checkout") || "");

  const [city, setCity] = useState(searchParams.get("city") || DEFAULT_HOTEL_CITY);
  const [checkin, setCheckin] = useState(clampToTodayIso(searchParams.get("checkin") || getTodayIso()));
  const [checkout, setCheckout] = useState(clampToTodayIso(searchParams.get("checkout") || getTomorrowIso()));

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
  const [debouncedCityTerm, setDebouncedCityTerm] = useState("");
  const [liveCitySuggestions, setLiveCitySuggestions] = useState<HotelSuggestion[]>([]);
  const [knownSuggestions, setKnownSuggestions] = useState<HotelSuggestion[]>([]);

  const updateQuery = useCallback((next: Record<string, string | null>, resetPage = true) => {
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
  }, [searchParams, router, pathname]);

  useEffect(() => {
    setCity(searchParams.get("city") || DEFAULT_HOTEL_CITY);
    setCheckin(clampToTodayIso(searchParams.get("checkin") || getTodayIso()));
    setCheckout(clampToTodayIso(searchParams.get("checkout") || getTomorrowIso()));
    setSort((searchParams.get("sort") as SortKey) || "price-asc");
    setSelectedCities(
      new Set((searchParams.get("cities") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setWifiOnly(searchParams.get("wifi") === "true");
    setFoodOnly(searchParams.get("food") === "true");
    setPoolOnly(searchParams.get("pool") === "true");
  }, [searchParams]);

  useEffect(() => {
    const urlCity = searchParams.get("city");
    const urlCheckin = searchParams.get("checkin");
    const urlCheckout = searchParams.get("checkout");

    if (urlCity && urlCheckin && urlCheckout) return;

    const nextCheckin = clampToTodayIso(urlCheckin || getTodayIso());
    let nextCheckout = clampToTodayIso(urlCheckout || getTomorrowIso());

    if (nextCheckout <= nextCheckin) {
      const d = new Date(nextCheckin);
      d.setDate(d.getDate() + 1);
      nextCheckout = d.toISOString().split("T")[0] || getTomorrowIso();
    }

    updateQuery(
      {
        city: urlCity || DEFAULT_HOTEL_CITY,
        checkin: nextCheckin,
        checkout: nextCheckout,
      },
      true,
    );
  }, [searchParams, updateQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCityTerm(city.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [city]);

  useEffect(() => {
    if (!debouncedCityTerm) {
      setLiveCitySuggestions([]);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const params = new URLSearchParams({ q: debouncedCityTerm });
        const res = await fetch(`/api/hotels/suggestions?${params.toString()}`);
        const parsed = await parseApiResponse<{ suggestions?: HotelSuggestion[] }>(res, "Unable to fetch hotel suggestions.");

        if (!mounted || !parsed.ok) {
          if (mounted) setLiveCitySuggestions([]);
          return;
        }

        const next = (parsed.payload?.data?.suggestions || []).slice(0, 8);
        setLiveCitySuggestions(next);
        setKnownSuggestions((prev) => {
          const map = new Map(prev.map((item) => [`${item.kind || "mixed"}:${item.value}:${item.city}`.toLowerCase(), item]));
          next.forEach((item) => {
            map.set(`${item.kind || "mixed"}:${item.value}:${item.city}`.toLowerCase(), item);
          });
          return Array.from(map.values());
        });
      } catch {
        if (mounted) setLiveCitySuggestions([]);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [debouncedCityTerm]);

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
    const resolvedCity = resolveHotelCity(city, knownSuggestions);
    if (!resolvedCity) {
      showToast.error("Choose a valid city or hotel from suggestions.");
      return;
    }

    if (checkin < getTodayIso()) {
      showToast.error("Check-in date cannot be in the past.");
      return;
    }

    if (checkout <= checkin) {
      showToast.error("Check-out must be after check-in.");
      return;
    }

    const params = new URLSearchParams();
    if (city) params.set("city", city.trim());
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
    return liveCitySuggestions;
  }, [liveCitySuggestions]);

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
    const resolvedCity = resolveHotelCity(committedCity, knownSuggestions);
    const canUseApi = Boolean(resolvedCity && committedCheckin && committedCheckout && committedCheckout > committedCheckin);
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
      city: resolvedCity || "",
      checkIn: committedCheckin,
      checkOut: committedCheckout,
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
        const message = error instanceof Error ? error.message : "Unable to fetch hotels right now.";
        if (/validation failed/i.test(message)) {
          setApiError("Please choose a city/hotel from suggestions and valid check-in/check-out dates.");
        } else {
          setApiError(message);
        }
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
  }, [committedCity, committedCheckin, committedCheckout, sort, wifiOnly, foodOnly, poolOnly, page, knownSuggestions]);

  useEffect(() => {
    if (apiError && !/choose a city\/hotel from suggestions/i.test(apiError)) {
      showToast.error(apiError);
    }
  }, [apiError]);

  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Hotel Search Results</h1>
        <p className={s.subtitle}>{committedCity && committedCheckin && committedCheckout ? `${filtered.length} hotels on this page` : "Search to load live hotels"}</p>
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
            <input
              className={s.searchFieldInput}
              type="date"
              min={getTodayIso()}
              value={checkin}
              onChange={(e) => {
                const next = clampToTodayIso(e.target.value);
                setCheckin(next);
                if (checkout <= next) {
                  const d = new Date(next);
                  d.setDate(d.getDate() + 1);
                  setCheckout(d.toISOString().split("T")[0] || getTomorrowIso());
                }
              }}
            />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Check-out</label>
            <input
              className={s.searchFieldInput}
              type="date"
              min={checkin || getTomorrowIso()}
              value={checkout}
              onChange={(e) => setCheckout(clampToTodayIso(e.target.value))}
            />
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

          {apiLoading ? (
            <div className={s.loadingState}>
              <span className={s.spinner} aria-hidden="true" />
              <span>Fetching latest hotels...</span>
            </div>
          ) : (
            <>
              {apiError && <div className={s.noResults}>{apiError}</div>}
              {!apiError && paged.length === 0 && (
                <div className={s.noResults}>
                  {committedCity && committedCheckin && committedCheckout
                    ? "No hotels match your filters."
                    : "Enter City, Check-in and Check-out to load live hotels."}
                </div>
              )}

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
            </>
          )}
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
