"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ButtonLoader from "@/components/ui/ButtonLoader/ButtonLoader";
import { getAuthHeaders, parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";

interface RazorpayWindow extends Window {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
}

const loadRazorpay = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if ((window as RazorpayWindow).Razorpay) return true;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay SDK"));
    document.body.appendChild(script);
  });

  return Boolean((window as RazorpayWindow).Razorpay);
};

export default function PaymentIntegrationPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("1999");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const razorpayKey = useMemo(() => process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder", []);

  const handleCreatePayment = async () => {
    if (!bookingId.trim()) {
      showToast.error("Please provide a booking ID.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bookingId: bookingId.trim(),
          amount: Number(amount),
          currency: "INR",
          method,
          provider: "razorpay",
          metadata: { source: "payment-integration-shell" },
        }),
      });

      const parsed = await parseApiResponse<{ _id: string; paymentRef: string; status: string }>(
        response,
        "Unable to create payment.",
      );

      if (!parsed.ok || !parsed.payload?.data) {
        throw new Error(parsed.payload?.message || "Unable to create payment.");
      }

      const payment = parsed.payload.data;
      showToast.success(`Payment record created: ${payment.paymentRef}`);

      const sdkReady = await loadRazorpay();
      if (!sdkReady) {
        throw new Error("Razorpay SDK not available.");
      }

      const win = window as RazorpayWindow;
      const checkout = new win.Razorpay!({
        key: razorpayKey,
        amount: Number(amount) * 100,
        currency: "INR",
        name: "BookMyTrip",
        description: `Booking ${bookingId}`,
        handler: (details: Record<string, string>) => {
          const params = new URLSearchParams({
            status: "success",
            bookingId,
            paymentRef: payment.paymentRef,
            razorpayPaymentId: details.razorpay_payment_id || "",
          });
          router.push(`/payment/callback?${params.toString()}`);
        },
        modal: {
          ondismiss: () => {
            const params = new URLSearchParams({
              status: "cancelled",
              bookingId,
              paymentRef: payment.paymentRef,
            });
            router.push(`/payment/callback?${params.toString()}`);
          },
        },
        prefill: {
          email: "",
          contact: "",
        },
        notes: {
          bookingId,
          paymentRef: payment.paymentRef,
        },
      });

      checkout.open();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Payment integration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "30px 16px", display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Payment Integration Shell (Razorpay)</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>
        This shell creates payment records in payment-service and opens Razorpay checkout for client-side callback handling.
      </p>
      <div style={{ border: "1px solid var(--border-soft)", borderRadius: 12, padding: 14, background: "var(--paper)", display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Booking ID</span>
          <input value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="66f..." />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Amount (INR)</span>
          <input type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span>Method</span>
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
          </select>
        </label>
        <div>
          <ButtonLoader type="button" loading={loading} loadingText="Processing..." onClick={handleCreatePayment}>
            Launch Razorpay Checkout
          </ButtonLoader>
        </div>
      </div>
    </section>
  );
}
