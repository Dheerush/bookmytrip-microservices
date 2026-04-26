"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { packages, type Package } from "@/data/packages";
import { useAuth } from "@/services/auth/context";
import { useBookingGuard } from "@/hooks/useBookingGuard";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { showToast } from "@/lib/toast";
import s from "@/styles/booking.module.scss";

type Traveler = {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  email: string;
  currentLocation: string;
};

type TourApiDetail = {
  _id: string;
  title: string;
  city: string;
  country: string;
  durationDays: number;
  basePrice: number;
  discountPrice?: number;
};

type TravelMode = "flight" | "train" | "self";

type TravelOption = {
  id: string;
  label: string;
  amount: number;
  meta?: string;
  inventoryType?: "flight" | "train";
  inventoryId?: string;
  seatClass?: string;
  availableSeats?: number;
};

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0] || isoDate;
};

const FLIGHT_CITY_ALIASES: Record<string, string> = {
  delhi: "DEL",
  "new delhi": "DEL",
  mumbai: "BOM",
  bangalore: "BLR",
  bengaluru: "BLR",
  kolkata: "CCU",
  chennai: "MAA",
  hyderabad: "HYD",
  pune: "PNQ",
  goa: "GOI",
  jaipur: "JAI",
  ahmedabad: "AMD",
  lucknow: "LKO",
};

const TRAIN_CITY_ALIASES: Record<string, string> = {
  delhi: "NDLS",
  "new delhi": "NDLS",
  mumbai: "BCT",
  kolkata: "HWH",
  chennai: "MAS",
  bangalore: "SBC",
  bengaluru: "SBC",
  hyderabad: "HYB",
  lucknow: "LKO",
  goa: "MAO",
};

const resolveAliasCode = (value: string, aliases: Record<string, string>, min = 3, max = 3): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  const regex = new RegExp(`^[A-Z]{${min},${max}}$`);
  if (regex.test(upper)) {
    return aliases[trimmed.toLowerCase()] || upper;
  }
  return aliases[trimmed.toLowerCase()] || null;
};

const createTravelers = (count: number): Traveler[] =>
  Array.from({ length: count }, () => ({
    name: "",
    age: "",
    gender: "male",
    email: "",
    currentLocation: "",
  }));

const hasModeIncluded = (pkg: Package | null, mode: Exclude<TravelMode, "self">): boolean => {
  if (!pkg) return false;
  const text = [
    ...(pkg.transport || []),
    ...(pkg.inclusions || []),
  ].join(" ").toLowerCase();
  const keywords = mode === "flight"
    ? ["flight", "flights", "air"]
    : ["train", "rail", "railway"];
  return keywords.some((keyword) => text.includes(keyword));
};

function PackageBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuth();
  const { guardAction } = useBookingGuard();
  const { processBookingAndPayment } = useBookingFlow();

  const packageId = searchParams.get("packageId") || "";
  const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0];

  const staticPackage = useMemo(() => packages.find((entry) => entry.id === packageId) || null, [packageId]);
  const [pkg, setPkg] = useState<Package | null>(staticPackage);
  const [loadingPkg, setLoadingPkg] = useState(Boolean(packageId && !staticPackage));

  const [additionalTravelers, setAdditionalTravelers] = useState(0);
  const [travelers, setTravelers] = useState<Traveler[]>([]);

  const [contactName, setContactName] = useState(user?.fullName || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>("flight");
  const [travelOptions, setTravelOptions] = useState<TravelOption[]>([]);
  const [travelLoading, setTravelLoading] = useState(false);
  const [selectedTravelOptionId, setSelectedTravelOptionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allowsFlight = useMemo(() => hasModeIncluded(pkg, "flight"), [pkg]);
  const allowsTrain = useMemo(() => hasModeIncluded(pkg, "train"), [pkg]);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) return;
    showToast.info("Sign in to continue with package booking.");
    router.replace("/login");
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === additionalTravelers) return prev;
      if (prev.length > additionalTravelers) return prev.slice(0, additionalTravelers);
      return [...prev, ...createTravelers(additionalTravelers - prev.length)];
    });
  }, [additionalTravelers]);

  useEffect(() => {
    if (!packageId || staticPackage) {
      setLoadingPkg(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/tours/${packageId}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: TourApiDetail };
        if (!mounted || !json.data) return;

        const tour = json.data;
        const mapped: Package = {
          id: tour._id,
          name: tour.title,
          region: tour.country === "India" ? "India" : "Abroad",
          subRegion: tour.city,
          cities: [tour.city],
          countries: [tour.country],
          price: tour.discountPrice ?? tour.basePrice,
          duration: `${tour.durationDays} days`,
          durationDays: tour.durationDays,
          durationNights: Math.max(0, tour.durationDays - 1),
          hotel: "Included",
          hotelRating: 4,
          food: [],
          transport: [],
          activities: [],
          inclusions: [],
          exclusions: [],
          bestSeason: "Oct-Mar",
          groupSize: "2-15 pax",
          tripType: "Leisure",
          guide: {
            name: "BMT Local Expert",
            speciality: `${tour.city} & surroundings`,
            rating: 4.5,
            experience: "5+ years",
            languages: ["English", "Hindi"],
            bio: `Knowledgeable local guide for ${tour.city} tours.`,
            contact: "+91 98765 43210",
            photo: "",
          },
          hospitality: "Standard",
          documents: [],
          reviews: [],
          images: [],
          heroImage: "",
          description: "",
          highlights: [],
          tags: [],
          cityFacts: [],
          countryFaqs: [],
        };

        setPkg(mapped);
      } finally {
        if (mounted) setLoadingPkg(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [packageId, staticPackage]);

  useEffect(() => {
    if (allowsFlight) {
      setTravelMode("flight");
      return;
    }
    if (allowsTrain) {
      setTravelMode("train");
      return;
    }
    setTravelMode("self");
    setTravelOptions([]);
    setSelectedTravelOptionId("");
  }, [allowsFlight, allowsTrain]);

  useEffect(() => {
    const run = async () => {
      const fromCode = resolveAliasCode(currentLocation, FLIGHT_CITY_ALIASES, 3, 3);
      const toCode = resolveAliasCode(pkg?.subRegion || "", FLIGHT_CITY_ALIASES, 3, 3);

      if (!pkg || !fromCode || !toCode || !startDate || travelMode !== "flight" || !allowsFlight) {
        setTravelOptions([]);
        setSelectedTravelOptionId("");
        return;
      }

      setTravelLoading(true);
      try {
        const params = new URLSearchParams({
          from: fromCode,
          to: toCode,
          date: startDate,
          sort: "price_asc",
          page: "1",
          limit: "5",
        });
        const res = await fetch(`/api/flights/search?${params.toString()}`);
        const json = (await res.json()) as {
          data?: { results?: Array<{ flight?: { _id?: string; flightCode?: string; airline?: string; departureTime?: string; arrivalTime?: string; seatsLeft?: number }; unitPrice?: number }> };
        };

        const options = (json.data?.results || []).map((entry) => ({
          id: entry.flight?._id || entry.flight?.flightCode || Math.random().toString(36),
          label: `${entry.flight?.airline || "Flight"} • ${entry.flight?.flightCode || ""}`.trim(),
          amount: Number(entry.unitPrice || 0),
          meta: `${entry.flight?.departureTime || ""} - ${entry.flight?.arrivalTime || ""}`.trim(),
          inventoryType: "flight" as const,
          inventoryId: entry.flight?._id,
          availableSeats: Number(entry.flight?.seatsLeft || 0),
        }));

        setTravelOptions(options);
        setSelectedTravelOptionId(options[0]?.id || "");
      } catch {
        setTravelOptions([]);
        setSelectedTravelOptionId("");
      } finally {
        setTravelLoading(false);
      }
    };

    void run();
  }, [allowsFlight, currentLocation, pkg, startDate, travelMode]);

  useEffect(() => {
    const run = async () => {
      const fromCode = resolveAliasCode(currentLocation, TRAIN_CITY_ALIASES, 3, 4);
      const toCode = resolveAliasCode(pkg?.subRegion || "", TRAIN_CITY_ALIASES, 3, 4);

      if (!pkg || !fromCode || !toCode || !startDate || travelMode !== "train" || !allowsTrain) {
        setTravelOptions([]);
        setSelectedTravelOptionId("");
        return;
      }

      setTravelLoading(true);
      try {
        const params = new URLSearchParams({
          from: fromCode,
          to: toCode,
          date: startDate,
          sort: "price_asc",
          page: "1",
          limit: "5",
        });
        const res = await fetch(`/api/trains/search?${params.toString()}`);
        const json = (await res.json()) as {
          data?: { results?: Array<{ train?: { _id?: string; trainNumber?: string; name?: string; departureTime?: string; arrivalTime?: string; seatsAvailable?: Record<string, number> }; unitPrice?: number }> };
        };

        const options = (json.data?.results || []).map((entry) => ({
          id: entry.train?._id || entry.train?.trainNumber || Math.random().toString(36),
          label: `${entry.train?.name || "Train"} • ${entry.train?.trainNumber || ""}`.trim(),
          amount: Number(entry.unitPrice || 0),
          meta: `${entry.train?.departureTime || ""} - ${entry.train?.arrivalTime || ""}`.trim(),
          inventoryType: "train" as const,
          inventoryId: entry.train?._id,
          seatClass: "sleeper",
          availableSeats: Number(entry.train?.seatsAvailable?.sleeper || 0),
        }));

        setTravelOptions(options);
        setSelectedTravelOptionId(options[0]?.id || "");
      } catch {
        setTravelOptions([]);
        setSelectedTravelOptionId("");
      } finally {
        setTravelLoading(false);
      }
    };

    void run();
  }, [allowsTrain, currentLocation, pkg, startDate, travelMode]);

  if (hydrated && !isAuthenticated) {
    return null;
  }

  if (loadingPkg) {
    return <div className={s.page} style={{ padding: "18vh 24px", textAlign: "center" }}>Loading package details...</div>;
  }

  if (!pkg) {
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          <p>Package not found. Please select a package again.</p>
          <Link href="/packages" className={s.backLink}>Back to packages</Link>
        </div>
      </div>
    );
  }

  const totalTravelers = 1 + additionalTravelers;
  const baseFare = pkg.price * totalTravelers;
  const taxes = Math.round(baseFare * 0.05);
  const serviceFee = 199;
  const totalAmount = baseFare + taxes + serviceFee;

  const updateTraveler = (index: number, key: keyof Traveler, value: string) => {
    setTravelers((prev) => prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));
  };

  const selectedTravelOption = travelOptions.find((option) => option.id === selectedTravelOptionId) || null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast.error("Please fill contact details.");
      return;
    }

    if (!currentLocation.trim()) {
      showToast.error("Please provide your current location.");
      return;
    }

    if (travelMode !== "self" && !selectedTravelOption) {
      showToast.error(`Please select a ${travelMode} option for all travelers.`);
      return;
    }

    if (selectedTravelOption?.availableSeats != null && selectedTravelOption.availableSeats < totalTravelers) {
      showToast.error(`Only ${selectedTravelOption.availableSeats} ${travelMode === "flight" ? "seat" : "berth"}${selectedTravelOption.availableSeats === 1 ? " is" : "s are"} available for the selected ${travelMode}.`);
      return;
    }

    const hasInvalidTraveler = travelers.some((traveler) => !traveler.name.trim());
    if (hasInvalidTraveler) {
      showToast.error("Please enter all additional traveler names.");
      return;
    }

    setSubmitting(true);
    try {
      const flightFromCode = resolveAliasCode(currentLocation, FLIGHT_CITY_ALIASES, 3, 3);
      const flightToCode = resolveAliasCode(pkg.subRegion, FLIGHT_CITY_ALIASES, 3, 3);
      const packageEndDate = addDays(startDate, Math.max(0, pkg.durationDays - 1));

      await guardAction(async () => {
        await processBookingAndPayment(
          {
            itemId: pkg.id,
            type: "tour",
            title: `${pkg.name} (${pkg.subRegion})`,
            city: pkg.subRegion,
            fromCode: flightFromCode || undefined,
            toCode: flightToCode || undefined,
            startDate,
            endDate: packageEndDate,
            quantity: totalTravelers,
            amount: baseFare,
            contact: {
              name: contactName.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
            passengers: [
              {
                name: contactName.trim(),
                email: contactEmail.trim() || undefined,
              },
              ...travelers.map((traveler) => ({
                name: traveler.name.trim(),
                age: Number(traveler.age) || undefined,
                gender: traveler.gender,
                email: traveler.email.trim() || undefined,
              })),
            ],
            metadata: {
              packageTravel: {
                currentLocation: currentLocation.trim(),
                destinationCity: pkg.subRegion,
                travelMode,
                durationDays: pkg.durationDays,
                includesFlight: allowsFlight,
                includesTrain: allowsTrain,
                travelerPlans: [
                  {
                    travelerName: contactName.trim(),
                    travelerEmail: contactEmail.trim() || undefined,
                    currentLocation: currentLocation.trim(),
                    travelMode,
                    selectedOption: selectedTravelOption
                      ? {
                        ...selectedTravelOption,
                        travelersCovered: totalTravelers,
                      }
                      : null,
                  },
                  ...travelers.map((traveler) => ({
                    travelerName: traveler.name.trim(),
                    travelerEmail: traveler.email.trim() || undefined,
                    currentLocation: traveler.currentLocation.trim() || currentLocation.trim(),
                    travelMode,
                    selectedOption: selectedTravelOption
                      ? {
                        ...selectedTravelOption,
                        travelersCovered: totalTravelers,
                      }
                      : null,
                  })),
                ],
                selectedOption: selectedTravelOption
                  ? {
                    ...selectedTravelOption,
                    travelersCovered: totalTravelers,
                  }
                  : null,
              },
            },
          },
          totalAmount,
        );
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.page}>
      <Link href={`/packages/${pkg.id}`} className={s.backLink}>Back to package</Link>
      <h1 className={s.title}>Package Booking</h1>

      <div className={s.inner}>
        <div>
          <div className={s.summaryCard}>
            <div className={s.summaryBody}>
              <div className={s.summaryName}>{pkg.name}</div>
              <div className={s.summaryMeta}>{pkg.subRegion} • {pkg.duration}</div>
              <div className={s.summaryMeta}>Departure: {startDate}</div>
              <div className={s.summaryMeta}>Price per traveler: INR {pkg.price.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className={s.formCard}>
            <h2 className={s.sectionTitle}>Traveler Details</h2>
            <form onSubmit={handleSubmit}>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Additional Travelers</label>
                  <input
                    className={s.input}
                    type="number"
                    min={0}
                    max={8}
                    value={additionalTravelers}
                    onChange={(e) => setAdditionalTravelers(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
                  />
                </div>
                <div>
                  <label className={s.label}>Total Travelers</label>
                  <input className={s.input} value={String(totalTravelers)} readOnly />
                </div>
              </div>

              <div className={s.fieldFull}>
                <label className={s.label}>Lead Traveler Name</label>
                <input className={s.input} value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className={s.fieldRow}>
                <div>
                  <label className={s.label}>Contact Email</label>
                  <input className={s.input} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div>
                  <label className={s.label}>Contact Phone</label>
                  <input
                    className={s.input}
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                </div>
              </div>

              <div className={s.fieldFull}>
                <label className={s.label}>Current Location (city or code)</label>
                <input
                  className={s.input}
                  placeholder="Delhi or DEL"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                />
              </div>

              <div className={s.fieldFull}>
                <label className={s.label}>Travel To Package Destination</label>
                <div className={s.fieldRow}>
                  {allowsFlight && (
                    <button className={s.input} type="button" onClick={() => setTravelMode("flight")} style={{ cursor: "pointer", fontWeight: travelMode === "flight" ? 700 : 500 }}>
                      Flight
                    </button>
                  )}
                  {allowsTrain && (
                    <button className={s.input} type="button" onClick={() => setTravelMode("train")} style={{ cursor: "pointer", fontWeight: travelMode === "train" ? 700 : 500 }}>
                      Train
                    </button>
                  )}
                  <button className={s.input} type="button" onClick={() => { setTravelMode("self"); setTravelOptions([]); setSelectedTravelOptionId(""); }} style={{ cursor: "pointer", fontWeight: travelMode === "self" ? 700 : 500 }}>
                    Self-arranged
                  </button>
                </div>

                {!allowsFlight && !allowsTrain && (
                  <p className={s.summaryMeta}>This package does not include flight or train tickets. Please travel self-arranged.</p>
                )}

                {travelMode !== "self" && (
                  <div style={{ marginTop: 10 }}>
                    {travelLoading ? (
                      <p className={s.summaryMeta}>Checking {travelMode} options...</p>
                    ) : travelOptions.length > 0 ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        {travelOptions.map((option) => (
                          <label key={option.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="radio"
                              name="packageTravelOption"
                              checked={selectedTravelOptionId === option.id}
                              onChange={() => setSelectedTravelOptionId(option.id)}
                            />
                            <span>{option.label} {option.meta ? `(${option.meta})` : ""} - INR {option.amount.toLocaleString("en-IN")}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className={s.summaryMeta}>No direct {travelMode} options found for this route/date.</p>
                    )}
                  </div>
                )}
              </div>

              {travelers.map((traveler, index) => (
                <div key={`traveler-${index}`} className={s.fieldFull} style={{ marginTop: 12 }}>
                  <label className={s.label}>Additional Traveler {index + 1}</label>
                  <div className={s.fieldRow}>
                    <input
                      className={s.input}
                      placeholder="Full name"
                      value={traveler.name}
                      onChange={(e) => updateTraveler(index, "name", e.target.value)}
                    />
                    <input
                      className={s.input}
                      placeholder="Age"
                      type="number"
                      min={0}
                      value={traveler.age}
                      onChange={(e) => updateTraveler(index, "age", e.target.value)}
                    />
                  </div>
                  <div className={s.fieldRow}>
                    <input
                      className={s.input}
                      placeholder="Email (optional)"
                      type="email"
                      value={traveler.email}
                      onChange={(e) => updateTraveler(index, "email", e.target.value)}
                    />
                    <input
                      className={s.input}
                      placeholder="Current location (optional)"
                      value={traveler.currentLocation}
                      onChange={(e) => updateTraveler(index, "currentLocation", e.target.value)}
                    />
                  </div>
                  <div className={s.fieldRow}>
                    <select className={s.input} value={traveler.gender} onChange={(e) => updateTraveler(index, "gender", e.target.value as Traveler["gender"])}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              ))}

              <button className={s.ctaBtn} type="submit" disabled={submitting}>
                {submitting ? "Processing..." : "Pay And Confirm"}
              </button>
            </form>
          </div>
        </div>

        <div className={s.fareCard}>
          <h2 className={s.fareTitle}>Fare Summary</h2>
          <div className={s.fareLine}>
            <span>Per traveler</span>
            <span>INR {pkg.price.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareLine}>
            <span>Travelers x {totalTravelers}</span>
            <span>INR {baseFare.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareLine}>
            <span>Taxes (5%)</span>
            <span>INR {taxes.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareLine}>
            <span>Service fee</span>
            <span>INR {serviceFee.toLocaleString("en-IN")}</span>
          </div>
          <div className={s.fareTotal}>
            <span>Total</span>
            <span>INR {totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PackageBookingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20vh 24px", textAlign: "center" }}>Loading...</div>}>
      <PackageBookingContent />
    </Suspense>
  );
}
