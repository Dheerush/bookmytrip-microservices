"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar/Navbar";
// import Footer from "@/components/layout/Footer/Footer"; // uncomment when ready

// Pages that should NOT have the Navbar / Footer
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/otp"];

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <>
      {!isAuthPage && <Navbar />}
      {children}
      {/* {!isAuthPage && <Footer />} */}
    </>
  );
}