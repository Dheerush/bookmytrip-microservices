"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";

export default function AdminDashboardPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  if (!hydrated || user?.role !== "admin") return null;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Admin Dashboard</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>
        Manage platform-level requests, complaints, and service data.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div style={{ padding: 16, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <div style={{ fontWeight: 600 }}>Pending Requests</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>14</div>
        </div>
        <div style={{ padding: 16, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <div style={{ fontWeight: 600 }}>Open Complaints</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>6</div>
        </div>
        <div style={{ padding: 16, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <div style={{ fontWeight: 600 }}>Active Vendors</div>
          <div style={{ marginTop: 8, fontSize: 24 }}>87</div>
        </div>
      </div>
    </section>
  );
}
