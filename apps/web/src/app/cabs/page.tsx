"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import s from "@/styles/search.module.scss";
import { cabs, type Cab } from "@/data/cabs";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
const MIN_LOADER_MS = 350;
type SortKey = "price-asc" | "price-desc" | "rating" | "seats";

const cabCities = Array.from(new Set(cabs.map((cab) => cab.city)));

const getTodayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNowTimeHHmm = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const clampToTodayIso = (value: string): string => {
  if (!value) return getTodayIso();
  const today = getTodayIso();
  return value < today ? today : value;
};

const CITY_COORDS: Record<string, [number, number]> = {
  "delhi": [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  "gurgaon": [28.4595, 77.0266],
  "gurugram": [28.4595, 77.0266],
  "noida": [28.5355, 77.3910],
  "faridabad": [28.4089, 77.3178],
  "ghaziabad": [28.6692, 77.4538],
  "mumbai": [19.0760, 72.8777],
  "navi mumbai": [19.0330, 73.0297],
  "pune": [18.5204, 73.8567],
  "thane": [19.2183, 72.9781],
  "kolkata": [22.5726, 88.3639],
  "howrah": [22.5958, 88.2636],
  "chennai": [13.0827, 80.2707],
  "pondicherry": [11.9416, 79.8083],
  "bengaluru": [12.9716, 77.5946],
  "bangalore": [12.9716, 77.5946],
  "mysuru": [12.2958, 76.6394],
  "mysore": [12.2958, 76.6394],
  "hyderabad": [17.3850, 78.4867],
  "secunderabad": [17.4399, 78.4983],
  "ahmedabad": [23.0225, 72.5714],
  "surat": [21.1702, 72.8311],
  "vadodara": [22.3072, 73.1812],
  "jaipur": [26.9124, 75.7873],
  "jodhpur": [26.2389, 73.0243],
  "udaipur": [24.5854, 73.7125],
  "kota": [25.2138, 75.8648],
  "lucknow": [26.8467, 80.9462],
  "kanpur": [26.4499, 80.3319],
  "agra": [27.1767, 78.0081],
  "varanasi": [25.3176, 82.9739],
  "allahabad": [25.4358, 81.8463],
  "prayagraj": [25.4358, 81.8463],
  "patna": [25.5941, 85.1376],
  "bhopal": [23.2599, 77.4126],
  "indore": [22.7196, 75.8577],
  "nagpur": [21.1458, 79.0882],
  "raipur": [21.2514, 81.6296],
  "coimbatore": [11.0168, 76.9558],
  "madurai": [9.9252, 78.1198],
  "visakhapatnam": [17.6868, 83.2185],
  "vijayawada": [16.5062, 80.6480],
  "chandigarh": [30.7333, 76.7794],
  "amritsar": [31.6340, 74.8723],
  "ludhiana": [30.9010, 75.8573],
  "dehradun": [30.3165, 78.0322],
  "haridwar": [29.9457, 78.1642],
  "rishikesh": [30.0869, 78.2676],
  "shimla": [31.1048, 77.1734],
  "manali": [32.2432, 77.1892],
  "goa": [15.2993, 74.1240],
  "panaji": [15.4989, 73.8278],
  "mangalore": [12.9141, 74.8560],
  "kochi": [9.9312, 76.2673],
  "trivandrum": [8.5241, 76.9366],
  "thiruvananthapuram": [8.5241, 76.9366],
  "kozhikode": [11.2588, 75.7804],
  "bhubaneswar": [20.2961, 85.8245],
  "puri": [19.8135, 85.8312],
  "ranchi": [23.3441, 85.3096],
  "jamshedpur": [22.8046, 86.2029],
  "guwahati": [26.1445, 91.7362],
  "shillong": [25.5788, 91.8933],
  "imphal": [24.8170, 93.9368],
  "agartala": [23.8315, 91.2868],
  "leh": [34.1526, 77.5771],
  "srinagar": [34.0837, 74.7973],
  "jammu": [32.7266, 74.8570],
};

const knownCabCities = Array.from(new Set([...cabCities, ...Object.keys(CITY_COORDS)]));

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateDistanceKm = (pickup: string, drop: string): number => {
  const from = pickup.trim().toLowerCase();
  const to = drop.trim().toLowerCase();

  if (!from || !to || from === to) return 12;

  const coordsFrom = CITY_COORDS[from];
  const coordsTo = CITY_COORDS[to];

  if (coordsFrom && coordsTo) {
    // Straight-line distance × 1.3 road factor, rounded to nearest 5 km
    const straight = haversineKm(coordsFrom[0], coordsFrom[1], coordsTo[0], coordsTo[1]);
    return Math.max(5, Math.round((straight * 1.3) / 5) * 5);
  }

  // Fallback for unknown cities: use a midpoint estimate
  return 30;
};

const levenshteinDistance = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
};

