"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, signIn, signUp } from "@/lib/api";
import styles from "./page.module.css";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.push("/");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Prelegal</h1>
        <p className={styles.subheading}>Draft legal agreements in minutes.</p>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={mode === "signin" ? styles.tabActive : styles.tab}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? styles.tabActive : styles.tab}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className={styles.field}>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
