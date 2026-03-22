"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";
import { showToast } from "@/lib/toast";

/**
 * Redirects to /login if user is not authenticated.
 * Shows a toast message when redirecting.
 * Returns { user, token, isAuthenticated, hydrated } from auth context.
 */
export function useRequireAuth(message?: string) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.hydrated) return;

    if (!auth.isAuthenticated) {
      showToast.info(message || "Please sign in to continue");
      router.replace("/login");
      return;
    }

    // Check session expiration
    if (!auth.checkSession()) {
      showToast.info("Your session has expired. Please sign in again.");
      router.replace("/login");
    }
  }, [auth.hydrated, auth.isAuthenticated, auth.checkSession, router, message]);

  return auth;
}
