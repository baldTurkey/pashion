"use client";

import { useState } from "react";
import { MapPin, Save } from "lucide-react";
import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import { supabaseBrowser } from "@/lib/supabase/client";

interface ShippingOriginFormProps {
  brandId: string;
  initialAddress: string;
  initialLongitude: number | null;
  initialLatitude: number | null;
  initialCountryCode: string | null;
}

function parseContactInfo(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function ShippingOriginForm({
  brandId,
  initialAddress,
  initialLongitude,
  initialLatitude,
  initialCountryCode,
}: ShippingOriginFormProps) {
  const [address, setAddress] = useState(initialAddress);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude);
  const [latitude, setLatitude] = useState<number | null>(initialLatitude);
  const [countryCode, setCountryCode] = useState<string | null>(initialCountryCode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!address.trim() || longitude === null || latitude === null) {
      setError("Select a complete address from the suggestions.");
      return;
    }

    setSaving(true);
    try {
      const { data: brand, error: fetchError } = await supabaseBrowser
        .from("brands")
        .select("contact_info")
        .eq("brand_uuid", brandId)
        .single();
      if (fetchError) throw fetchError;

      const { error: updateError } = await supabaseBrowser
        .from("brands")
        .update({
          shipping_address: address.trim(),
          shipping_longitude: longitude,
          shipping_latitude: latitude,
          shipping_country_code: countryCode,
          contact_info: {
            ...parseContactInfo(brand.contact_info),
            location: address.trim(),
          },
        })
        .eq("brand_uuid", brandId);
      if (updateError) throw updateError;

      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the shipping origin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mb-6 rounded-lg border border-brand-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="inventory-shipping-origin" className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
            <MapPin size={17} />
            Shipping origin
          </label>
          <AddressAutocomplete
            id="inventory-shipping-origin"
            className="mt-2 min-h-11 w-full rounded-lg border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink"
            value={address}
            onChange={(value) => {
              setAddress(value);
              setLongitude(null);
              setLatitude(null);
              setCountryCode(null);
              setSaved(false);
            }}
            onSelect={(suggestion) => {
              setLongitude(suggestion.longitude);
              setLatitude(suggestion.latitude);
              setCountryCode(suggestion.countryCode);
            }}
            placeholder="Street address, city, state, postal code"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-olive-dark disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save address"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-emerald-700">Shipping origin saved.</p>}
    </form>
  );
}