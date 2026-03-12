"use client"

import AuthFormWrapper from "@/components/auth/AuthFormWrapper/AuthFormWrapper"
import ButtonLoader from "@/components/ui/ButtonLoader/ButtonLoader"
import styles from "./AuthForms.module.scss"
import { useState } from "react";
import { useLogin } from "@/hooks/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { handleLogin, loading } = useLogin();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin({ email, password });
  };

  return (
    <AuthFormWrapper
      title="Welcome Back"
      subtitle="Login to continue your journey."
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkText="Register"
    >
      <form onSubmit={onSubmit}>
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
          Login
        </ButtonLoader>
      </form>
    </AuthFormWrapper>
  );
}