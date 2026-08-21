"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { supabaseBrowser } from "@/lib/supabase/client";
import styles from "../sign-up/brand/brand-signup.module.css";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(data.email, {
        // Lands on /auth/callback first (exchanges the emailed code for a real
        // session), which then forwards to /reset-password to set a new one.
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });


      if (resetError && resetError.message.toLowerCase().includes("rate limit")) {
        setError("Too many reset attempts were sent recently. Please wait a few minutes and try again.");
      } else {
        setSent(true);
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.card}>
        <h1>Check your email</h1>
        <p className={styles.sub}>
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <p className={styles.footer}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1>Reset your password</h1>
      <p className={styles.sub}>Enter your email and we&apos;ll send you a reset link.</p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            id="email"
            placeholder=" "
            {...register("email", {
              required: "Email is required",
              validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
            })}
          />
          <label htmlFor="email">Email</label>
          {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.btnRow}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </div>
      </form>

      <p className={styles.footer}>
        Remembered it? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
