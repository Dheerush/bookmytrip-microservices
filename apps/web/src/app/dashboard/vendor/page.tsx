"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";

export default function VendorDashboardPage() {
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
      <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Vendor Dashboard</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>
        Track bookings, ratings, and listing performance for your inventory.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div style={{ padding: 16, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <div style={{ fontWeight: 600 }}>New Bookings</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>9</div>
        </div>
        <div style={{ padding: 16, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <div style={{ fontWeight: 600 }}>Average Rating</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>4.6</div>
        </div>
        <div style={{ padding: 16, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <div style={{ fontWeight: 600 }}>Pending Actions</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>3</div>
        </div>
      </div>
    </section>
  );
}
