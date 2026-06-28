"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import styles from "../sign-up.module.css";

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
    setError("");
    setLoading(true);

    const supabase = createClient();
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.session && authData.user) {
      const { data: Brand } = await supabase
        .from("Brands")
        .insert({
          contact_info: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            email: data.email,
            company_name: data.companyName,
            logo_name: data.logo?.name ?? null,
            style: data.style === "other" ? data.customStyle?.trim() || "Other" : data.style,
            description: data.description,
            location: data.location,
            website: data.website,
          },
        })
        .select("Brand_uuid")
        .single();

      await supabase.from("accounts").insert({
        account_id: authData.user.id,
        account_type: "Brand",
        Brand_id: Brand?.Brand_uuid ?? null,
      });

      router.push("/dashboard/Brand");
      return;
    }

    router.push("/sign-up-success");
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
              type="url"
              id="website"
              placeholder=" "
              {...register("website")}
            />
            <label htmlFor="website">Website (optional)</label>
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
            type="email"
            id="email"
            placeholder=" "
            {...register("email", { required: "Email is required" })}
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