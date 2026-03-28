"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import ButtonLoader from "@/components/ui/ButtonLoader/ButtonLoader";
import { getAuthHeaders, parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/services/auth/context";
import styles from "./page.module.scss";

type ReviewItem = {
  _id: string;
  itemType: string;
  itemId: string;
  title: string;
  comment: string;
  rating: number;
  status: string;
  createdAt: string;
};

const testimonials = [
  { name: "Ayesha S.", quote: "Flight booking was smooth and real-time updates were spot on.", rating: 5 },
  { name: "Rohan P.", quote: "The cab and hotel combo worked perfectly for my family trip.", rating: 4 },
  { name: "Neha K.", quote: "Support and booking history transparency are excellent.", rating: 5 },
];

const defaultFilters = {
  itemType: "flight",
  itemId: "",
  page: "1",
  limit: "10",
};

export default function ReviewsPage() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ itemType: "flight", itemId: "", rating: "5", title: "", comment: "" });

  const heading = useMemo(() => `${filters.itemType[0].toUpperCase()}${filters.itemType.slice(1)} Reviews`, [filters.itemType]);

  const fetchReviews = useCallback(async () => {
    if (!filters.itemId.trim()) {
      setReviews([]);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ page: filters.page, limit: filters.limit });
      const response = await fetch(`/api/reviews/${filters.itemType}/${filters.itemId}?${params.toString()}`);
      const parsed = await parseApiResponse<{ items: ReviewItem[] }>(response, "Unable to fetch reviews.");
      if (!parsed.ok || !parsed.payload?.data) {
        throw new Error(parsed.payload?.message || "Unable to fetch reviews.");
      }
      setReviews(parsed.payload.data.items || []);
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to fetch reviews.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      showToast.info("Please sign in to submit a review.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          itemType: form.itemType,
          itemId: form.itemId,
          rating: Number(form.rating),
          title: form.title,
          comment: form.comment,
        }),
      });
      const parsed = await parseApiResponse<unknown>(response, "Unable to submit review.");
      if (!parsed.ok) {
        throw new Error(parsed.payload?.message || "Unable to submit review.");
      }
      showToast.success("Review submitted for moderation.");
      await fetchReviews();
      setForm((prev) => ({ ...prev, title: "", comment: "" }));
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Guest Stories</p>
        <h1>Reviews and Testimonials</h1>
        <p>
          Live review-service module for trust signals, premium social proof, and actionable product feedback.
        </p>
      </header>

      <div className={styles.testimonialGrid}>
        {testimonials.map((item) => (
          <article key={item.name} className={styles.testimonialCard}>
            <strong>{item.name}</strong>
            <p>{item.quote}</p>
            <span>{"★".repeat(item.rating)}</span>
          </article>
        ))}
      </div>

      <div className={styles.panel}>
        <h2>Browse Reviews</h2>
        <div className={styles.filters}>
          <select value={filters.itemType} onChange={(event) => setFilters((prev) => ({ ...prev, itemType: event.target.value }))}>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="train">Train</option>
            <option value="cab">Cab</option>
            <option value="tour">Tour</option>
            <option value="package">Package</option>
          </select>
          <input placeholder="Item ID" value={filters.itemId} onChange={(event) => setFilters((prev) => ({ ...prev, itemId: event.target.value }))} />
          <input type="number" min={1} value={filters.page} onChange={(event) => setFilters((prev) => ({ ...prev, page: event.target.value }))} />
          <input type="number" min={1} max={50} value={filters.limit} onChange={(event) => setFilters((prev) => ({ ...prev, limit: event.target.value }))} />
        </div>
      </div>

      <div className={styles.reviewList}>
        <h2>{heading}</h2>
        {loading && <div className={styles.muted}>Loading reviews...</div>}
        {!loading && reviews.length === 0 && <div className={styles.muted}>No reviews found for this item.</div>}
        {reviews.map((review) => (
          <article key={review._id} className={styles.reviewCard}>
            <div className={styles.reviewTop}>
              <strong>{review.title}</strong>
              <span>{"★".repeat(review.rating)}</span>
            </div>
            <p>{review.comment}</p>
            <div className={styles.reviewMeta}>
              <span>{review.itemType} • {review.itemId}</span>
              <span>{review.status}</span>
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={submitReview} className={styles.panel}>
        <h2>Submit Feedback</h2>
        <div className={styles.filters}>
          <select value={form.itemType} onChange={(event) => setForm((prev) => ({ ...prev, itemType: event.target.value }))}>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="train">Train</option>
            <option value="cab">Cab</option>
            <option value="tour">Tour</option>
            <option value="package">Package</option>
          </select>
          <input required placeholder="Item ID" value={form.itemId} onChange={(event) => setForm((prev) => ({ ...prev, itemId: event.target.value }))} />
          <input type="number" min={1} max={5} value={form.rating} onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))} />
        </div>
        <input className={styles.input} required placeholder="Review title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
        <textarea className={styles.textarea} required rows={4} placeholder="Write your experience" value={form.comment} onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))} />
        <div className={styles.submitRow}>
          <ButtonLoader type="submit" loading={submitting} loadingText="Submitting...">Submit Review</ButtonLoader>
        </div>
      </form>
    </section>
  );
}
