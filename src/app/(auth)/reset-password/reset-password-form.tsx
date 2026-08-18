"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabaseBrowser } from "@/lib/supabase/client";
import styles from "../sign-up/brand/brand-signup.module.css";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch("password") || "";

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const allPasswordReqsMet = Object.values(passwordChecks).every(Boolean);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError("");
    setLoading(true);

    try {
      // The session was already established by /auth/callback (it exchanged
      // the emailed code for a real login) — updateUser just needs that
      // session to be active, which it is by the time this page renders.
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password: data.password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push("/login");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h1>Set a new password</h1>
      <p className={styles.sub}>Choose a new password for your account.</p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.passwordBlock}>
          <div className={`${styles.inputGroup} ${styles.passwordField}`}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder=" "
              {...register("password", {
                required: "Password is required",
                validate: () => allPasswordReqsMet || "Password does not meet all requirements",
              })}
            />
            <label htmlFor="password">New Password</label>
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

          <ul className={styles.passwordReqs}>
            <li className={passwordChecks.length ? styles.reqMet : ""}>At least 8 characters</li>
            <li className={passwordChecks.uppercase ? styles.reqMet : ""}>One uppercase letter</li>
            <li className={passwordChecks.lowercase ? styles.reqMet : ""}>One lowercase letter</li>
            <li className={passwordChecks.number ? styles.reqMet : ""}>One number</li>
            <li className={passwordChecks.special ? styles.reqMet : ""}>One special character</li>
          </ul>
        </div>

        <div className={styles.inputGroup}>
          <input
            type={showPassword ? "text" : "password"}
            id="confirmPassword"
            placeholder=" "
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (v) => v === password || "Passwords do not match",
            })}
          />
          <label htmlFor="confirmPassword">Confirm Password</label>
          {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword.message}</span>}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.btnRow}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
