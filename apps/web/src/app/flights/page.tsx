"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import s from "@/styles/search.module.scss";
import { flights, type Flight } from "@/data/flights";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;

type SortKey = "price-asc" | "price-desc" | "duration" | "rating";

const STOP_OPTIONS = ["Non-stop", "1 Stop", "2+ Stops"];
const TIME_BUCKETS = [
  { key: "early-morning", label: "Early Morning (12AM-6AM)", start: 0, end: 360 },
  { key: "morning", label: "Morning (6AM-12PM)", start: 360, end: 720 },
  { key: "afternoon", label: "Afternoon (12PM-5PM)", start: 720, end: 1020 },
  { key: "evening", label: "Evening (5PM-9PM)", start: 1020, end: 1260 },
  { key: "night", label: "Night (9PM-12AM)", start: 1260, end: 1440 },
] as const;

type TimeBucketKey = (typeof TIME_BUCKETS)[number]["key"];

type FlightLocationOption = {
  city: string;
  code: string;
};

const FLIGHT_CITY_ALIASES: Record<string, string> = {
  delhi: "DEL",
  "new delhi": "DEL",
  mumbai: "BOM",
  bombay: "BOM",
  bangalore: "BLR",
  bengaluru: "BLR",
  kolkata: "CCU",
  calcutta: "CCU",
  chennai: "MAA",
  madras: "MAA",
  hyderabad: "HYD",
  pune: "PNQ",
  goa: "GOI",
  jaipur: "JAI",
  ahmedabad: "AMD",
  lucknow: "LKO",
};

const flightLocationOptions: FlightLocationOption[] = Array.from(
  new Map(
    flights
      .flatMap((flight) => [
        { city: flight.from, code: flight.fromCode },
        { city: flight.to, code: flight.toCode },
      ])
      .map((option) => [`${option.city.toLowerCase()}-${option.code.toUpperCase()}`, option]),
  ).values(),
);

const resolveFlightCode = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) {
    return FLIGHT_CITY_ALIASES[trimmed.toLowerCase()] || upper;
  }

  const byCity = flightLocationOptions.find((option) => option.city.toLowerCase() === trimmed.toLowerCase());
  if (byCity) return byCity.code.toUpperCase();

  const byCode = flightLocationOptions.find((option) => option.code.toUpperCase() === upper);
  if (byCode) return byCode.code.toUpperCase();

  const alias = FLIGHT_CITY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const containsMatch = flightLocationOptions.find((option) =>
    option.city.toLowerCase().includes(trimmed.toLowerCase()),
  );
  if (containsMatch) return containsMatch.code.toUpperCase();

  return null;
};

const getFlightDisplayValue = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const code = resolveFlightCode(trimmed);
  if (!code) return trimmed;

  const option = flightLocationOptions.find((entry) => entry.code.toUpperCase() === code);
  return option?.city || trimmed;
};

const isSameFlightRoute = (fromValue: string, toValue: string): boolean => {
  const fromCode = resolveFlightCode(fromValue);
  const toCode = resolveFlightCode(toValue);
  if (!fromCode || !toCode) return false;
  return fromCode === toCode;
};

const normalizeIsoDate = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const dmy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return `${yyyy}-${mm}-${dd}`;
  }

  return trimmed;
};

const clampToTodayIso = (value: string): string => {
  const normalized = normalizeIsoDate(value);
  if (!normalized) return "";
  const today = getTodayIso();
  return normalized < today ? today : normalized;
};

const getTodayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const minutesFromTime = (time: string): number => {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
};

