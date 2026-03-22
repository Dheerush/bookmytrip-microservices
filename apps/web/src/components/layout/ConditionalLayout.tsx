"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar/Navbar";
// import Footer from "@/components/layout/Footer/Footer"; // uncomment when ready

// Pages that should NOT have the Navbar / Footer
const HIDDEN_NAV_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/otp", "/dashboard"];

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = HIDDEN_NAV_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <>
      {!hideNav && <Navbar />}
      {children}
      {/* {!hideNav && <Footer />} */}
    </>
  );
}