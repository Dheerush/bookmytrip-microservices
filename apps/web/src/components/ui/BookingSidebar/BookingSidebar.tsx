"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/http";
import styles from "./BookingSidebar.module.scss";

interface FareLine {
  label: string;
  amount: number;
}

interface BookingSidebarProps {
  baseFare: number;
  taxes?: number;
  serviceFee?: number;
  extraLines?: FareLine[];
  /** Pre-applied discount from search card (e.g. original - discounted) */
  discount?: number;
  ctaLabel?: string;
  serviceType?: string;
  initialCouponCode?: string;
  initialCouponDiscount?: number;
  onCouponApplied?: (payload: { code: string; discount: number }) => void;
  onProceed?: (netAmount: number) => void;
}

export default function BookingSidebar({
  baseFare,
  taxes = 0,
  serviceFee = 0,
  extraLines = [],
  discount = 0,
  ctaLabel = "Proceed to Payment",
  serviceType,
  initialCouponCode = "",
  initialCouponDiscount = 0,
  onCouponApplied,
  onProceed,
}: BookingSidebarProps) {
  const [coupon, setCoupon] = useState(initialCouponCode);
  const [couponDiscount, setCouponDiscount] = useState(initialCouponDiscount);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const extraTotal = extraLines.reduce((s, l) => s + l.amount, 0);
    const subtotal = baseFare + taxes + serviceFee + extraTotal - discount;
    try {
      setApplying(true);
      const res = await fetch("/api/admin/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ code, amount: subtotal, serviceType: serviceType || "" }),
      });
      const data = await res.json() as { success?: boolean; data?: { discount?: number }; message?: string };
      if (data.success && data.data?.discount != null) {
        setCouponDiscount(data.data.discount);
        setCouponMsg(`Coupon applied! ₹${data.data.discount} off`);
        onCouponApplied?.({ code, discount: data.data.discount });
      } else {
        setCouponDiscount(0);
        setCouponMsg(data.message || "Invalid coupon code");
        onCouponApplied?.({ code, discount: 0 });
      }
    } catch {
      setCouponDiscount(0);
      setCouponMsg("Could not validate coupon. Try again.");
      onCouponApplied?.({ code, discount: 0 });
    } finally {
      setApplying(false);
    }
  };

  const extraTotal = extraLines.reduce((s, l) => s + l.amount, 0);
  const subtotal = baseFare + taxes + serviceFee + extraTotal;
  const totalDiscount = discount + couponDiscount;
  const netAmount = Math.max(0, subtotal - totalDiscount);

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.title}>Fare Summary</h3>

      <div className={styles.lines}>
        <div className={styles.line}>
          <span>Base Fare</span>
          <span>₹{baseFare.toLocaleString("en-IN")}</span>
        </div>
        {taxes > 0 && (
          <div className={styles.line}>
            <span>Taxes & Fees</span>
            <span>₹{taxes.toLocaleString("en-IN")}</span>
          </div>
        )}
        {serviceFee > 0 && (
          <div className={styles.line}>
            <span>Service Charge</span>
            <span>₹{serviceFee.toLocaleString("en-IN")}</span>
          </div>
        )}
        {extraLines.map((l) => (
          <div className={styles.line} key={l.label}>
            <span>{l.label}</span>
            <span>₹{l.amount.toLocaleString("en-IN")}</span>
          </div>
        ))}
        {discount > 0 && (
          <div className={`${styles.line} ${styles.discount}`}>
            <span>Discount</span>
            <span>-₹{discount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className={`${styles.line} ${styles.discount}`}>
            <span>Coupon ({coupon.toUpperCase()})</span>
            <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      {/* Coupon */}
      <div className={styles.couponBox}>
        <input
          className={styles.couponInput}
          type="text"
          placeholder="Coupon code"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
        <button className={styles.couponBtn} type="button" onClick={applyCoupon} disabled={applying}>
          {applying ? "..." : "Apply"}
        </button>
      </div>
      {couponMsg && (
        <p className={`${styles.couponMsg} ${couponDiscount > 0 ? styles.couponSuccess : styles.couponError}`}>
          {couponMsg}
        </p>
      )}

      {/* Net Amount */}
      <div className={styles.netRow}>
        <span>Net Amount</span>
        <span className={styles.netAmount}>₹{netAmount.toLocaleString("en-IN")}</span>
      </div>

      <button className={styles.cta} type="button" onClick={() => onProceed?.(netAmount)}>
        {ctaLabel}
      </button>
    </aside>
  );
}
