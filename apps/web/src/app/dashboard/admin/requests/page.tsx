"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";

const REQUESTS = [
  { id: "REQ-901", type: "Vendor Onboarding", owner: "Aero Wings", status: "pending" },
  { id: "REQ-902", type: "Fare Rule Update", owner: "RailGo", status: "under_review" },
  { id: "REQ-903", type: "Hotel Listing Update", owner: "Coastal Stays", status: "pending" },
];

export default function AdminRequestsPage() {
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
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Admin Requests</h1>
      <div style={{ border: "1px solid var(--border-soft)", borderRadius: 12, overflow: "hidden", background: "var(--paper)" }}>
        {REQUESTS.map((request) => (
          <div key={request.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: 14, borderBottom: "1px solid var(--border-soft)" }}>
            <span>{request.id}</span>
            <span>{request.type}</span>
            <span>{request.owner}</span>
            <span style={{ textTransform: "capitalize" }}>{request.status.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
