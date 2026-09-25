import distance from "@turf/distance";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutCartItem } from "@/lib/cart/queries";
import type { ShippingDetails } from "@/lib/orders/queries";

const BASE_SHIPMENT_CENTS = 599;
const CENTS_PER_KILOMETER = 8;
const MAX_SHIPMENT_CENTS = 3999;

export interface ShippingQuote {
  brandId: string;
  brandName: string;
  distanceKilometers: number;
  amountCents: number;
}

interface BrandOriginRow {
  brand_uuid: string;
  company_name: string;
  shipping_address: string | null;
  shipping_longitude: number | null;
  shipping_latitude: number | null;
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${field}`);
  }
  return value.trim();
}

export function parseShippingDetails(value: unknown): ShippingDetails {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    shippingName: requireText(input.shippingName, "shippingName"),
    shippingAddress: requireText(input.shippingAddress, "shippingAddress"),
    shippingCity: requireText(input.shippingCity, "shippingCity"),
    shippingRegion: requireText(input.shippingRegion, "shippingRegion"),
    shippingPostalCode: requireText(input.shippingPostalCode, "shippingPostalCode"),
    shippingCountry: requireText(input.shippingCountry, "shippingCountry"),
  };
}

export async function geocodeAddress(query: string) {
  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Mapbox is not configured for shipping quotes.");
  }

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "address");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not verify the delivery address.");

  const result = (await response.json()) as { features?: Array<{ center?: [number, number] }> };
  const center = result.features?.[0]?.center;
  if (!center) throw new Error("Select a complete delivery address before continuing.");

  return { longitude: center[0], latitude: center[1] };
}

export async function calculateShippingQuotesForBrands(
  adminClient: SupabaseClient,
  brandIds: string[],
  destination: { longitude: number; latitude: number }
) {
  const uniqueBrandIds = [...new Set(brandIds)];
  const { data, error } = await adminClient
    .from("brands")
    .select("brand_uuid, company_name, shipping_address, shipping_longitude, shipping_latitude")
    .in("brand_uuid", uniqueBrandIds);

  if (error) throw error;

  const origins = (data ?? []) as BrandOriginRow[];
  const missingOrigin = uniqueBrandIds.find((brandId) => {
    const origin = origins.find((row) => row.brand_uuid === brandId);
    return !origin?.shipping_address || origin.shipping_longitude === null || origin.shipping_latitude === null;
  });
  if (missingOrigin) {
    throw new Error("This item is temporarily unavailable because the brand has no shipping address.");
  }

  const quotes = origins.map((origin): ShippingQuote => {
    const distanceKilometers = distance(
      [origin.shipping_longitude!, origin.shipping_latitude!],
      [destination.longitude, destination.latitude],
      { units: "kilometers" }
    );
    const amountCents = Math.min(
      MAX_SHIPMENT_CENTS,
      BASE_SHIPMENT_CENTS + Math.round(distanceKilometers * CENTS_PER_KILOMETER)
    );

    return {
      brandId: origin.brand_uuid,
      brandName: origin.company_name,
      distanceKilometers: Math.round(distanceKilometers),
      amountCents,
    };
  });

  return {
    destination,
    quotes,
    shippingCents: quotes.reduce((sum, quote) => sum + quote.amountCents, 0),
  };
}

export async function calculateShippingQuotes(
  adminClient: SupabaseClient,
  items: CheckoutCartItem[],
  shipping: ShippingDetails
) {
  const destination = await geocodeAddress([
    shipping.shippingAddress,
    shipping.shippingCity,
    shipping.shippingRegion,
    shipping.shippingPostalCode,
    shipping.shippingCountry,
  ].join(", "));
  const brandIds = [...new Set(items.map((item) => item.brandId))];
  return calculateShippingQuotesForBrands(adminClient, brandIds, destination);
}