"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import styles from "../sign-up/brand/brand-signup.module.css";

interface LoginFormData {
  email: string;
  password: string;
}

// Matches the `role` value each signup form stores in auth user_metadata

const DASHBOARD_BY_ROLE: Record<string, string> = {
  Brand: "/brand/dashboard",
  Designer: "/designer/dashboard",
  Customer: "/",
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("invalid login credentials")
            ? "Incorrect email or password."
            : authError.message
        );
        setLoading(false);
        return;
      }

      const role = authData.user?.user_metadata?.role as string | undefined;
      router.push(DASHBOARD_BY_ROLE[role ?? ""] ?? "/");
      // Server components (like the dashboards) read the session from
      // cookies at request time — refresh so they pick up the just-created
      // session immediately rather than on some later navigation.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while signing in.");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h1>Welcome back</h1>
      <p className={styles.sub}>Sign in to your account</p>

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

        <div className={`${styles.inputGroup} ${styles.passwordField}`}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder=" "
            {...register("password", { required: "Password is required" })}
          />
          <label htmlFor="password">Password</label>
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.btnRow}>
          <button type="button" className={styles.btnSecondary} onClick={() => router.push("/sign-up")}>
            Create account
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account? <Link href="/sign-up">Sign Up</Link>
      </p>
    </div>
  );
}