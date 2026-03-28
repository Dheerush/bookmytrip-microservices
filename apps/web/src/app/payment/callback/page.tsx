"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CallbackContent() {
  const params = useSearchParams();
  const status = params.get("status") || "unknown";
  const bookingId = params.get("bookingId") || "-";
  const paymentRef = params.get("paymentRef") || "-";
  const razorpayPaymentId = params.get("razorpayPaymentId") || "-";

  const color = status === "success" ? "green" : status === "cancelled" ? "#b45309" : "crimson";

  return (
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "30px 16px", display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Payment Callback</h1>
      <p style={{ margin: 0, color }}>Status: {status}</p>
      <div style={{ border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)", padding: 12 }}>
        <p style={{ margin: "0 0 6px" }}><strong>Booking ID:</strong> {bookingId}</p>
        <p style={{ margin: "0 0 6px" }}><strong>Payment Ref:</strong> {paymentRef}</p>
        <p style={{ margin: 0 }}><strong>Razorpay Payment ID:</strong> {razorpayPaymentId}</p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/dashboard/bookings">Go to Bookings</Link>
        <Link href="/payment/integration">Retry Payment</Link>
      </div>
    </section>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<section style={{ padding: "30px 16px" }}>Loading callback...</section>}>
      <CallbackContent />
    </Suspense>
  );
}
