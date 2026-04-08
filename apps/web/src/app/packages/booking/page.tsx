"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const createTravelers = (count: number): Traveler[] =>
  Array.from({ length: count }, () => ({
    name: "",
    age: "",
    gender: "male",
  }));

function PackageBookingContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
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
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast.error("Please fill contact details.");
      return;
    }

    const hasInvalidTraveler = travelers.some((traveler) => !traveler.name.trim());
    if (hasInvalidTraveler) {
      showToast.error("Please enter all additional traveler names.");
      return;
    }

    setSubmitting(true);
    try {
      await guardAction(async () => {
        await processBookingAndPayment(
          {
            itemId: pkg.id,
            type: "tour",
            title: `${pkg.name} (${pkg.subRegion})`,
            city: pkg.subRegion,
            startDate,
            quantity: totalTravelers,
            amount: baseFare,
            contact: {
              name: contactName.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
            passengers: [
              { name: contactName.trim() },
              ...travelers.map((traveler) => ({
                name: traveler.name.trim(),
                age: Number(traveler.age) || undefined,
                gender: traveler.gender,
              })),
            ],
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
