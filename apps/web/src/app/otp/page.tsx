"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OtpPage from "@/features/auth/OtpPage/OtpPage";

export default function OtpRoute() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token        = sessionStorage.getItem("otp_session_token");
    const storedEmail  = sessionStorage.getItem("otp_email_display") || "";

    if (!token) {
      router.replace("/register");
      return;
    }

    setEmail(storedEmail);
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(140deg,#eef6fc,#f7fbff)"
      }}>
        <p style={{ fontFamily: "Jost,sans-serif", color: "#6b7f93", fontSize: "0.9rem" }}>
          Loading…
        </p>
      </div>
    );
  }

  return <OtpPage email={email} />;
}