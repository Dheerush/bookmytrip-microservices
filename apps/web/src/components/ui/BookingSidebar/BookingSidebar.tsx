"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/http";
import { useAuth } from "@/services/auth/context";
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

interface PublicCoupon {
  _id?: string;
  code: string;
  description?: string;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  oneTimePerUser?: boolean;
  usedBy?: string[];
  applicableOn?: string[];
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
  const { user } = useAuth();
  const [coupon, setCoupon] = useState(initialCouponCode);
  const [selectedCouponCode, setSelectedCouponCode] = useState(initialCouponCode);
  const [couponDiscount, setCouponDiscount] = useState(initialCouponDiscount);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<PublicCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const normalizedServiceType = (serviceType || "").trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoadingCoupons(true);
        const res = await fetch("/api/admin/coupons/public", { cache: "no-store" });
        const data = await res.json() as { data?: { items?: PublicCoupon[] } };
        if (!mounted) return;
        setAvailableCoupons(data?.data?.items || []);
      } catch {
        if (!mounted) return;
        setAvailableCoupons([]);
      } finally {
        if (mounted) setLoadingCoupons(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const eligibleCoupons = useMemo(() => {
    return availableCoupons.filter((entry) => {
      const targets = (entry.applicableOn || []).map((value) => value.toLowerCase());
      if (targets.length === 0) return true;
      if (!normalizedServiceType) return true;
      return targets.includes(normalizedServiceType) || targets.includes("all");
    });
  }, [availableCoupons, normalizedServiceType]);

  const isCouponDisabled = (entry: PublicCoupon) => {
    const exhausted = (entry.usageLimit || 0) > 0 && (entry.usedCount || 0) >= (entry.usageLimit || 0);
    const alreadyUsed = Boolean(
      entry.oneTimePerUser &&
      user?.id &&
      Array.isArray(entry.usedBy) &&
      entry.usedBy.includes(user.id),
    );
    return exhausted || alreadyUsed;
  };

  const selectedCoupon = useMemo(
    () => eligibleCoupons.find((entry) => entry.code === selectedCouponCode),
    [eligibleCoupons, selectedCouponCode],
  );

  const estimatedSelectedDiscount = useMemo(() => {
    if (!selectedCoupon) return 0;
    const extraTotal = extraLines.reduce((s, l) => s + l.amount, 0);
    const subtotal = Math.max(0, baseFare + taxes + serviceFee + extraTotal - discount);
    if (selectedCoupon.minOrderValue && subtotal < selectedCoupon.minOrderValue) return 0;
    if (selectedCoupon.discountType === "percent") {
      const computed = Math.round((subtotal * Number(selectedCoupon.discountValue || 0)) / 100);
      return Math.min(computed, Number(selectedCoupon.maxDiscount || computed));
    }
    return Math.min(subtotal, Number(selectedCoupon.discountValue || 0));
  }, [baseFare, discount, extraLines, selectedCoupon, serviceFee, taxes]);

  const applyCoupon = async (inputCode?: unknown) => {
    const code = String(inputCode ?? selectedCouponCode ?? coupon ?? "").trim().toUpperCase();
    if (!code) return;
    setCoupon(code);
    setSelectedCouponCode(code);
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
      <div className={styles.couponSection}>
        <label className={styles.couponLabel} htmlFor="booking-coupon-select">Available Coupons</label>
        <div className={styles.couponBox}>
          <select
            id="booking-coupon-select"
            className={styles.couponSelect}
            value={selectedCouponCode}
            onChange={(e) => {
              const nextCode = e.target.value;
              setSelectedCouponCode(nextCode);
              setCoupon(nextCode);
              setCouponMsg(null);
            }}
          >
            <option value="">Select a coupon</option>
            {eligibleCoupons.map((entry) => {
              const disabled = isCouponDisabled(entry);
              const alreadyUsed = Boolean(entry.oneTimePerUser && user?.id && entry.usedBy?.includes(user.id));
              const exhausted = (entry.usageLimit || 0) > 0 && (entry.usedCount || 0) >= (entry.usageLimit || 0);
              const status = alreadyUsed ? "Used" : exhausted ? "Unavailable" : "";
              const label = status ? `${entry.code} - ${status}` : entry.code;
              return (
                <option key={entry._id || entry.code} value={entry.code} disabled={disabled}>
                  {label}
                </option>
              );
            })}
          </select>
          <button className={styles.couponBtn} type="button" onClick={() => void applyCoupon()} disabled={applying || !selectedCouponCode}>
            {applying ? "..." : "Apply"}
          </button>
        </div>
      </div>
      {selectedCoupon && (
        <div className={styles.couponPreview}>
          <div className={styles.couponPreviewHeader}>
            <span className={styles.couponCode}>{selectedCoupon.code}</span>
            {estimatedSelectedDiscount > 0 ? <span className={styles.couponPreviewValue}>Save ₹{estimatedSelectedDiscount.toLocaleString("en-IN")}</span> : null}
          </div>
          {selectedCoupon.description ? <p className={styles.couponHint}>{selectedCoupon.description}</p> : null}
          <div className={styles.couponPreviewMeta}>
            <span>
              {selectedCoupon.discountType === "percent"
                ? `${selectedCoupon.discountValue || 0}% off${selectedCoupon.maxDiscount ? ` up to ₹${selectedCoupon.maxDiscount}` : ""}`
                : `₹${selectedCoupon.discountValue || 0} off`}
            </span>
            {selectedCoupon.minOrderValue ? <span>Min order ₹{Number(selectedCoupon.minOrderValue).toLocaleString("en-IN")}</span> : null}
          </div>
        </div>
      )}
      {couponMsg && (
        <p className={`${styles.couponMsg} ${couponDiscount > 0 ? styles.couponSuccess : styles.couponError}`}>
          {couponMsg}
        </p>
      )}
      {loadingCoupons ? <p className={styles.couponHint}>Loading coupons...</p> : null}
      {!loadingCoupons && eligibleCoupons.length === 0 ? <p className={styles.couponHint}>No eligible coupons for this booking.</p> : null}

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
