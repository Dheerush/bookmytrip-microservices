"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";
import { listInventory } from "@/services/inventory/api";

type ServiceCard = { name: string; records: number; status: "healthy" | "degraded" };

export default function AdminDataPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  useEffect(() => {
    if (!hydrated || user?.role !== "admin") return;

    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [flights, hotels, trains, cabs, tours] = await Promise.all([
          listInventory("flights", { page: 1, limit: 1 }),
          listInventory("hotels", { page: 1, limit: 1 }),
          listInventory("trains", { page: 1, limit: 1 }),
          listInventory("cabs", { page: 1, limit: 1 }),
          listInventory("tours", { page: 1, limit: 1, city: "goa" }),
        ]);

        if (!mounted) return;

        setServices([
          { name: "Flights", records: flights.total, status: flights.total > 0 ? "healthy" : "degraded" },
          { name: "Hotels", records: hotels.total, status: hotels.total > 0 ? "healthy" : "degraded" },
          { name: "Trains", records: trains.total, status: trains.total > 0 ? "healthy" : "degraded" },
          { name: "Cabs", records: cabs.total, status: cabs.total > 0 ? "healthy" : "degraded" },
          { name: "Tours", records: tours.total, status: tours.total > 0 ? "healthy" : "degraded" },
        ]);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to fetch data snapshot.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [hydrated, user?.role]);

  if (!hydrated || user?.role !== "admin") return null;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Data Management</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>Live snapshot from your backend services.</p>
      {loading && <div style={{ color: "var(--text-muted)" }}>Loading live counts...</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {services.map((service) => (
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
