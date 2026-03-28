"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { useBookingGuard } from "@/hooks/useBookingGuard";
import { useAuth } from "@/services/auth/context";
import { parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import s from "@/styles/search.module.scss";
import { flights, type Flight } from "@/data/flights";
import BookingSidebar from "@/components/ui/BookingSidebar/BookingSidebar";
import Pagination from "@/components/ui/Pagination/Pagination";

const PER_PAGE = 10;

type SortKey = "price-asc" | "price-desc" | "duration" | "rating";

const STOP_OPTIONS = ["Non-stop", "1 Stop", "2+ Stops"];

type FlightLocationOption = {
  city: string;
  code: string;
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
  if (/^[A-Z]{3}$/.test(upper)) return upper;

  const byCity = flightLocationOptions.find((option) => option.city.toLowerCase() === trimmed.toLowerCase());
  if (byCity) return byCity.code.toUpperCase();

  const byCode = flightLocationOptions.find((option) => option.code.toUpperCase() === upper);
  if (byCode) return byCode.code.toUpperCase();

  return null;
};

function FlightsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Number(searchParams.get("page") || "1");

  const { guardAction } = useBookingGuard();
  const { processBookingAndPayment } = useBookingFlow();
  const { user } = useAuth();

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [tripType, setTripType] = useState((searchParams.get("trip") as "one-way" | "round-trip") || "one-way");
  const [returnDate, setReturnDate] = useState(searchParams.get("return") || "");

  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "price-asc");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(
    new Set((searchParams.get("airlines") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [selectedStops, setSelectedStops] = useState<Set<string>>(
    new Set((searchParams.get("stopsLabel") || "").split(",").map((item) => item.trim()).filter(Boolean)),
  );
  const [selected, setSelected] = useState<Flight | null>(null);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [apiResults, setApiResults] = useState<Flight[] | null>(null);
  const [apiTotalPages, setApiTotalPages] = useState<number | null>(null);
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
    setTripType((searchParams.get("trip") as "one-way" | "round-trip") || "one-way");
    setReturnDate(searchParams.get("return") || "");
    setSort((searchParams.get("sort") as SortKey) || "price-asc");
    setSelectedAirlines(
      new Set((searchParams.get("airlines") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
    setSelectedStops(
      new Set((searchParams.get("stopsLabel") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    );
  }, [searchParams]);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => {
    setSelectedAirlines(new Set());
    setSelectedStops(new Set());
    setSort("price-asc");
    updateQuery({ airlines: null, stopsLabel: null, sort: null });
  };

  const handleSearch = () => {
    if (!resolveFlightCode(from) || !resolveFlightCode(to)) {
      showToast.error("Select valid From and To values from suggestions (or use airport codes like DEL, BOM).");
      return;
    }

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    if (tripType === "round-trip") params.set("trip", "round-trip");
    if (tripType === "round-trip" && returnDate) params.set("return", returnDate);
    if (sort !== "price-asc") params.set("sort", sort);
    if (selectedAirlines.size) params.set("airlines", Array.from(selectedAirlines).join(","));
    if (selectedStops.size) params.set("stopsLabel", Array.from(selectedStops).join(","));
    router.push(`/flights${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const fromSuggestions = useMemo(() => {
    const term = from.trim().toLowerCase();
    if (!term) return [] as FlightLocationOption[];

    return flightLocationOptions
      .filter((option) => option.city.toLowerCase().includes(term) || option.code.toLowerCase().includes(term))
      .slice(0, 6);
  }, [from]);

  const toSuggestions = useMemo(() => {
    const term = to.trim().toLowerCase();
    if (!term) return [] as FlightLocationOption[];

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
    let list = [...(apiResults || [])];

    if (selectedAirlines.size) {
      list = list.filter((flight) => selectedAirlines.has(flight.airline));
    }

    if (selectedStops.size) {
      list = list.filter((flight) => {
        if (selectedStops.has("Non-stop") && flight.stops === 0) return true;
        if (selectedStops.has("1 Stop") && flight.stops === 1) return true;
        if (selectedStops.has("2+ Stops") && flight.stops >= 2) return true;
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
  }, [apiResults, selectedAirlines, selectedStops, sort]);

  const airlines = useMemo(() => {
    return Array.from(new Set((apiResults || []).map((flight) => flight.airline)));
  }, [apiResults]);

  useEffect(() => {
    const canUseApi = Boolean(from && to && date);
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
      from: resolveFlightCode(from) || "",
      to: resolveFlightCode(to) || "",
      date,
      sort: sortMap[sort],
      page: String(page),
      limit: String(PER_PAGE),
    });

    if (!params.get("from") || !params.get("to")) {
      setApiError("Select valid From and To values from suggestions (or use airport codes like DEL, BOM).");
      setApiResults(null);
      setApiTotalPages(null);
      return;
    }

    if (selectedAirlines.size) {
      params.set("airlines", Array.from(selectedAirlines).join(","));
    }
    if (selectedStops.size === 1) {
      const only = Array.from(selectedStops)[0];
      const stopValue = only === "Non-stop" ? 0 : only === "1 Stop" ? 1 : 2;
      params.set("stops", String(stopValue));
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
        setApiTotalPages(parsed.payload.data.totalPages || 1);
      } catch (error) {
        if (!mounted) return;
        setApiError(error instanceof Error ? error.message : "Unable to fetch flights right now.");
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
  }, [from, to, date, sort, selectedAirlines, selectedStops, page]);

  useEffect(() => {
    if (apiError) {
      showToast.error(apiError);
    }
  }, [apiError]);

  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered;

  const selectedFlight = selected ?? paged[0];
  const baseFare = selectedFlight?.discountedPrice ?? 0;
  const taxes = Math.round(baseFare * 0.05);
  const serviceFee = 249;
  const discount = selectedFlight ? selectedFlight.originalPrice - selectedFlight.discountedPrice : 0;

  const handleProceedToPayment = (netAmount: number) => {
    if (!selectedFlight) return;
    guardAction(async () => {
      if (!user) return;
      await processBookingAndPayment(
        {
          itemId: selectedFlight.id,
          type: 'flight',
          title: `${selectedFlight.fromCode} → ${selectedFlight.toCode} (${selectedFlight.airline})`,
          fromCode: selectedFlight.fromCode,
          toCode: selectedFlight.toCode,
          startDate: date,
          quantity: 1,
          amount: selectedFlight.discountedPrice,
          contact: {
            name: user.fullName || 'Guest',
            email: user.email || '',
            phone: '',
          },
          passengers: [],
        },
        netAmount,
      );
    });
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Flight Search Results</h1>
        <p className={s.subtitle}>{from && to && date ? `${filtered.length} flights on this page` : "Search to load live flights"}</p>
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
            <input className={s.searchFieldInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
              <input className={s.searchFieldInput} type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
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

          {paged.length === 0 && <div className={s.noResults}>{from && to && date ? "No flights match your filters." : "Enter From, To and Date to load live flights."}</div>}
          {apiError && <div className={s.noResults}>{apiError}</div>}
          {apiLoading && <div className={s.noResults}>Fetching latest flights…</div>}

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
          baseFare={baseFare}
          taxes={taxes}
          serviceFee={serviceFee}
          discount={discount}
          ctaLabel="Proceed to Payment"
          onProceed={handleProceedToPayment}
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
