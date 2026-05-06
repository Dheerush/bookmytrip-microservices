"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchTabs.module.scss";
import { flights } from "@/data/flights";
import { trains } from "@/data/trains";
import { cabs } from "@/data/cabs";
import { showToast } from "@/lib/toast";

// ─── Tab config ───────────────────────────────────────────
type TabId = "flights" | "hotels" | "trains" | "cabs";
type TripType = "one-way" | "round-trip";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "flights", label: "Flights", icon: "✈️" },
  { id: "hotels",  label: "Hotels",  icon: "🏨" },
  { id: "trains",  label: "Trains",  icon: "🚂" },
  { id: "cabs",    label: "Cabs",    icon: "🚕" },
];

// ─── Fields per tab ───────────────────────────────────────
interface Field {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface SuggestionOption {
  label: string;
  value: string;
}

const getTodayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const clampToTodayIso = (value: string): string => {
  if (!value) return "";
  const today = getTodayIso();
  return value < today ? today : value;
};

const getFlightFields = (tripType: TripType): Field[] => {
  const base: Field[] = [
    { key: "from",  label: "📍 From",   placeholder: "Delhi, Mumbai…" },
    { key: "to",    label: "📍 To",     placeholder: "Goa, Jaipur…" },
    { key: "date",  label: "📅 Depart", placeholder: "Date", type: "date" },
  ];
  if (tripType === "round-trip") {
    base.push({ key: "return", label: "📅 Return", placeholder: "Date", type: "date" });
  }
  return base;
};

const getTrainFields = (tripType: TripType): Field[] => {
  const base: Field[] = [
    { key: "from", label: "🚉 From",    placeholder: "New Delhi…" },
    { key: "to",   label: "🚉 To",      placeholder: "Mumbai CST…" },
    { key: "date", label: "📅 Journey", placeholder: "Date", type: "date" },
  ];
  if (tripType === "round-trip") {
    base.push({ key: "return", label: "📅 Return", placeholder: "Date", type: "date" });
  }
  return base;
};

const HOTEL_FIELDS: Field[] = [
  { key: "city",     label: "📍 City / Hotel", placeholder: "Search city or hotel…" },
  { key: "checkin",  label: "📅 Check-in",     placeholder: "Date", type: "date" },
  { key: "checkout", label: "📅 Check-out",    placeholder: "Date", type: "date" },
];

const CAB_FIELDS: Field[] = [
  { key: "pickup", label: "📍 Pickup",  placeholder: "Pickup location…" },
  { key: "drop",   label: "📍 Drop",    placeholder: "Drop location…" },
  { key: "date",   label: "📅 Date",    placeholder: "Date", type: "date" },
];

const normalizePlace = (value: string): string => value.trim().toLowerCase();

// ─── Component ────────────────────────────────────────────
export default function SearchTabs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("flights");
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [values, setValues] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [hotelSuggestions, setHotelSuggestions] = useState<SuggestionOption[]>([]);

  useEffect(() => {
    const rawTerm = focusedField ? values[focusedField] || "" : "";
    const timeout = setTimeout(() => {
      setDebouncedTerm(rawTerm.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timeout);
  }, [focusedField, values]);

  useEffect(() => {
    if (activeTab !== "hotels" || focusedField !== "city") {
      setHotelSuggestions([]);
      return;
    }

    if (!debouncedTerm) {
      setHotelSuggestions([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const params = new URLSearchParams({ q: debouncedTerm });
        const response = await fetch(`/api/hotels/suggestions?${params.toString()}`);
        if (!response.ok) {
          if (!cancelled) setHotelSuggestions([]);
          return;
        }

        const json = await response.json() as {
          data?: {
            suggestions?: Array<{
              label?: string;
              value?: string;
            }>;
          };
        };
        if (cancelled) return;

        const next = (json.data?.suggestions || [])
          .map((entry) => {
            const label = String(entry.label || "").trim();
            const value = String(entry.value || "").trim() || label.split(" - ")[0]?.trim() || label;
            return { label, value };
          })
          .filter((entry) => Boolean(entry.label && entry.value))
          .slice(0, 8);

        setHotelSuggestions(next);
      } catch {
        if (!cancelled) setHotelSuggestions([]);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedTerm, focusedField]);

  const showTripToggle = activeTab === "flights";

  const fields =
    activeTab === "flights"
      ? getFlightFields(tripType)
      : activeTab === "trains"
        ? getTrainFields("one-way")
        : activeTab === "cabs"
          ? CAB_FIELDS
          : HOTEL_FIELDS;

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setValues({});
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev };
      const normalized = key === "date" || key === "return" || key === "checkin" || key === "checkout"
        ? clampToTodayIso(value)
        : value;

      next[key] = normalized;

      if (key === "date" && next.return && next.return < normalized) {
        next.return = normalized;
      }

      if (key === "checkin") {
        if (next.checkout && next.checkout <= normalized) {
          next.checkout = normalized;
        }
      }

      return next;
    });
  };

  const handleSearch = useCallback(() => {
    if (activeTab === "hotels") {
      if (!values.city?.trim()) {
        showToast.error("Please choose a city or hotel first.");
        return;
      }
      if (!values.checkin || !values.checkout) {
        showToast.error("Please select check-in and check-out dates.");
        return;
      }
      if (values.checkout <= values.checkin) {
        showToast.error("Check-out must be after check-in.");
        return;
      }
    }

    if (activeTab === "flights") {
      if (!values.from?.trim() || !values.to?.trim() || !values.date) {
        showToast.error("Please enter from, to, and departure date.");
        return;
      }
      if (normalizePlace(values.from) === normalizePlace(values.to)) {
        showToast.error("Departure and destination cannot be the same.");
        return;
      }
      if (tripType === "round-trip" && !values.return) {
        showToast.error("Please select a return date for round trip.");
        return;
      }
    }

    if (activeTab === "trains") {
      if (!values.from?.trim() || !values.to?.trim() || !values.date) {
        showToast.error("Please enter from, to, and journey date.");
        return;
      }
      if (normalizePlace(values.from) === normalizePlace(values.to)) {
        showToast.error("Departure and destination cannot be the same.");
        return;
      }
    }

    if (activeTab === "cabs") {
      if (!values.pickup?.trim() || !values.drop?.trim() || !values.date) {
        showToast.error("Please enter pickup, drop, and travel date.");
        return;
      }
      if (normalizePlace(values.pickup) === normalizePlace(values.drop)) {
        showToast.error("Pickup and drop locations cannot be the same.");
        return;
      }
    }

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) {
      if (v) params.set(k, v);
    }
    // Only flights support round-trip
    if (activeTab === "flights" && showTripToggle) params.set("trip", tripType);
    const qs = params.toString();
    router.push(`/${activeTab}${qs ? `?${qs}` : ""}`);
  }, [activeTab, values, tripType, showTripToggle, router]);