const resolveCabCity = (value: string): string | null => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();

  const exact = knownCabCities.find((city) => city.toLowerCase() === normalized);
  if (exact) return exact;

  const prefix = knownCabCities.find((city) => city.toLowerCase().startsWith(normalized));
  if (prefix) return prefix;

  const contains = knownCabCities.find((city) => city.toLowerCase().includes(normalized));
  if (contains) return contains;

  if (normalized.length >= 4) {
    let best: string | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const city of knownCabCities) {
      const score = levenshteinDistance(normalized, city.toLowerCase());
      if (score < bestScore) {
        best = city;
        bestScore = score;
      }
    }
    if (best && bestScore <= 2) return best;
  }

  return trimmed;
};

function CabsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Number(searchParams.get("page") || "1");

  const [pickup, setPickup] = useState(searchParams.get("pickup") || "Delhi");
  const [drop, setDrop] = useState(searchParams.get("drop") || "Jaipur");
  const [date, setDate] = useState(clampToTodayIso(searchParams.get("date") || getTodayIso()));
  const [pickupTime, setPickupTime] = useState(searchParams.get("time") || "10:00");
  // committedPickup only updates when user clicks Search (URL param changes)
  // so typing in the field does NOT trigger API calls
  const [committedPickup, setCommittedPickup] = useState(searchParams.get("pickup") || "Delhi");

  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "price-asc");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set((searchParams.get("types") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [selectedFuel, setSelectedFuel] = useState<Set<string>>(
    new Set((searchParams.get("fuel") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [acOnly, setAcOnly] = useState(searchParams.get("ac") === "true");
  const [activeField, setActiveField] = useState<"pickup" | "drop" | null>(null);
  const [apiResults, setApiResults] = useState<Cab[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
    setCommittedPickup(searchParams.get("pickup") || "Delhi");
    setDrop(searchParams.get("drop") || "Jaipur");
    setDate(clampToTodayIso(searchParams.get("date") || getTodayIso()));
    setPickupTime(searchParams.get("time") || "10:00");
    setSort((searchParams.get("sort") as SortKey) || "price-asc");
    setSelectedTypes(
      new Set((searchParams.get("types") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setSelectedFuel(
      new Set((searchParams.get("fuel") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setAcOnly(searchParams.get("ac") === "true");
  }, [searchParams]);

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
    updateQuery({ types: null, fuel: null, ac: null, sort: null });
  };

  const handleSearch = () => {
    const resolvedPickup = resolveCabCity(pickup);
    const resolvedDrop = resolveCabCity(drop);

    if (!resolvedPickup) {
      showToast.error("Please select a valid pickup city from suggestions.");
      return;
    }

    if (!resolvedDrop) {
      showToast.error("Please select a valid destination city from suggestions.");
      return;
    }

    if (resolvedPickup.trim().toLowerCase() === resolvedDrop.trim().toLowerCase()) {
      showToast.error("For intercity cab bookings, pickup and destination cities cannot be the same.");
      return;
    }

    const params = new URLSearchParams();
    if (resolvedPickup) params.set("pickup", resolvedPickup);
    if (resolvedDrop) params.set("drop", resolvedDrop);
    if (date) params.set("date", date);
    if (pickupTime) params.set("time", pickupTime);
    if (sort !== "price-asc") params.set("sort", sort);
    if (selectedTypes.size) params.set("types", Array.from(selectedTypes).join(","));
    if (selectedFuel.size) params.set("fuel", Array.from(selectedFuel).join(","));
    if (acOnly) params.set("ac", "true");
    router.push(`/cabs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const pickupSuggestions = useMemo(() => {
    const term = pickup.trim().toLowerCase();
    if (!term) return [] as string[];
    return cabCities.filter((city) => city.toLowerCase().includes(term)).slice(0, 6);
  }, [pickup]);

  const dropSuggestions = useMemo(() => {
    const term = drop.trim().toLowerCase();
    if (!term) return [] as string[];
    return cabCities.filter((city) => city.toLowerCase().includes(term)).slice(0, 6);
  }, [drop]);

  const filtered = useMemo(() => {
    let list = [...(apiResults || [])];
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
  }, [apiResults, selectedTypes, selectedFuel, acOnly, sort]);

  const cabTypes = useMemo(() => {
    return Array.from(new Set((apiResults || []).map((cab) => cab.type)));
  }, [apiResults]);

  const fuelTypes = useMemo(() => {
    return Array.from(new Set((apiResults || []).map((cab) => cab.fuelType)));
  }, [apiResults]);

  useEffect(() => {
    if (!committedPickup) {
      setApiResults(null);
      setApiError(null);
      return;
    }

    const resolvedPickup = resolveCabCity(committedPickup);
    const resolvedDrop = resolveCabCity(drop);
    if (
      resolvedPickup &&
      resolvedDrop &&
      resolvedPickup.trim().toLowerCase() === resolvedDrop.trim().toLowerCase()
    ) {
      setApiResults(null);
      setApiError("Pickup and destination cannot be the same.");
      return;
    }

    const estimatedDistanceKm = estimateDistanceKm(committedPickup, drop);

    const sortMap: Record<SortKey, string> = {
      "price-asc": "price_asc",
      "price-desc": "price_desc",
      rating: "rating",
      seats: "driver_rating",
    };

    const params = new URLSearchParams({
      city: resolveCabCity(committedPickup) || committedPickup,
      distanceKm: String(estimatedDistanceKm),
      sort: sortMap[sort],
      page: "1",
      limit: "50",
    });

    if (acOnly) params.set("ac", "true");

    let mounted = true;
    const run = async () => {
      const startedAt = Date.now();
      try {
        setApiLoading(true);
        setApiError(null);
        setApiResults(null);

        const res = await fetch(`/api/cabs/search?${params.toString()}`);
        const parsed = await parseApiResponse<{
          results: Array<{ cab: Cab & { _id?: string } }>;
          totalPages: number;
        }>(
          res,
          "Unable to fetch cabs right now.",
        );

        if (!mounted) return;

        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch cabs right now.");
        }

        const normalized = (parsed.payload.data.results || []).map((entry) => {
          const cab = entry.cab;
          return {
            ...cab,
            id: cab.id || cab._id || "",
          } as Cab;
        });

        setApiResults(normalized);
      } catch (error) {
        if (!mounted) return;
        setApiError(error instanceof Error ? error.message : "Unable to fetch cabs right now.");
        setApiResults(null);
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        if (mounted) setApiLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [committedPickup, drop, sort, acOnly]);

  useEffect(() => {
    if (apiError) {
      showToast.error(apiError);
    }
  }, [apiError]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    if (page <= totalPages) return;
    updateQuery({ page: totalPages > 1 ? String(totalPages) : null }, false);
  }, [page, totalPages]);

  const estimatedDistanceKm = estimateDistanceKm(pickup, drop);
  const todayIso = getTodayIso();
  const minPickupTime = date === todayIso ? getNowTimeHHmm() : "00:00";

  useEffect(() => {
    if (date !== todayIso) return;
    if (!pickupTime || pickupTime >= minPickupTime) return;
    setPickupTime(minPickupTime);
  }, [date, pickupTime, minPickupTime, todayIso]);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Cab Search Results</h1>
        <p className={s.subtitle}>{pickup ? `${filtered.length} cabs found` : "Search to load live cabs"}</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 Pickup</label>
            <input
              className={s.searchFieldInput}
              placeholder="Pickup location…"
              value={pickup}
              onFocus={() => setActiveField("pickup")}
              onBlur={() => setTimeout(() => setActiveField(null), 120)}
              onChange={(e) => setPickup(e.target.value)}
            />
            {activeField === "pickup" && pickupSuggestions.length > 0 && (
              <div className={s.suggestions}>
                {pickupSuggestions.map((city) => (
                  <button
                    key={`pickup-${city}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setPickup(city);
                      setActiveField(null);
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 Drop</label>
            <input
              className={s.searchFieldInput}
              placeholder="Drop location…"
              value={drop}
              onFocus={() => setActiveField("drop")}
              onBlur={() => setTimeout(() => setActiveField(null), 120)}
              onChange={(e) => setDrop(e.target.value)}
            />
            {activeField === "drop" && dropSuggestions.length > 0 && (
              <div className={s.suggestions}>
                {dropSuggestions.map((city) => (
                  <button
                    key={`drop-${city}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setDrop(city);
                      setActiveField(null);
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Date</label>
            <input className={s.searchFieldInput} type="date" min={todayIso} value={date} onChange={(e) => setDate(clampToTodayIso(e.target.value))} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>🕒 Pickup Time</label>
            <input
              className={s.searchFieldInput}
              type="time"
              min={minPickupTime}
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📏 Estimated Distance</label>
            <input className={s.searchFieldInput} type="text" value={`${estimatedDistanceKm} km`} readOnly />
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
            {cabTypes.map((t) => (
              <label key={t} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedTypes.has(t)}
                  onChange={() => {
                    const next = toggleSet(selectedTypes, t);
                    setSelectedTypes(next);
                    updateQuery({ types: next.size ? Array.from(next).join(",") : null });
                  }}
                />
                {t}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Fuel Type</span>
            {fuelTypes.map((f) => (
              <label key={f} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedFuel.has(f)}
                  onChange={() => {
                    const next = toggleSet(selectedFuel, f);
                    setSelectedFuel(next);
                    updateQuery({ fuel: next.size ? Array.from(next).join(",") : null });
                  }}
                />
                {f}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Amenities</span>
            <label className={s.filterOption}>
              <input
                type="checkbox"
                checked={acOnly}
                onChange={() => {
                  const next = !acOnly;
                  setAcOnly(next);
                  updateQuery({ ac: next ? "true" : null });
                }}
              />
              AC Only
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
                onClick={() => {
                  setSort(k);
                  updateQuery({ sort: k === "price-asc" ? null : k });
                }}
              >
                {k === "price-asc" ? "Price ↑" : k === "price-desc" ? "Price ↓" : k === "rating" ? "Rating" : "Seats"}
              </button>
            ))}
          </div>

          {apiLoading ? (
            <div className={s.loadingState}>
              <span className={s.spinner} aria-hidden="true" />
              <span>Fetching latest cabs...</span>
            </div>
          ) : apiError ? (
            <div className={s.noResults}>{apiError}</div>
          ) : paged.length === 0 ? (
            <div className={s.noResults}>{pickup ? "No cabs match your filters." : "Enter Pickup to load live cabs."}</div>
          ) : paged.map((cab) => (
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
                    onClick={() => {
                      if (!drop.trim()) {
                        showToast.error("Please enter a drop location before booking.");
                        return;
                      }
                      if (!date) {
                        showToast.error("Please select a travel date before booking.");
                        return;
                      }
                      if (!pickupTime) {
                        showToast.error("Please select a pickup time before booking.");
                        return;
                      }
                      const selectedPickupDateTime = new Date(`${date}T${pickupTime}:00`);
                      if (!Number.isNaN(selectedPickupDateTime.getTime()) && selectedPickupDateTime.getTime() < Date.now()) {
                        showToast.error("Pickup time cannot be in the past.");
                        return;
                      }
                      const bp = new URLSearchParams({
                        cabId: cab.id,
                        pickup,
                        drop,
                        date,
                        time: pickupTime,
                        distanceKm: String(estimateDistanceKm(pickup, drop)),
                      });
                      router.push(`/cabs/booking?${bp.toString()}`);
                    }}
                  >
                    Book Now
                  </button>
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

export default function CabsPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.header}><h1 className={s.title}>Loading cabs…</h1></div></div>}>
      <CabsContent />
    </Suspense>
  );
}
