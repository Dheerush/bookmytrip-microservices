"use client";

import DashboardHomePage from "@/components/dashboard/DashboardHome/DashboardHome";
import { useAuth } from "@/services/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role === "admin") {
      router.replace("/dashboard/admin");
      return;
    }
    if (user?.role === "vendor") {
      router.replace("/dashboard/vendor");
    }
  }, [hydrated, user?.role, router]);

  if (!hydrated) return null;
  if (user?.role === "admin" || user?.role === "vendor") return null;

  return <DashboardHomePage />;
}
