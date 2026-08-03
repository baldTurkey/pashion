"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import styles from "./brand-signup.module.css";

interface BrandFormData {
  firstName: string;
  lastName: string;
  companyName: string;
  logo: File | null;
  style: string;
  customStyle?: string;
  description: string;
  location: string;
  website: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export default function BrandSignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedLogoName, setSelectedLogoName] = useState("");
  const isSubmittingRef = useRef(false);
  const devSignupBypass = process.env.NEXT_PUBLIC_DEV_SIGNUP_BYPASS === "true";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BrandFormData>({
    defaultValues: {
      companyName: "",
      location: "",
      website: "",
      style: "",
      description: "",
      logo: null,
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

  const onSubmit = async (data: BrandFormData) => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setError("");
    setLoading(true);

    try {
      const brandStyle = data.style === "other" ? data.customStyle?.trim() || "Other" : data.style;
      const contactInfo = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email,
        location: data.location,
        website: data.website,
        company_name: data.companyName,
      };

      const brandData = {
        about: data.description,
        company_name: data.companyName,
        first_name: data.firstName,
        last_name: data.lastName,
        style: brandStyle,
        website: data.website,
      };

      // Sent as multipart/form-data (not JSON) so the actual logo File can travel
      // with the request — the API route uploads it and stores the resulting URL.
      const buildFormData = (fields: Record<string, string>) => {
        const form = new FormData();
        Object.entries(fields).forEach(([key, value]) => form.append(key, value));
        form.append("brandData", JSON.stringify(brandData));
        form.append("contactInfo", JSON.stringify(contactInfo));
        if (data.logo) {
          form.append("logo", data.logo);
        }
        return form;
      };

      if (devSignupBypass) {
        const response = await fetch("/api/brand-signup", {
          method: "POST",
          body: buildFormData({
            mode: "dev",
            email: data.email,
            password: data.password,
            userMetadata: JSON.stringify({
              role: "Brand",
              first_name: data.firstName,
              last_name: data.lastName,
              phone: data.phone,
            }),
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(result.error || "We could not create your brand account. Please try again.");
          setLoading(false);
          return;
        }

        // Dev bypass creates the account fully confirmed already (no email
        // step), so there's no reason to show the "check your email" page —
        // go straight to the dashboard.
        router.push("/brand/dashboard");
        return;
      }

      const supabase = supabaseBrowser;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "Brand",
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          },
          // Supabase's own server verifies the email link first, then
          // redirects here with a `code` param — /auth/callback exchanges
          // that for a real session before sending the browser onward.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/brand/dashboard`,
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

      // No session exists yet if email confirmation is required, so the API route
      // verifies ownership via userId + email (see /api/brand-signup) rather than a cookie.
      const response = await fetch("/api/brand-signup", {
        method: "POST",
        body: buildFormData({
          userId,
          email: data.email,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "We could not save your brand profile. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/sign-up-success");
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
      <p className={styles.sub}>Brand sign up</p>

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
            {errors.firstName && (
              <span className={styles.fieldError}>{errors.firstName.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              id="lastName"
              placeholder=" "
              {...register("lastName", { required: "Last name is required" })}
            />
            <label htmlFor="lastName">Last Name</label>
            {errors.lastName && (
              <span className={styles.fieldError}>{errors.lastName.message}</span>
            )}
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="companyName"
              placeholder=" "
              {...register("companyName", { required: "Company name is required" })}
            />
            <label htmlFor="companyName">Company Name</label>
            {errors.companyName && (
              <span className={styles.fieldError}>{errors.companyName.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fileLabel} htmlFor="logo">
              Brand Logo
            </label>
            <input
              className={styles.fileInput}
              type="file"
              id="logo"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setValue("logo", file);
                setSelectedLogoName(file?.name ?? "");
              }}
            />
            <span className={styles.helperText}>
              {selectedLogoName ? `Selected: ${selectedLogoName}` : "Optional"}
            </span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <select
            id="style"
            defaultValue=""
            {...register("style", { required: "Please choose a style" })}
          >
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
          <label htmlFor="style">Brand Style</label>
          {errors.style && (
            <span className={styles.fieldError}>{errors.style.message}</span>
          )}
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
            {errors.customStyle && (
              <span className={styles.fieldError}>{errors.customStyle.message}</span>
            )}
          </div>
        )}

        <div className={styles.inputGroup}>
          <textarea
            id="description"
            rows={4}
            placeholder=" "
            {...register("description", { required: "Please tell us about your brand" })}
          />
          <label htmlFor="description">Short brand description</label>
          {errors.description && (
            <span className={styles.fieldError}>{errors.description.message}</span>
          )}
        </div>

        <div className={styles.twoCol}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="location"
              placeholder=" "
              {...register("location")}
            />
            <label htmlFor="location">Location (Mapbox soon)</label>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              id="website"
              placeholder=" "
              {...register("website", {
                validate: (value) =>
                  !value ||
                  /^(https?:\/\/)?(www\.)?[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/i.test(value) ||
                  "Please enter a valid website URL",
              })}
            />
            <label htmlFor="website">Website (optional)</label>
            {errors.website && (
              <span className={styles.fieldError}>{errors.website.message}</span>
            )}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="tel"
            id="phone"
            placeholder=" "
            {...register("phone")}
          />
          <label htmlFor="phone">Phone (optional)</label>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="text"
            id="email"
            placeholder=" "
            {...register("email", {
              required: "Email is required",
              validate: (value) =>
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
            })}
          />
          <label htmlFor="email">Email</label>
          {errors.email && (
            <span className={styles.fieldError}>{errors.email.message}</span>
          )}
        </div>

        <div className={styles.passwordBlock}>
          <div className={`${styles.inputGroup} ${styles.passwordField}`}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder=" "
              {...register("password", {
                required: "Password is required",
                validate: () =>
                  allPasswordReqsMet || "Password does not meet all requirements",
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
            {errors.password && (
              <span className={styles.fieldError}>{errors.password.message}</span>
            )}
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
          {errors.confirmPassword && (
            <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
          )}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.push("/sign-up")}
          >
            Back
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}