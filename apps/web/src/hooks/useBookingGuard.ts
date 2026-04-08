"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth/context";
import { showToast } from "@/lib/toast";

/**
 * Hook to guard booking/payment actions behind authentication.
 *
 * Usage:
 *   const { guardAction } = useBookingGuard();
 *   <button onClick={() => guardAction(() => proceedToPayment())}>Book Now</button>
 *
 * If not authenticated it shows a toast and redirects to /login.
 * If session expired it logs out and redirects.
 */
export function useBookingGuard() {
  const { isAuthenticated, checkSession, logout } = useAuth();
  const router = useRouter();

  const guardAction = useCallback(
    (action: () => void) => {
      if (!isAuthenticated) {
        showToast.info("Sign in to book");
        router.push("/login");
        return;
      }

      if (!checkSession()) {
        showToast.info("Your session has expired. Please sign in again.");
        logout();
        router.push("/login");
        return;
      }

      action();
    },
    [isAuthenticated, checkSession, logout, router],
  );

  return { guardAction, isAuthenticated };
}
