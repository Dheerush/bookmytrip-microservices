"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";

const REVIEWS = [
  { id: "RV-3001", source: "Flight Listing", rating: 5, comment: "Smooth boarding and on-time departure." },
  { id: "RV-3002", source: "Hotel Listing", rating: 4, comment: "Clean rooms, responsive support." },
  { id: "RV-3003", source: "Cab Listing", rating: 3, comment: "Driver arrived late but trip was safe." },
];

export default function VendorReviewsPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "vendor") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  if (!hydrated || user?.role !== "vendor") return null;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Vendor Reviews</h1>
      <div style={{ display: "grid", gap: 10 }}>
        {REVIEWS.map((review) => (
          <article key={review.id} style={{ padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{review.source}</strong>
              <span>{"★".repeat(review.rating)}</span>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--text-muted)" }}>{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
