"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import type { Brand } from "@/types/brand";
import "@/components/mpform.css";
import "./brand-profile-form.css";

const STYLE_OPTIONS = [
  { value: "streetwear", label: "Streetwear" },
  { value: "minimalist", label: "Minimalist" },
  { value: "techwear", label: "Techwear" },
  { value: "retro", label: "Retro" },
  { value: "athleisure", label: "Athleisure" },
  { value: "upcycled", label: "Upcycled" },
  { value: "other", label: "Other" },
];

async function uploadLogo(file: File, accountId: string) {
  const ext = file.name.split(".").pop();
  const path = `${accountId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseBrowser.storage
    .from("brand-logos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabaseBrowser.storage.from("brand-logos").getPublicUrl(path);
  return data.publicUrl;
}

export function BrandProfileForm({ brand }: { brand: Brand }) {
  const router = useRouter();
  const knownStyle = STYLE_OPTIONS.some((opt) => opt.value === brand.style);

  const [companyName, setCompanyName] = useState(brand.company_name ?? "");
  const [style, setStyle] = useState(knownStyle ? brand.style : brand.style ? "other" : "");
  const [customStyle, setCustomStyle] = useState(knownStyle ? "" : brand.style ?? "");
  const [about, setAbout] = useState(brand.about ?? "");
  const [website, setWebsite] = useState(brand.website ?? "");
  const [location, setLocation] = useState(brand.shipping_address ?? brand.contact_info?.location ?? "");
  const [shippingLongitude, setShippingLongitude] = useState<number | null>(brand.shipping_longitude);
  const [shippingLatitude, setShippingLatitude] = useState<number | null>(brand.shipping_latitude);
  const [shippingCountryCode, setShippingCountryCode] = useState<string | null>(brand.shipping_country_code);
  const [shippingRange, setShippingRange] = useState(brand.shipping_range ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(brand.logo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let logoUrl = brand.logo;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, brand.account_id);
      }

      const resolvedStyle = style === "other" ? customStyle.trim() : style;
      const trimmedWebsite = website.trim();
      const trimmedCompanyName = companyName.trim();

      if (!location.trim() || shippingLongitude === null || shippingLatitude === null) {
        throw new Error("Select a complete shipping origin from the address suggestions.");
      }

      const { error: updateError } = await supabaseBrowser
        .from("brands")
        .update({
          company_name: trimmedCompanyName,
          style: resolvedStyle,
          about: about.trim(),
          website: trimmedWebsite,
          shipping_range: shippingRange.trim() || null,
          shipping_address: location.trim(),
          shipping_longitude: shippingLongitude,
          shipping_latitude: shippingLatitude,
          shipping_country_code: shippingCountryCode,
          logo: logoUrl,
          contact_info: {
            ...brand.contact_info,
            location: location.trim(),
            website: trimmedWebsite,
            company_name: trimmedCompanyName,
          },
        })
        .eq("account_id", brand.account_id);

      if (updateError) throw updateError;

      setLogoFile(null);
      setSuccess(true);
      // Public profile page and brand card are server-rendered — refresh so
      // navigating to them (or the "View public profile" link) shows the new data.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="bpf-form" onSubmit={handleSubmit}>
      <div className="bpf-logo-row">
        <div className="bpf-logo-preview">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: preview URLs aren't supported by next/image
            <img src={logoPreview} alt={companyName || "Brand logo"} />
          ) : (
            <span>{(companyName || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <label className="bv-btn" htmlFor="bpf-logo">
          Change logo
        </label>
        <input
          id="bpf-logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleLogoChange}
          className="bpf-hidden-input"
        />
      </div>

      <label className="bpf-label" htmlFor="bpf-company">
        Brand name
      </label>
      <input
        id="bpf-company"
        className="mpform-input"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      />

      <label className="bpf-label" htmlFor="bpf-style">
        Style
      </label>
      <select
        id="bpf-style"
        className="mpform-select"
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        required
      >
        <option value="" disabled>
          Select a style
        </option>
        {STYLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {style === "other" && (
        <>
          <label className="bpf-label" htmlFor="bpf-custom-style">
            Describe your style
          </label>
          <input
            id="bpf-custom-style"
            className="mpform-input"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            required
          />
        </>
      )}

      <label className="bpf-label" htmlFor="bpf-about">
        About
      </label>
      <textarea
        id="bpf-about"
        className="mpform-textarea tall"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        placeholder="Tell customers about your brand."
      />

      <label className="bpf-label" htmlFor="bpf-location">
        Shipping origin address
      </label>
      <AddressAutocomplete
        id="bpf-location"
        className="mpform-input"
        value={location}
        onChange={(value) => {
          setLocation(value);
          setShippingLongitude(null);
          setShippingLatitude(null);
          setShippingCountryCode(null);
        }}
        onSelect={(suggestion) => {
          setShippingLongitude(suggestion.longitude);
          setShippingLatitude(suggestion.latitude);
          setShippingCountryCode(suggestion.countryCode);
        }}
        placeholder="Street address, city, state, postal code"
        required
      />
      <p className="bpf-help">Used to calculate shipping at checkout. Select an address from the suggestions.</p>

      <label className="bpf-label" htmlFor="bpf-website">
        Website
      </label>
      <input
        id="bpf-website"
        className="mpform-input"
        type="url"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://"
      />

      <label className="bpf-label" htmlFor="bpf-shipping">
        Ships to
      </label>
      <input
        id="bpf-shipping"
        className="mpform-input"
        value={shippingRange}
        onChange={(e) => setShippingRange(e.target.value)}
        placeholder="e.g. Continental US"
      />

      {error && <p className="bpf-error">{error}</p>}
      {success && !error && <p className="bpf-success">Profile updated.</p>}

      <div className="bpf-actions">
        <button type="submit" className="bv-btn bv-btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