  const suggestions = useMemo(() => {
    if (!debouncedTerm || !focusedField) return [] as SuggestionOption[];

    const toSuggestionOptions = (pool: string[]): SuggestionOption[] =>
      Array.from(new Set(pool.filter((entry) => entry.toLowerCase().includes(debouncedTerm)))).slice(0, 6)
        .map((entry) => ({ label: entry, value: entry.split("(")[0]?.trim() || entry }));

    if (activeTab === "flights") {
      const pool = flights.flatMap((flight) => [
        `${flight.from} (${flight.fromCode})`,
        `${flight.to} (${flight.toCode})`,
      ]);
      return toSuggestionOptions(pool);
    }

    if (activeTab === "trains") {
      // Show stations only (not train names) so applySuggestion correctly resolves codes
      const pool = trains.flatMap((train) => [
        `${train.from} (${train.fromCode})`,
        `${train.to} (${train.toCode})`,
      ]);
      return toSuggestionOptions(pool);
    }

    if (activeTab === "hotels") {
      return hotelSuggestions;
    }

    const pool = cabs.flatMap((cab) => [cab.city, cab.carModel, cab.brand]);
    return toSuggestionOptions(pool);
  }, [activeTab, debouncedTerm, focusedField, hotelSuggestions]);

  const applySuggestion = (suggestion: SuggestionOption) => {
    if (!focusedField) return;
    handleChange(focusedField, suggestion.value);
    setFocusedField(null);
  };

  return (
    <div className={styles.searchCard}>
      {/* Tab strip */}
      <div className={styles.tabStrip}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => handleTabChange(tab.id)}
            type="button"
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trip-type toggle (flights & trains only) */}
      {showTripToggle && (
        <div className={styles.tripToggle}>
          <button
            type="button"
            className={`${styles.tripBtn} ${tripType === "one-way" ? styles.tripBtnActive : ""}`}
            onClick={() => setTripType("one-way")}
          >
            One Way
          </button>
          <button
            type="button"
            className={`${styles.tripBtn} ${tripType === "round-trip" ? styles.tripBtnActive : ""}`}
            onClick={() => setTripType("round-trip")}
          >
            Round Trip
          </button>
        </div>
      )}

      {/* Fields — key forces re-mount for slide animation */}
      <div className={styles.fieldsRow} key={`${activeTab}-${tripType}`}>
        {fields.map((field) => (
          <div key={field.key} className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{field.label}</label>
            <input
              className={styles.fieldInput}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              min={field.type === "date" ? (field.key === "return" ? (values.date || getTodayIso()) : field.key === "checkout" ? (values.checkin || getTodayIso()) : getTodayIso()) : undefined}
              onFocus={() => setFocusedField(field.key)}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
            {focusedField === field.key && suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.label}-${suggestion.value}`}
                    type="button"
                    className={styles.suggestionItem}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button className={styles.searchBtn} type="button" onClick={handleSearch}>
          🔍 Search
        </button>
      </div>
    </div>
  );
}