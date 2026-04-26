"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import s from "@/styles/search.module.scss";
import { trains, type Train } from "@/data/trains";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;
type SortKey = "price-asc" | "price-desc" | "duration" | "rating";

type TrainLocationOption = {
  city: string;
  station: string;
  code: string;
  label: string;
  isAllStations: boolean;
};

const normalizeTrainCity = (station: string): string => {
  const clean = station.trim();
  if (!clean) return "";

  if (/delhi|nizamuddin/i.test(clean)) return "Delhi";
  if (/mumbai|cst|central|ltt/i.test(clean)) return "Mumbai";
  if (/howrah|sealdah/i.test(clean)) return "Kolkata";
  if (/chennai/i.test(clean)) return "Chennai";
  if (/bengaluru|yesvantpur/i.test(clean)) return "Bengaluru";

  return clean.split(" ")[0] || clean;
};

const trainLocationOptions: TrainLocationOption[] = Array.from(
  new Map(
    trains
      .flatMap((train) => [
        {
          city: normalizeTrainCity(train.from),
          station: train.from,
          code: train.fromCode,
          label: `${train.from} (${train.fromCode})`,
          isAllStations: false,
        },
        {
          city: normalizeTrainCity(train.to),
          station: train.to,
          code: train.toCode,
          label: `${train.to} (${train.toCode})`,
          isAllStations: false,
        },
      ])
      .map((option) => [`${option.station.toLowerCase()}-${option.code.toUpperCase()}`, option]),
  ).values(),
);

const trainCityOptions: TrainLocationOption[] = Array.from(
  new Map(
    trainLocationOptions.map((option) => [
      option.city.toLowerCase(),
      {
        city: option.city,
        station: option.station,
        code: option.code,
        label: `${option.city} (All Stations)`,
        isAllStations: true,
      },
    ]),
  ).values(),
);

const resolveTrainCode = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3,4}$/.test(upper)) return upper;

  const byStation = trainLocationOptions.find((option) => option.station.toLowerCase() === trimmed.toLowerCase());
  if (byStation) return byStation.code.toUpperCase();

  const byCode = trainLocationOptions.find((option) => option.code.toUpperCase() === upper);
  if (byCode) return byCode.code.toUpperCase();

  const byCity = trainCityOptions.find((option) => option.city.toLowerCase() === trimmed.toLowerCase());
  if (byCity) return byCity.code.toUpperCase();

  return null;
};

const isSameTrainRoute = (fromValue: string, toValue: string): boolean => {
  const fromCode = resolveTrainCode(fromValue);
  const toCode = resolveTrainCode(toValue);
  if (!fromCode || !toCode) return false;
  return fromCode === toCode;
};

const getTodayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const clampTrainDate = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const today = getTodayIso();
  return trimmed < today ? today : trimmed;
};

function TrainsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Number(searchParams.get("page") || "1");

  const [from, setFrom] = useState(searchParams.get("from") || "New Delhi");
  const [to, setTo] = useState(searchParams.get("to") || "Mumbai Central");
  const [date, setDate] = useState(clampTrainDate(searchParams.get("date") || "") || getTodayIso());

  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "price-asc");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set((searchParams.get("types") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [selectedClass, setSelectedClass] = useState<"sleeper" | "ac3Tier" | "ac2Tier" | "ac1st">(
    (searchParams.get("class") as "sleeper" | "ac3Tier" | "ac2Tier" | "ac1st") || "sleeper",
  );
  const [selected, setSelected] = useState<Train | null>(null);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [apiResults, setApiResults] = useState<Train[] | null>(null);
  const [apiTotalPages, setApiTotalPages] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Always true — trains load on mount with defaults so users see results immediately
  const [hasSearched, setHasSearched] = useState(true);
  const [committedFrom, setCommittedFrom] = useState(searchParams.get("from") || "New Delhi");
  const [committedTo, setCommittedTo] = useState(searchParams.get("to") || "Mumbai Central");
  const [committedDate, setCommittedDate] = useState(clampTrainDate(searchParams.get("date") || "") || getTodayIso());

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
    setCommittedFrom(searchParams.get("from") || "New Delhi");
    setCommittedTo(searchParams.get("to") || "Mumbai Central");
    // Only sync date from URL when the URL actually carries a date value.
    // If no date param is present (e.g. a filter was applied without re-searching),
    // preserve the local input state so the user's selection is not reset to today.
    const urlDate = searchParams.get("date");
    if (urlDate !== null) {
      const clamped = clampTrainDate(urlDate) || getTodayIso();
      setDate(clamped);
      setCommittedDate(clamped);
    }
    setSort((searchParams.get("sort") as SortKey) || "price-asc");
    setSelectedTypes(
      new Set((searchParams.get("types") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setSelectedClass(
      (searchParams.get("class") as "sleeper" | "ac3Tier" | "ac2Tier" | "ac1st") || "sleeper",
    );
  }, [searchParams]);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSelectedClass("sleeper");
    setSort("price-asc");
    updateQuery({ types: null, class: null, sort: null });
  };

  const handleSearch = () => {
    setHasSearched(true);
    if (!resolveTrainCode(from)) {
      showToast.error("Departure station not found. Choose a valid station or code (for example NDLS).");
      return;
    }

    if (!resolveTrainCode(to)) {
      showToast.error("Destination station not found. Choose a valid station or code (for example BCT).");
      return;
    }

    if (isSameTrainRoute(from, to)) {
      showToast.error("Departure and destination cannot be the same.");
      return;
    }

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    if (sort !== "price-asc") params.set("sort", sort);
    if (selectedClass !== "sleeper") params.set("class", selectedClass);
    if (selectedTypes.size) params.set("types", Array.from(selectedTypes).join(","));
    router.push(`/trains${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const fromSuggestions = useMemo(() => {
    const term = from.trim().toLowerCase();
    if (!term) return [] as TrainLocationOption[];

    const cityMatches = trainCityOptions
      .filter((option) => option.city.toLowerCase().includes(term))
      .slice(0, 3);

    const stationMatches = trainLocationOptions
      .filter((option) => option.station.toLowerCase().includes(term) || option.code.toLowerCase().includes(term))
      .slice(0, 4);

    return [...cityMatches, ...stationMatches].slice(0, 7);
  }, [from]);

  const toSuggestions = useMemo(() => {
    const term = to.trim().toLowerCase();
    if (!term) return [] as TrainLocationOption[];

    const cityMatches = trainCityOptions
      .filter((option) => option.city.toLowerCase().includes(term))
      .slice(0, 3);

    const stationMatches = trainLocationOptions
      .filter((option) => option.station.toLowerCase().includes(term) || option.code.toLowerCase().includes(term))
      .slice(0, 4);

    return [...cityMatches, ...stationMatches].slice(0, 7);
  }, [to]);

  const applySuggestion = (field: "from" | "to", option: TrainLocationOption) => {
    const chosen = option.isAllStations ? option.city : option.station;
    if (field === "from") setFrom(chosen);
    if (field === "to") setTo(chosen);
    setActiveField(null);
  };

  const filtered = useMemo(() => {
    let list = [...(apiResults || [])];
    if (selectedTypes.size) list = list.filter((train) => selectedTypes.has(train.type));

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.fare[selectedClass] - b.fare[selectedClass]); break;
      case "price-desc": list.sort((a, b) => b.fare[selectedClass] - a.fare[selectedClass]); break;
      case "duration":   list.sort((a, b) => a.duration.localeCompare(b.duration)); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
  }, [apiResults, selectedTypes, sort, selectedClass]);

  const trainTypes = useMemo(() => {
    return Array.from(new Set((apiResults || []).map((train) => train.type)));
  }, [apiResults]);

  useEffect(() => {
    const canUseApi = Boolean(hasSearched && committedFrom && committedTo && committedDate);
    if (!canUseApi) {
      setApiResults(null);
      setApiTotalPages(null);
      setApiError(null);
      return;
    }

    const sortMap: Record<SortKey, string> = {
      "price-asc": "price_asc",
      "price-desc": "price_desc",
      duration: "duration",
      rating: "rating",
    };

    const params = new URLSearchParams({
      from: resolveTrainCode(committedFrom) || "",
      to: resolveTrainCode(committedTo) || "",
      date: committedDate,
      class: selectedClass,
      sort: sortMap[sort],
      page: String(page),
      limit: String(PER_PAGE),
    });

    if (!params.get("from") || !params.get("to")) {
      setApiError("Please select valid departure and destination stations before searching.");
      setApiResults(null);
      setApiTotalPages(null);
      return;
    }

    if (params.get("from") === params.get("to")) {
      setApiError("Departure and destination cannot be the same.");
      setApiResults(null);
      setApiTotalPages(null);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        setApiLoading(true);
        setApiError(null);
        const res = await fetch(`/api/trains/search?${params.toString()}`);
        const parsed = await parseApiResponse<{ results: Array<{ train: Train & { _id?: string } }>; totalPages: number }>(
          res,
          "Unable to fetch trains right now.",
        );

        if (!mounted) return;

        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch trains right now.");
        }

        const normalized = (parsed.payload.data.results || []).map((entry) => {
          const train = entry.train;
          return {
            ...train,
            id: train.id || train._id || "",
          } as Train;
        });

        setApiResults(normalized);
        setApiTotalPages(parsed.payload.data.totalPages || 1);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Unable to fetch trains right now.";
        setApiError(message);
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
  }, [hasSearched, committedFrom, committedTo, committedDate, selectedClass, sort, page]);

  useEffect(() => {
    if (apiError && hasSearched) {
      showToast.error(apiError);
    }
  }, [apiError, hasSearched]);

  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered;

  const classLabel: Record<string, string> = {
    sleeper: "Sleeper",
    ac3Tier: "AC 3-Tier",
    ac2Tier: "AC 2-Tier",
    ac1st: "AC First",
  };

  const current = selected ?? null;
  const baseFare = current?.fare[selectedClass] ?? 0;
  const taxes = Math.round(baseFare * 0.05);
  const serviceFee = 149;

  const handleProceedToPayment = (_netAmount: number) => {
    if (!current) {
      showToast.error("Select a train before proceeding.");
      return;
    }

    const params = new URLSearchParams({
      trainId: current.id,
      date,
      class: selectedClass,
    });
    if (appliedCouponCode && appliedCouponDiscount > 0) {
      params.set("couponCode", appliedCouponCode);
      params.set("couponDiscount", String(Math.round(appliedCouponDiscount)));
    }
    router.push(`/trains/booking?${params.toString()}`);
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Train Search Results</h1>
        <p className={s.subtitle}>{hasSearched ? `${filtered.length} trains found` : "Search to load live trains"}</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>🚉 From</label>
            <input
              className={s.searchFieldInput}
              placeholder="New Delhi…"
              value={from}
              onFocus={() => setActiveField("from")}
              onBlur={() => setTimeout(() => setActiveField(null), 120)}
              onChange={(e) => setFrom(e.target.value)}
            />
            {activeField === "from" && fromSuggestions.length > 0 && (
              <div className={s.suggestions}>
                {fromSuggestions.map((option) => (
                  <button
                    key={`from-${option.station}-${option.code}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion("from", option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>🚉 To</label>
            <input
              className={s.searchFieldInput}
              placeholder="Mumbai Central…"
              value={to}
              onFocus={() => setActiveField("to")}
              onBlur={() => setTimeout(() => setActiveField(null), 120)}
              onChange={(e) => setTo(e.target.value)}
            />
            {activeField === "to" && toSuggestions.length > 0 && (
              <div className={s.suggestions}>
                {toSuggestions.map((option) => (
                  <button
                    key={`to-${option.station}-${option.code}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion("to", option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Journey</label>
            <input className={s.searchFieldInput} type="date" min={getTodayIso()} value={date} onChange={(e) => setDate(clampTrainDate(e.target.value))} />
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
            {trainTypes.map((t) => (
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
            <span className={s.filterGroupLabel}>Travel Class</span>
            {(["sleeper", "ac3Tier", "ac2Tier", "ac1st"] as const).map((c) => (
              <label key={c} className={s.filterOption}>
                <input
                  type="radio"
                  name="class"
                  checked={selectedClass === c}
                  onChange={() => {
                    setSelectedClass(c);
                    updateQuery({ class: c === "sleeper" ? null : c });
                  }}
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
              onChange={(e) => {
                const value = e.target.value as SortKey;
                setSort(value);
                updateQuery({ sort: value === "price-asc" ? null : value });
              }}
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
                onClick={() => {
                  setSort(k);
                  updateQuery({ sort: k === "price-asc" ? null : k });
                }}
              >
                {k === "price-asc" ? "Price ↑" : k === "price-desc" ? "Price ↓" : k === "duration" ? "Duration" : "Rating"}
              </button>
            ))}
          </div>

          {apiLoading && <div className={s.noResults}>Fetching latest trains…</div>}
          {!apiLoading && hasSearched && paged.length === 0 && <div className={s.noResults}>No trains match your filters.</div>}
          {!apiLoading && hasSearched && apiError && <div className={s.noResults}>{apiError}</div>}

          {paged.map((train) => (
            <div key={train.id} className={`${s.card} ${s.trainCard} ${current?.id === train.id ? s.cardSelected : ""}`}>
              <div className={`${s.cardRow} ${s.trainCardRow}`}>
                <div className={s.cardMain}>
                  <div className={s.trainHeader}>
                    <span className={s.trainName}>{train.name}</span>
                    <span className={s.trainNumber}> #{train.trainNumber}</span>
                    <span className={s.trainType}>{train.type}</span>
                  </div>

                  <div className={`${s.route} ${s.trainRoute}`}>
                    <div>
                      <div className={s.time}>{train.departureTime}</div>
                      <div className={s.cityCode}>{train.from} ({train.fromCode})</div>
                    </div>
                    <div className={`${s.routeLine} ${s.trainRouteLine}`}>
                      <span className={s.duration}>{train.duration}</span>
                      <div className={s.dashes} />
                      <span className={s.stops}>
                        {train.stops} stop{train.stops !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div>
                      <div className={s.time}>{train.arrivalTime}</div>
                      <div className={s.cityCode}>{train.to} ({train.toCode})</div>
                    </div>
                  </div>

                  <div className={`${s.pnr} ${s.trainMeta}`}>PNR: {train.pnr} · Runs: {train.daysOfWeek.join(", ")}</div>

                  <div className={`${s.fareTable} ${s.trainFareTable}`}>
                    {train.fare.general > 0 && (
                      <span className={s.fareChip}>
                        General (GN): <strong>₹{train.fare.general.toLocaleString("en-IN")}</strong>
                        &nbsp;({train.seatsAvailable.general} seats)
                      </span>
                    )}
                    <span className={s.fareChip}>
                      Sleeper (SL): <strong>₹{train.fare.sleeper.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.sleeper} seats)
                    </span>
                    <span className={s.fareChip}>
                      AC 3-Tier (3A): <strong>₹{train.fare.ac3Tier.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.ac3Tier} seats)
                    </span>
                    <span className={s.fareChip}>
                      AC 2-Tier (2A): <strong>₹{train.fare.ac2Tier.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.ac2Tier} seats)
                    </span>
                    <span className={s.fareChip}>
                      AC First (1A): <strong>₹{train.fare.ac1st.toLocaleString("en-IN")}</strong>
                      &nbsp;({train.seatsAvailable.ac1st} seats)
                    </span>
                  </div>

                  {train.fareCategories?.[selectedClass] && (
                    <div className={`${s.tags} ${s.trainTags}`}>
                      <span className={s.tag}>👨 Adult: ₹{train.fareCategories[selectedClass].adult.toLocaleString("en-IN")}</span>
                      <span className={s.tag}>👶 Child: ₹{train.fareCategories[selectedClass].child.toLocaleString("en-IN")}</span>
                      <span className={s.tag}>👴 Senior: ₹{train.fareCategories[selectedClass].seniorCitizen.toLocaleString("en-IN")}</span>
                      <span className={s.tag}>🎖 Military: ₹{train.fareCategories[selectedClass].military.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                <div className={`${s.cardRight} ${s.trainCardRight}`}>
                  <div className={s.price}>₹{train.fare[selectedClass].toLocaleString("en-IN")}</div>
                  <div className={s.perPerson}>per adult · {classLabel[selectedClass]}</div>
                  <div className={s.rating}>★ {train.rating}</div>
                  <button
                    className={s.bookBtn}
                    type="button"
                    onClick={() => setSelected(train)}
                  >
                    {current?.id === train.id ? "Selected" : "Book Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} />
        </div>

        {/* ── Right: Booking sidebar ── */}
        {current && (
          <BookingSidebar
            baseFare={baseFare}
            taxes={taxes}
            serviceFee={serviceFee}
            serviceType="train"
            ctaLabel="Proceed to Payment"
            onCouponApplied={({ code, discount: value }) => {
              setAppliedCouponCode(code);
              setAppliedCouponDiscount(value);
            }}
            onProceed={handleProceedToPayment}
          />
        )}
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
