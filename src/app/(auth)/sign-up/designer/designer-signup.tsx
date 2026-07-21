"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import styles from "../brand/brand-signup.module.css";

interface DesignerFormData {
  firstName: string;
  lastName: string;
  artistHandle: string;
  portfolio: string;
  socials: string;
  bio: string;
  style: string;
  customStyle?: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function DesignerSignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isSubmittingRef = useRef(false);
  const devSignupBypass = process.env.NEXT_PUBLIC_DEV_SIGNUP_BYPASS === "true";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DesignerFormData>({
    defaultValues: {
      style: "",
    },
  });

  const password = watch("password") || "";
  const selectedStyle = watch("style") || "";

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const allPasswordReqsMet = Object.values(passwordChecks).every(Boolean);

  const onSubmit = async (data: DesignerFormData) => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setError("");
    setLoading(true);

    try {
      const designerStyle = data.style === "other" ? data.customStyle?.trim() || "Other" : data.style;
      const contactInfo = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email,
        artist_handle: data.artistHandle,
        portfolio: data.portfolio,
        socials: data.socials,
      };

      if (devSignupBypass) {
        const response = await fetch("/api/designer-signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "dev",
            email: data.email,
            password: data.password,
            userMetadata: {
              role: "Designer",
              first_name: data.firstName,
              last_name: data.lastName,
              phone: data.phone,
            },
            designerData: {
              artist_handle: data.artistHandle.trim(),
              portfolio: data.portfolio.trim(),
              socials: data.socials.trim(),
              bio: data.bio.trim(),
              style: designerStyle,
              contact_info: contactInfo,
            },
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(result.error || "We could not create your designer account. Please try again.");
          setLoading(false);
          return;
        }

        router.push("/designer/dashboard");
        return;
      }

      const supabase = supabaseBrowser;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "Designer",
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          },
          // Supabase verifies the email link server-side first, then redirects
          // here with a `code` param — /auth/callback exchanges that for a
          // real session before sending the browser onward (same route the
          // brand signup form uses, just a different `next` target).
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/designer/dashboard`,
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("rate limit")) {
          setError("Too many signup attempts were sent recently. Please wait a few minutes and try again.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;

      if (!userId) {
        setError("Your account was not created correctly. Please try again.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/designer-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          // No session exists yet if email confirmation is required, so the
          // API route verifies ownership via userId + email instead of a cookie.
          email: data.email,
          designerData: {
            artist_handle: data.artistHandle.trim(),
            portfolio: data.portfolio.trim(),
            socials: data.socials.trim(),
            bio: data.bio.trim(),
            style: designerStyle,
            contact_info: contactInfo,
          },
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "We could not save your designer profile. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/designer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while creating your account.");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h1>Create your account</h1>
      <p className={styles.sub}>Designer sign up</p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.twoCol}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="firstName"
              placeholder=" "
              {...register("firstName", { required: "First name is required" })}
            />
            <label htmlFor="firstName">First Name</label>
            {errors.firstName && <span className={styles.fieldError}>{errors.firstName.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              id="lastName"
              placeholder=" "
              {...register("lastName", { required: "Last name is required" })}
            />
            <label htmlFor="lastName">Last Name</label>
            {errors.lastName && <span className={styles.fieldError}>{errors.lastName.message}</span>}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="text"
            id="artistHandle"
            placeholder=" "
            {...register("artistHandle", { required: "Artist handle is required" })}
          />
          <label htmlFor="artistHandle">Artist Handle</label>
          {errors.artistHandle && <span className={styles.fieldError}>{errors.artistHandle.message}</span>}
        </div>

        <div className={styles.twoCol}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="portfolio"
              placeholder=" "
              {...register("portfolio", {
                validate: (value) =>
                  !value || /^(https?:\/\/)?(www\.)?[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/i.test(value) || "Please enter a valid website URL",
              })}
            />
            <label htmlFor="portfolio">Portfolio (optional)</label>
            {errors.portfolio && <span className={styles.fieldError}>{errors.portfolio.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              id="socials"
              placeholder=" "
              {...register("socials")}
            />
            <label htmlFor="socials">Socials (optional)</label>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <select id="style" defaultValue="" {...register("style", { required: "Please choose a style" })}>
            <option value="" disabled>
              Select a style
            </option>
            <option value="streetwear">Streetwear</option>
            <option value="minimalist">Minimalist</option>
            <option value="techwear">Techwear</option>
            <option value="retro">Retro</option>
            <option value="athleisure">Athleisure</option>
            <option value="upcycled">Upcycled</option>
            <option value="other">Other</option>
          </select>
          <label htmlFor="style">Design Style</label>
          {errors.style && <span className={styles.fieldError}>{errors.style.message}</span>}
        </div>

        {selectedStyle === "other" && (
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="customStyle"
              placeholder=" "
              {...register("customStyle", {
                validate: (value) =>
                  selectedStyle !== "other" || value?.trim() !== "" || "Please tell us your style",
              })}
            />
            <label htmlFor="customStyle">Describe your style</label>
            {errors.customStyle && <span className={styles.fieldError}>{errors.customStyle.message}</span>}
          </div>
        )}

        <div className={styles.inputGroup}>
          <textarea
            id="bio"
            rows={4}
            placeholder=" "
            {...register("bio", { required: "Please tell us about yourself" })}
          />
          <label htmlFor="bio">Short bio</label>
          {errors.bio && <span className={styles.fieldError}>{errors.bio.message}</span>}
        </div>

        <div className={styles.inputGroup}>
          <input type="tel" id="phone" placeholder=" " {...register("phone")} />
          <label htmlFor="phone">Phone (optional)</label>
        </div>

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

          <ul className={styles.passwordReqs}>
            <li className={passwordChecks.length ? styles.reqMet : ""}>At least 8 characters</li>
            <li className={passwordChecks.uppercase ? styles.reqMet : ""}>One uppercase letter</li>
            <li className={passwordChecks.lowercase ? styles.reqMet : ""}>One lowercase letter</li>
            <li className={passwordChecks.number ? styles.reqMet : ""}>One number</li>
            <li className={passwordChecks.special ? styles.reqMet : ""}>One special character</li>
          </ul>
        </div>

        <div className={`${styles.inputGroup} ${styles.passwordField}`}>
          <input
            type={showConfirm ? "text" : "password"}
            id="confirmPassword"
            placeholder=" "
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (v) => v === password || "Passwords do not match",
            })}
          />
          <label htmlFor="confirmPassword">Confirm Password</label>
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword.message}</span>}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.btnRow}>
          <button type="button" className={styles.btnSecondary} onClick={() => router.push("/sign-up")}>
            Back
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>

      <p className={styles.footer}>
        Already have an account? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