const applyFlightFilters = ({
  list,
  selectedAirlines,
  selectedStops,
  selectedTimeBuckets,
  mealsOnly,
  refundableOnly,
  journeyDate,
}: {
  list: Flight[];
  selectedAirlines: Set<string>;
  selectedStops: Set<string>;
  selectedTimeBuckets: Set<TimeBucketKey>;
  mealsOnly: boolean;
  refundableOnly: boolean;
  journeyDate: string;
}): Flight[] => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isTodayJourney = journeyDate === getTodayIso();

  return list.filter((flight) => {
    if (flight.seatsLeft <= 0) return false;

    if (isTodayJourney && minutesFromTime(flight.departureTime) <= nowMinutes) {
      return false;
    }

    if (selectedAirlines.size > 0 && !selectedAirlines.has(flight.airline)) {
      return false;
    }

    if (selectedStops.size > 0) {
      const stopMatches =
        (selectedStops.has("Non-stop") && flight.stops === 0) ||
        (selectedStops.has("1 Stop") && flight.stops === 1) ||
        (selectedStops.has("2+ Stops") && flight.stops >= 2);
      if (!stopMatches) return false;
    }

    if (selectedTimeBuckets.size > 0) {
      const depMinutes = minutesFromTime(flight.departureTime);
      const bucketMatches = TIME_BUCKETS.some(
        (bucket) => selectedTimeBuckets.has(bucket.key) && depMinutes >= bucket.start && depMinutes < bucket.end,
      );
      if (!bucketMatches) return false;
    }

    if (mealsOnly && !flight.meals) return false;
    if (refundableOnly && !flight.refundable) return false;

    return true;
  });
};

function FlightsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawPage = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [from, setFrom] = useState(getFlightDisplayValue(searchParams.get("from") || "", "Delhi"));
  const [to, setTo] = useState(getFlightDisplayValue(searchParams.get("to") || "", "Mumbai"));
  const [date, setDate] = useState(clampToTodayIso(searchParams.get("date") || "") || getTodayIso());
  const [tripType, setTripType] = useState((searchParams.get("trip") as "one-way" | "round-trip") || "one-way");
  const [returnDate, setReturnDate] = useState(clampToTodayIso(searchParams.get("return") || ""));

  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "price-asc");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(
    new Set((searchParams.get("airlines") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [selectedStops, setSelectedStops] = useState<Set<string>>(
    new Set((searchParams.get("stopsLabel") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [selectedTimeBuckets, setSelectedTimeBuckets] = useState<Set<TimeBucketKey>>(
    new Set(
      (searchParams.get("timeBuckets") || "")
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is TimeBucketKey => TIME_BUCKETS.some((bucket) => bucket.key === item)),
    ),
  );
  const [mealsOnly, setMealsOnly] = useState(searchParams.get("meals") === "true");
  const [refundableOnly, setRefundableOnly] = useState(searchParams.get("refundable") === "true");
  const [selected, setSelected] = useState<Flight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [apiResults, setApiResults] = useState<Flight[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiReturnResults, setApiReturnResults] = useState<Flight[] | null>(null);
  const [apiReturnLoading, setApiReturnLoading] = useState(false);
  const [apiReturnError, setApiReturnError] = useState<string | null>(null);
  // Always true — search fires on mount with defaults so users see results immediately
  const [hasSearched, setHasSearched] = useState(true);
  const [committedFrom, setCommittedFrom] = useState(searchParams.get("from") || "Delhi");
  const [committedTo, setCommittedTo] = useState(searchParams.get("to") || "Mumbai");
  const [committedDate, setCommittedDate] = useState(clampToTodayIso(searchParams.get("date") || "") || getTodayIso());
  const [committedReturnDate, setCommittedReturnDate] = useState(clampToTodayIso(searchParams.get("return") || ""));

  const getFlightInputValidationMessage = () => {
    if (!resolveFlightCode(from)) {
      return "Departure city not found. Choose a valid city or airport code (for example DEL).";
    }
    if (!resolveFlightCode(to)) {
      return "Destination city not found. Choose a valid city or airport code (for example BOM).";
    }
    if (isSameFlightRoute(from, to)) {
      return "Departure and destination cannot be the same.";
    }
    return null;
  };

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
    setCommittedFrom(searchParams.get("from") || "Delhi");
    setCommittedTo(searchParams.get("to") || "Mumbai");
    // Only sync date from URL when the URL actually carries a date value.
    // If no date param is present (e.g. a filter was applied without searching),
    // preserve the local input state so the user's selection is not reset to today.
    const urlDate = searchParams.get("date");
    if (urlDate !== null) {
      const clamped = clampToTodayIso(urlDate) || getTodayIso();
      setDate(clamped);
      setCommittedDate(clamped);
    }
    setTripType((searchParams.get("trip") as "one-way" | "round-trip") || "one-way");
    const urlReturn = searchParams.get("return");
    if (urlReturn !== null) {
      setReturnDate(clampToTodayIso(urlReturn));
      setCommittedReturnDate(clampToTodayIso(urlReturn));
    }
    setSort((searchParams.get("sort") as SortKey) || "price-asc");
    setSelectedAirlines(
      new Set((searchParams.get("airlines") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setSelectedStops(
      new Set((searchParams.get("stopsLabel") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setSelectedTimeBuckets(
      new Set(
        (searchParams.get("timeBuckets") || "")
          .split(",")
          .map((item) => item.trim())
          .filter((item): item is TimeBucketKey => TIME_BUCKETS.some((bucket) => bucket.key === item)),
      ),
    );
    setMealsOnly(searchParams.get("meals") === "true");
    setRefundableOnly(searchParams.get("refundable") === "true");
  }, [searchParams]);

  useEffect(() => {
    if (tripType === "one-way" && selectedReturn) {
      setSelectedReturn(null);
    }
  }, [tripType, selectedReturn]);

  useEffect(() => {
    if (tripType === "round-trip" && returnDate && date && returnDate < date) {
      setReturnDate(date);
    }
  }, [tripType, date, returnDate]);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedAirlines(new Set());
    setSelectedStops(new Set());
    setSelectedTimeBuckets(new Set());
    setMealsOnly(false);
    setRefundableOnly(false);
    setSort("price-asc");
    updateQuery({ airlines: null, stopsLabel: null, timeBuckets: null, meals: null, refundable: null, sort: null });
  };

  const handleSearch = () => {
    setHasSearched(true);
    const validationMessage = getFlightInputValidationMessage();
    if (validationMessage) {
      showToast.error(validationMessage);
      return;
    }

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const normalizedDate = normalizeIsoDate(date);
    if (normalizedDate) params.set("date", normalizedDate);
    if (tripType === "round-trip") params.set("trip", "round-trip");
    if (tripType === "round-trip" && returnDate) {
      const normalizedReturn = clampToTodayIso(returnDate);
      if (normalizedReturn) params.set("return", normalizedReturn);
    }
    if (sort !== "price-asc") params.set("sort", sort);
    if (selectedAirlines.size) params.set("airlines", Array.from(selectedAirlines).join(","));
    if (selectedStops.size) params.set("stopsLabel", Array.from(selectedStops).join(","));
    if (selectedTimeBuckets.size) params.set("timeBuckets", Array.from(selectedTimeBuckets).join(","));
    if (mealsOnly) params.set("meals", "true");
    if (refundableOnly) params.set("refundable", "true");
    router.push(`/flights${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const fromSuggestions = useMemo(() => {
    const term = from.trim().toLowerCase();
    if (!term) return flightLocationOptions.slice(0, 6);

    return flightLocationOptions
      .filter((option) => option.city.toLowerCase().includes(term) || option.code.toLowerCase().includes(term))
      .slice(0, 6);
  }, [from]);

  const toSuggestions = useMemo(() => {
    const term = to.trim().toLowerCase();
    if (!term) return flightLocationOptions.slice(0, 6);

    return flightLocationOptions
      .filter((option) => option.city.toLowerCase().includes(term) || option.code.toLowerCase().includes(term))
      .slice(0, 6);
  }, [to]);

  const applySuggestion = (field: "from" | "to", option: FlightLocationOption) => {
    if (field === "from") setFrom(option.city);
    if (field === "to") setTo(option.city);
    setActiveField(null);
  };

  const filtered = useMemo(() => {
    const list = applyFlightFilters({
      list: [...(apiResults || [])],
      selectedAirlines,
      selectedStops,
      selectedTimeBuckets,
      mealsOnly,
      refundableOnly,
      journeyDate: date,
    });

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.discountedPrice - b.discountedPrice); break;
      case "price-desc": list.sort((a, b) => b.discountedPrice - a.discountedPrice); break;
      case "duration":   list.sort((a, b) => a.duration.localeCompare(b.duration)); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
    }

    return list;
  }, [apiResults, selectedAirlines, selectedStops, selectedTimeBuckets, mealsOnly, refundableOnly, date, sort]);

  const returnFiltered = useMemo(() => {
    const list = applyFlightFilters({
      list: [...(apiReturnResults || [])],
      selectedAirlines,
      selectedStops,
      selectedTimeBuckets,
      mealsOnly,
      refundableOnly,
      journeyDate: returnDate,
    });

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.discountedPrice - b.discountedPrice);
        break;
      case "price-desc":
        list.sort((a, b) => b.discountedPrice - a.discountedPrice);
        break;
      case "duration":
        list.sort((a, b) => a.duration.localeCompare(b.duration));
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
    }

    return list;
  }, [apiReturnResults, selectedAirlines, selectedStops, selectedTimeBuckets, mealsOnly, refundableOnly, returnDate, sort]);

  const airlines = useMemo(() => {
    return Array.from(new Set([...(apiResults || []), ...(apiReturnResults || [])].map((flight) => flight.airline)));
  }, [apiResults, apiReturnResults]);

  const disabledTimeBuckets = useMemo(() => {
    if (date !== getTodayIso()) return new Set<TimeBucketKey>();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return new Set(
      TIME_BUCKETS.filter((bucket) => bucket.end <= nowMinutes).map((bucket) => bucket.key),
    );
  }, [date]);

  useEffect(() => {
    if (!disabledTimeBuckets.size) return;
    setSelectedTimeBuckets((prev) => {
      const next = new Set(prev);
      disabledTimeBuckets.forEach((bucket) => next.delete(bucket));
      return next;
    });
  }, [disabledTimeBuckets]);

  useEffect(() => {
    const canUseApi = Boolean(hasSearched && committedFrom && committedTo && committedDate);
    if (!canUseApi) {
      setApiResults(null);
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
      from: resolveFlightCode(committedFrom) || "",
      to: resolveFlightCode(committedTo) || "",
      date: committedDate,
      sort: sortMap[sort],
      page: "1",
      limit: "120",
    });

    if (!params.get("from") || !params.get("to") || !normalizeIsoDate(committedDate)) {
      setApiError("Please select valid departure and destination cities before searching.");
      setApiResults([]);
      return;
    }

    if (params.get("from") === params.get("to")) {
      setApiError("Departure and destination cannot be the same.");
      setApiResults([]);
      return;
    }

    if (mealsOnly) {
      params.set("meals", "true");
    }
    if (refundableOnly) {
      params.set("refundable", "true");
    }

    let mounted = true;
    const run = async () => {
      try {
        setApiLoading(true);
        setApiError(null);

        const res = await fetch(`/api/flights/search?${params.toString()}`);
        const parsed = await parseApiResponse<{
          results: Array<{ flight: Flight & { _id?: string } }>;
          totalPages: number;
        }>(
          res,
          "Unable to fetch flights right now.",
        );

        if (!mounted) return;

        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch flights right now.");
        }

        const normalized = (parsed.payload.data.results || []).map((entry) => {
          const flight = entry.flight;
          return {
            ...flight,
            id: flight.id || flight._id || "",
          } as Flight;
        });

        setApiResults(normalized);
      } catch (error) {
        if (!mounted) return;
        setApiError(error instanceof Error ? error.message : "Unable to fetch flights right now.");
        setApiResults(null);
      } finally {
        if (mounted) setApiLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [hasSearched, committedFrom, committedTo, committedDate, sort, mealsOnly, refundableOnly]);

  useEffect(() => {
    const fromCode = resolveFlightCode(committedTo);
    const toCode = resolveFlightCode(committedFrom);
    const canUseApi = Boolean(
      hasSearched && tripType === "round-trip" && fromCode && toCode && committedReturnDate,
    );

    if (!canUseApi) {
      setApiReturnResults(null);
      setApiReturnError(null);
      return;
    }

    const sortMap: Record<SortKey, string> = {
      "price-asc": "price_asc",
      "price-desc": "price_desc",
      duration: "duration",
      rating: "rating",
    };

    const params = new URLSearchParams({
      from: fromCode || "",
      to: toCode || "",
      date: committedReturnDate,
      sort: sortMap[sort],
      page: "1",
      limit: "120",
    });

    if (params.get("from") === params.get("to")) {
      setApiReturnError("Return route cannot have identical source and destination.");
      setApiReturnResults([]);
      return;
    }

    if (mealsOnly) {
      params.set("meals", "true");
    }
    if (refundableOnly) {
      params.set("refundable", "true");
    }

    let mounted = true;
    const run = async () => {
      try {
        setApiReturnLoading(true);
        setApiReturnError(null);
        const res = await fetch(`/api/flights/search?${params.toString()}`);
        const parsed = await parseApiResponse<{
          results: Array<{ flight: Flight & { _id?: string } }>;
          totalPages: number;
        }>(
          res,
          "Unable to fetch return flights right now.",
        );

        if (!mounted) return;
        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch return flights right now.");
        }

        const normalized = (parsed.payload.data.results || []).map((entry) => {
          const flight = entry.flight;
          return {
            ...flight,
            id: flight.id || flight._id || "",
          } as Flight;
        });

        setApiReturnResults(normalized);
      } catch (error) {
        if (!mounted) return;
        setApiReturnError(error instanceof Error ? error.message : "Unable to fetch return flights right now.");
        setApiReturnResults(null);
      } finally {
        if (mounted) setApiReturnLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [hasSearched, tripType, committedFrom, committedTo, committedReturnDate, sort, mealsOnly, refundableOnly]);

  useEffect(() => {
    if (apiError && hasSearched) {
      showToast.error(apiError);
    }
  }, [apiError, hasSearched]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    if (page <= totalPages) return;
    updateQuery({ page: totalPages > 1 ? String(totalPages) : null }, false);
  }, [page, totalPages, updateQuery]);

  const selectedFlight = selected;
  const discountedBase =
    (selectedFlight?.discountedPrice ?? 0) + (tripType === "round-trip" ? selectedReturn?.discountedPrice ?? 0 : 0);
  const baseFare =
    (selectedFlight?.originalPrice ?? 0) + (tripType === "round-trip" ? selectedReturn?.originalPrice ?? 0 : 0);
  const taxes = Math.round(discountedBase * 0.05);
  const serviceFee = 249 + (tripType === "round-trip" && selectedReturn ? 249 : 0);
  const discount =
    (selectedFlight ? selectedFlight.originalPrice - selectedFlight.discountedPrice : 0) +
    (tripType === "round-trip" && selectedReturn ? selectedReturn.originalPrice - selectedReturn.discountedPrice : 0);

  const handleProceedToPayment = (netAmount: number) => {
    if (!selectedFlight) {
      showToast.error("Select an onward flight before proceeding.");
      return;
    }
    if (tripType === "round-trip" && !selectedReturn) {
      showToast.error("Select a return flight to continue with round-trip booking.");
      return;
    }

    const params = new URLSearchParams({
      outboundId: selectedFlight.id,
      date,
      tripType,
    });
    if (selectedReturn) {
      params.set("returnId", selectedReturn.id);
    }
    if (returnDate) {
      params.set("returnDate", returnDate);
    }
    const couponDiscount = Math.max(0, discountedBase + taxes + serviceFee - netAmount);
    const effectiveCouponDiscount = appliedCouponDiscount > 0 ? appliedCouponDiscount : couponDiscount;
    if (appliedCouponCode && effectiveCouponDiscount > 0) {
      params.set("couponCode", appliedCouponCode);
      params.set("couponDiscount", String(Math.round(effectiveCouponDiscount)));
    }

    router.push(`/flights/booking?${params.toString()}`);
  };

  const todayIso = getTodayIso();

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Flight Search Results</h1>
        <p className={s.subtitle}>{hasSearched ? `${filtered.length} flights found` : "Search to load live flights"}</p>
      </div>

      {/* ── Inline search bar ── */}
      <div className={s.searchBar}>
        <div className={s.searchBarInner}>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 From</label>
            <input
              className={s.searchFieldInput}
              placeholder="Delhi, Mumbai…"
              value={from}
              onFocus={() => setActiveField("from")}
              onBlur={() => setTimeout(() => setActiveField(null), 120)}
              onChange={(e) => setFrom(e.target.value)}
            />
            {activeField === "from" && fromSuggestions.length > 0 && (
              <div className={s.suggestions}>
                {fromSuggestions.map((option) => (
                  <button
                    key={`from-${option.city}-${option.code}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion("from", option)}
                  >
                    {option.city} ({option.code})
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📍 To</label>
            <input
              className={s.searchFieldInput}
              placeholder="Goa, Jaipur…"
              value={to}
              onFocus={() => setActiveField("to")}
              onBlur={() => setTimeout(() => setActiveField(null), 120)}
              onChange={(e) => setTo(e.target.value)}
            />
            {activeField === "to" && toSuggestions.length > 0 && (
              <div className={s.suggestions}>
                {toSuggestions.map((option) => (
                  <button
                    key={`to-${option.city}-${option.code}`}
                    type="button"
                    className={s.suggestionItem}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applySuggestion("to", option)}
                  >
                    {option.city} ({option.code})
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>📅 Depart</label>
            <input className={s.searchFieldInput} type="date" min={todayIso} value={date} onChange={(e) => setDate(clampToTodayIso(e.target.value))} />
          </div>
          <div className={s.searchFieldGroup}>
            <label className={s.searchFieldLabel}>↔ Trip</label>
            <select className={s.searchFieldInput} value={tripType} onChange={(e) => setTripType(e.target.value as "one-way" | "round-trip")}>
              <option value="one-way">One Way</option>
              <option value="round-trip">Round Trip</option>
            </select>
          </div>
          {tripType === "round-trip" && (
            <div className={s.searchFieldGroup}>
              <label className={s.searchFieldLabel}>📅 Return</label>
              <input
                className={s.searchFieldInput}
                type="date"
                min={date || todayIso}
                value={returnDate}
                onChange={(e) => setReturnDate(clampToTodayIso(e.target.value))}
              />
            </div>
          )}
          <button className={s.searchBarBtn} type="button" onClick={handleSearch}>🔍 Search</button>
        </div>
      </div>

      <div className={s.grid}>
        {/* ── Left: Filters ── */}
        <aside className={s.filters}>
          <h3 className={s.filterTitle}>Filters</h3>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Airlines</span>
            {airlines.map((a) => (
              <label key={a} className={s.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedAirlines.has(a)}
                  onChange={() => {
                    const next = toggleSet(selectedAirlines, a);
                    setSelectedAirlines(next);
                    updateQuery({ airlines: next.size ? Array.from(next).join(",") : null });
                  }}
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
                  onChange={() => {
                    const next = toggleSet(selectedStops, o);
                    setSelectedStops(next);
                    updateQuery({ stopsLabel: next.size ? Array.from(next).join(",") : null });
                  }}
                />
                {o}
              </label>
            ))}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Departure Time</span>
            {TIME_BUCKETS.map((bucket) => {
              const disabled = disabledTimeBuckets.has(bucket.key);
              return (
                <label key={bucket.key} className={s.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedTimeBuckets.has(bucket.key)}
                    disabled={disabled}
                    onChange={() => {
                      if (disabled) return;
                      const next = toggleSet(selectedTimeBuckets, bucket.key);
                      setSelectedTimeBuckets(next);
                      updateQuery({ timeBuckets: next.size ? Array.from(next).join(",") : null });
                    }}
                  />
                  {bucket.label}
                </label>
              );
            })}
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterGroupLabel}>Amenities</span>
            <label className={s.filterOption}>
              <input
                type="checkbox"
                checked={mealsOnly}
                onChange={() => {
                  const next = !mealsOnly;
                  setMealsOnly(next);
                  updateQuery({ meals: next ? "true" : null });
                }}
              />
              Meals Included
            </label>
            <label className={s.filterOption}>
              <input
                type="checkbox"
                checked={refundableOnly}
                onChange={() => {
                  const next = !refundableOnly;
                  setRefundableOnly(next);
                  updateQuery({ refundable: next ? "true" : null });
                }}
              />
              Refundable
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
              <option value="duration">Duration</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <button className={s.clearBtn} type="button" onClick={clearFilters}>
            ✕ Clear All Filters
          </button>
        </aside>

        {/* ── Center: Results ── */}
        <div className={`${s.results} ${tripType === "round-trip" ? s.resultsRoundTrip : ""}`}>
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

          {tripType === "round-trip" ? (
            <div className={s.roundTripColumns}>
              <div className={s.resultsPanel}>
                <h3 className={s.sectionTitle}>Onward Flights</h3>
                {apiLoading && (
                  <div className={s.loadingState}>
                    <span className={s.spinner} aria-hidden="true" />
                    <span>Fetching latest flights...</span>
                  </div>
                )}
                {!apiLoading && hasSearched && paged.length === 0 && <div className={s.noResults}>No onward flights match your filters.</div>}
                {!apiLoading && hasSearched && apiError && <div className={s.noResults}>{apiError}</div>}

                {paged.map((flight) => (
                  <div key={flight.id} className={`${s.card} ${selectedFlight?.id === flight.id ? s.cardSelected : ""}`}>
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
                          {selectedFlight?.id === flight.id ? "Selected" : "Book Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.resultsPanel}>
                <h3 className={s.sectionTitle}>Return Flights</h3>
                {apiReturnLoading && (
                  <div className={s.loadingState}>
                    <span className={s.spinner} aria-hidden="true" />
                    <span>Fetching return flights...</span>
                  </div>
                )}
                {!apiReturnLoading && hasSearched && returnFiltered.length === 0 && (
                  <div className={s.noResults}>
                    No return flights match your filters.
                  </div>
                )}
                {!apiReturnLoading && hasSearched && apiReturnError && <div className={s.noResults}>{apiReturnError}</div>}

                {returnFiltered.map((flight) => (
                  <div key={`return-${flight.id}`} className={`${s.card} ${selectedReturn?.id === flight.id ? s.cardSelected : ""}`}>
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
                      </div>
                      <div className={s.cardRight}>
                        <div className={s.originalPrice}>₹{flight.originalPrice.toLocaleString("en-IN")}</div>
                        <div className={s.price}>₹{flight.discountedPrice.toLocaleString("en-IN")}</div>
                        <div className={s.perPerson}>per adult</div>
                        <button className={s.bookBtn} type="button" onClick={() => setSelectedReturn(flight)}>
                          {selectedReturn?.id === flight.id ? "Selected" : "Book Return"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {apiLoading && <div className={s.noResults}>Fetching latest flights…</div>}
              {!apiLoading && hasSearched && paged.length === 0 && <div className={s.noResults}>No flights match your filters.</div>}
              {!apiLoading && hasSearched && apiError && <div className={s.noResults}>{apiError}</div>}

              {paged.map((flight) => (
                <div key={flight.id} className={`${s.card} ${selectedFlight?.id === flight.id ? s.cardSelected : ""}`}>
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
                        {selectedFlight?.id === flight.id ? "Selected" : "Book Now"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <Pagination currentPage={page} totalPages={totalPages} />
        </div>

        {/* ── Right: Booking sidebar ── */}
        {selected && (
          <BookingSidebar
            baseFare={baseFare}
            taxes={taxes}
            serviceFee={serviceFee}
            discount={discount}
            serviceType="flight"
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

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className={s.page}><div className={s.header}><h1 className={s.title}>Loading flights…</h1></div></div>}>
      <FlightsContent />
    </Suspense>
  );
}
