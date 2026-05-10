"use client";

import { useState, useEffect, useRef } from "react";
import type { KeyboardEvent, ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyOtp, useResendOtp } from "@/hooks/auth";
import styles from "./OtpPage.module.scss";

const OTP_LENGTH = 6;

export default function OtpPage({ email }: { email: string }) {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken") || "";
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────
  const [checking, setChecking]       = useState(true);
  const [digits, setDigits]           = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [timer, setTimer]             = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { handleVerify, loading, error: verifyError } = useVerifyOtp();
  const { handleResend: resendOtp, loading: resending } = useResendOtp();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Guard: redirect if no sessionToken ────────────────────────────────
  useEffect(() => {
    if (!sessionToken) {
      router.replace("/register");
      return;
    }
    queueMicrotask(() => {
      setChecking(false);
    });
  }, [sessionToken, router]);

  // ── Auto-focus first box once unblocked ───────────────────────────────
  useEffect(() => {
    if (!checking) {
      inputRefs.current[0]?.focus();
    }
  }, [checking]);

  // ── Countdown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const focusBox = (idx: number) => {
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, idx))]?.focus();
  };

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    setError(null);
    if (digit && idx < OTP_LENGTH - 1) focusBox(idx + 1);
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else {
        focusBox(idx - 1);
      }
    } else if (e.key === "ArrowLeft")  { focusBox(idx - 1); }
      else if (e.key === "ArrowRight") { focusBox(idx + 1); }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    focusBox(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFilled) return;
    setError(null);
    const ok = await handleVerify({ sessionToken, otp });
    if (ok) {
      setSuccess(true);
    } else {
      setError(verifyError);
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => focusBox(0), 80);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────
  const onResend = async () => {
    setError(null);
    setResendSuccess(false);
    const newToken = await resendOtp(sessionToken);
    if (newToken) {
      // Update sessionStorage with new token (backend rotates it)
      sessionStorage.setItem("otp_session_token", newToken);
      setTimer(60);
      setDigits(Array(OTP_LENGTH).fill(""));
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
      focusBox(0);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────
  const otp          = digits.join("");
  const isFilled     = otp.length === OTP_LENGTH;
  const timerDisplay = `0:${String(timer).padStart(2, "0")}`;

  // ── Loading / guard screen ────────────────────────────────────────────
  if (checking) {
    return (
      <div className={styles.page}>
        <div className={styles.blob1} aria-hidden="true" />
        <div className={styles.blob2} aria-hidden="true" />
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <div className={styles.iconRing} />
            <div className={styles.iconInner}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>
          <h2 className={styles.title}>Checking…</h2>
          <p className={styles.subtitle}>Just a moment</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Ambient blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={`${styles.card} ${success ? styles.cardSuccess : ""}`}>

        {/* Icon */}
        <div className={styles.iconWrap}>
          <div className={styles.iconRing} />
          <div className={styles.iconInner}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className={styles.title}>Verify Your Email</h1>
        <p className={styles.subtitle}>
          We sent a 6-digit code to
          <br />
          <span className={styles.emailHighlight}>{email}</span>
        </p>

        {/* Gold rule */}
        <div className={styles.rule} aria-hidden="true">
          <span className={styles.ruleLine} />
          <span className={styles.ruleText}>enter code below</span>
          <span className={styles.ruleLine} />
        </div>

        {/* Form */}
        <form onSubmit={onVerify} noValidate>

          {/* OTP boxes */}
          <div
            className={`${styles.boxes} ${error ? styles.shake : ""}`}
            role="group"
            aria-label="OTP input"
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                className={[
                  styles.box,
                  digit        ? styles.boxFilled  : "",
                  error        ? styles.boxError   : "",
                  success      ? styles.boxSuccess : "",
                ].join(" ")}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                aria-label={`Digit ${idx + 1}`}
                autoComplete="one-time-code"
                style={{ animationDelay: `${idx * 0.07 + 0.3}s` }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorMsg} role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <div className={styles.successMsg} role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              OTP resent successfully
            </div>
          )}

          {/* Resend row */}
          <div className={styles.resendRow}>
            {timer > 0 ? (
              <span className={styles.timerText}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Resend in {timerDisplay}
              </span>
            ) : (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={onResend}
                disabled={resending}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                {resending ? "Sending…" : "Resend Code"}
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={[
              styles.verifyBtn,
              loading ? styles.verifyBtnLoading : "",
              success ? styles.verifyBtnSuccess : "",
            ].join(" ")}
            disabled={loading || !isFilled || success}
          >
            {success ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Verified
              </>
            ) : loading ? (
              <>
                <span className={styles.spinner} />
                Verifying…
              </>
            ) : (
              "Verify & Continue"
            )}
          </button>

        </form>

        {/* Footer */}
        <p className={styles.footerNote}>
          Wrong email?{" "}
          <a href="/register" className={styles.footerLink}>Go back</a>
        </p>

      </div>
    </div>
  );
}