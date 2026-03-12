"use client";

import { useState } from "react";
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
  onProceed?: (netAmount: number) => void;
}

const COUPON_MAP: Record<string, number> = {
  SAVE200: 200,
  TRIP500: 500,
  WELCOME: 300,
  FIRST100: 100,
};

export default function BookingSidebar({
  baseFare,
  taxes = 0,
  serviceFee = 0,
  extraLines = [],
  discount = 0,
  ctaLabel = "Proceed to Payment",
  onProceed,
}: BookingSidebarProps) {
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    const value = COUPON_MAP[code];
    if (value) {
      setCouponDiscount(value);
      setCouponMsg(`Coupon applied! ₹${value} off`);
    } else {
      setCouponDiscount(0);
      setCouponMsg("Invalid coupon code");
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
        <button className={styles.couponBtn} type="button" onClick={applyCoupon}>
          Apply
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
