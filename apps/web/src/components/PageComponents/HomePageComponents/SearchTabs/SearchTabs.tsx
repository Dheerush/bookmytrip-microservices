"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchTabs.module.scss";

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
  { key: "guests",   label: "👥 Guests",       placeholder: "2 Adults, 1 Room" },
];

const CAB_FIELDS: Field[] = [
  { key: "pickup", label: "📍 Pickup",  placeholder: "Pickup location…" },
  { key: "drop",   label: "📍 Drop",    placeholder: "Drop location…" },
  { key: "date",   label: "📅 Date",    placeholder: "Date", type: "date" },
];

// ─── Component ────────────────────────────────────────────
export default function SearchTabs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("flights");
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [values, setValues] = useState<Record<string, string>>({});

  const showTripToggle = activeTab === "flights" || activeTab === "trains";

  const fields =
    activeTab === "flights"
      ? getFlightFields(tripType)
      : activeTab === "trains"
        ? getTrainFields(tripType)
        : activeTab === "cabs"
          ? CAB_FIELDS
          : HOTEL_FIELDS;

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setValues({});
  };

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) {
      if (v) params.set(k, v);
    }
    if (showTripToggle) params.set("trip", tripType);
    const qs = params.toString();
    router.push(`/${activeTab}${qs ? `?${qs}` : ""}`);
  }, [activeTab, values, tripType, showTripToggle, router]);

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
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          </div>
        ))}

        <button className={styles.searchBtn} type="button" onClick={handleSearch}>
          🔍 Search
        </button>
      </div>
    </div>
  );
}