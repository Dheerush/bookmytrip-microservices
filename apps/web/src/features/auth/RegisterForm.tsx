"use client";

import AuthFormWrapper from "@/components/auth/AuthFormWrapper/AuthFormWrapper";
import ButtonLoader from "@/components/ui/ButtonLoader/ButtonLoader";
import styles from "./AuthForms.module.scss";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister, useRequestVerification } from "@/hooks/auth";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const [verifyEmail, setVerifyEmail]     = useState("");
  const [showVerify, setShowVerify]       = useState(false);

  const { handleRegister, loading } = useRegister();
  const { handleRequestVerification, loading: verifyLoading } = useRequestVerification();

  const goToOtp = (sessionToken: string, emailForDisplay: string) => {
    sessionStorage.setItem("otp_session_token", sessionToken);
    sessionStorage.setItem("otp_email_display", emailForDisplay);
    router.replace(`/otp?sessionToken=${encodeURIComponent(sessionToken)}`);
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleRegister({
      fullName: name.trim(),
      phone: phone.trim() || undefined,
      email,
      password,
    });
    if (!result) return; // hook already showed toast

    const sessionToken = result?.data?.sessionToken;
    if (sessionToken) {
      goToOtp(sessionToken, email);
    }
  };

  // ── Request verification for existing unverified account ─────────────────
  const onRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyEmail.trim()) return;

    const sessionToken = await handleRequestVerification(verifyEmail.trim());
    if (sessionToken) {
      goToOtp(sessionToken, verifyEmail.trim());
    }
  };

  return (
    <AuthFormWrapper
      title="Create Account"
      subtitle="Start your journey with BookMyTrip."
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      {/* ── Main registration form ── */}
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          className={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number (optional)"
          className={styles.input}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email address"
          className={styles.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <ButtonLoader
          type="submit"
          className={styles.button}
          loading={loading}
          loadingText="Please Wait..."
        >
          Create Account
        </ButtonLoader>
      </form>

      {/* ── Verify existing unverified account ── */}
      <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e5e7eb", paddingTop: "1.2rem" }}>
        <button
          type="button"
          onClick={() => setShowVerify((v) => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.82rem", color: "#6b7f93",
            padding: 0, textAlign: "left",
          }}
        >
          Already registered but not verified?{" "}
          <span style={{ color: "#3b9edd", fontWeight: 500 }}>
            {showVerify ? "Hide" : "Verify your email →"}
          </span>
        </button>

        {showVerify && (
          <form onSubmit={onRequestVerification} style={{ marginTop: "0.85rem" }}>
            <input
              type="email"
              placeholder="Enter your registered email"
              className={styles.input}
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              required
            />
            <ButtonLoader
              type="submit"
              className={styles.button}
              loading={verifyLoading}
              loadingText="Please Wait..."
              style={{ marginTop: "0.5rem" }}
            >
              Send Verification OTP
            </ButtonLoader>
          </form>
        )}
      </div>
    </AuthFormWrapper>
  );
}