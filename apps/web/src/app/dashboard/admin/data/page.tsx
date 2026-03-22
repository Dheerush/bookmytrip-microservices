"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";

const SERVICES = [
  { name: "Flights", records: 1280, status: "healthy" },
  { name: "Hotels", records: 920, status: "healthy" },
  { name: "Trains", records: 410, status: "healthy" },
  { name: "Cabs", records: 335, status: "degraded" },
];

export default function AdminDataPage() {
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
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Data Management</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>Quick snapshot across service inventories.</p>
      <div style={{ display: "grid", gap: 10 }}>
        {SERVICES.map((service) => (
          <div key={service.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{service.name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{service.records} indexed records</div>
            </div>
            <span style={{ textTransform: "capitalize" }}>{service.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
