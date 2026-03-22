"use client";

import React from "react";
import DashboardShell from "@/components/dashboard/DashboardShell/DashboardShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated } = useRequireAuth();

  // Don't render anything until hydration is complete
  if (!hydrated || !isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ivory)",
      }}>
        <div style={{
          width: 32, height: 32,
          border: "2px solid var(--border-soft)",
          borderTopColor: "var(--sky)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
