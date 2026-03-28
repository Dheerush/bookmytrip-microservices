"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";
import { getAuthHeaders, parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";

type ReviewItem = {
  _id: string;
  itemType: string;
  title: string;
  rating: number;
  comment: string;
  status: string;
};

export default function VendorReviewsPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "vendor") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  useEffect(() => {
    if (!hydrated || user?.role !== "vendor") return;

    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/reviews/me/list", {
          method: "GET",
          headers: getAuthHeaders(),
        });
        const parsed = await parseApiResponse<{ items: ReviewItem[] }>(response, "Unable to fetch reviews.");

        if (!mounted) return;
        if (!parsed.ok || !parsed.payload?.data) {
          throw new Error(parsed.payload?.message || "Unable to fetch reviews.");
        }
        setReviews(parsed.payload.data.items || []);
      } catch (error) {
        if (!mounted) return;
        showToast.error(error instanceof Error ? error.message : "Unable to fetch reviews.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [hydrated, user?.role]);

  if (!hydrated || user?.role !== "vendor") return null;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Vendor Reviews</h1>
      {loading && <div style={{ color: "var(--text-muted)" }}>Loading reviews...</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {!loading && reviews.length === 0 && (
          <div style={{ color: "var(--text-muted)" }}>No reviews available yet.</div>
        )}
        {reviews.map((review) => (
          <article key={review._id} style={{ padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{review.title}</strong>
              <span>{"★".repeat(review.rating)}</span>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--text-muted)" }}>{review.comment}</p>
            <p style={{ marginTop: 6, marginBottom: 0, color: "var(--text-muted)", fontSize: 12 }}>
              {review.itemType} • {review.status}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
