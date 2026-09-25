"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import { createClient } from "@/lib/supabase/client";
import { parseCustomerContactInfo } from "@/lib/customers/contact-info";
import type { AddressSuggestion } from "@/lib/mapbox/geocode";

interface ProductShippingEstimateProps {
  productId: string;
  initialAddress: string;
  itemPrice: number;
}

export function ProductShippingEstimate({
  productId,
  initialAddress,
  itemPrice,
}: ProductShippingEstimateProps) {
  const supabase = useMemo(() => createClient(), []);
  const [address, setAddress] = useState(initialAddress);
  const [shippingCents, setShippingCents] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address.trim().length < 8) {
      setShippingCents(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setQuoting(true);
      setError(null);
      try {
        const response = await fetch("/api/shipping/product-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, address }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not calculate shipping.");
        setShippingCents(result.shippingCents);
      } catch (quoteError) {
        if (!controller.signal.aborted) {
          setShippingCents(null);
          setError(quoteError instanceof Error ? quoteError.message : "Could not calculate shipping.");
        }
      } finally {
        if (!controller.signal.aborted) setQuoting(false);
      }
    }, 600);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address, productId]);

  const saveAddress = async (value: string, suggestion?: AddressSuggestion) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: fetchError } = await supabase
      .from("customers")
      .select("contact_info")
      .eq("customer_uuid", user.id)
      .maybeSingle();
    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    const contactInfo = parseCustomerContactInfo(data?.contact_info);
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        contact_info: {
          ...contactInfo,
          location: value,
          shipping_city: suggestion?.city ?? contactInfo.shipping_city,
          shipping_region: suggestion?.region ?? contactInfo.shipping_region,
          shipping_postal_code: suggestion?.postcode ?? contactInfo.shipping_postal_code,
          shipping_country: suggestion?.country ?? contactInfo.shipping_country,
        },
      })
      .eq("customer_uuid", user.id);

    if (updateError) setError(updateError.message);
  };

  const shipping = (shippingCents ?? 0) / 100;

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <label htmlFor="product-delivery-address" className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <MapPin size={16} />
        Delivery address
      </label>
      <AddressAutocomplete
        id="product-delivery-address"
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={address}
        onChange={(value) => {
          setAddress(value);
          setShippingCents(null);
        }}
        onBlur={() => void saveAddress(address.trim())}
        onSelect={(suggestion) => {
          setAddress(suggestion.placeName);
          void saveAddress(suggestion.placeName, suggestion);
        }}
        placeholder="Street address, city, postal code"
      />

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Item</span>
          <span>${itemPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Delivery</span>
          <span>{quoting ? "Calculating..." : shippingCents === null ? "Enter address" : `$${shipping.toFixed(2)}`}</span>
        </div>
        {shippingCents !== null && (
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <span>Total</span>
            <span>${(itemPrice + shipping).toFixed(2)}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}