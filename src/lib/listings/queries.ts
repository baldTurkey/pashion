import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/types/listing";

export async function getLiveListingById(
  supabase: SupabaseClient,
  id: string
): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "live")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Listing | null;
}

export interface ShopListing extends Listing {
  brandName: string;
}

interface ShopListingRow {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  size: string | null;
  inventory: number;
  image_url: string | null;
  status: "draft" | "live";
  created_at: string;
  brands: { company_name: string } | null;
}

// Every live, in-stock listing across every brand, for the shop page.
export async function listLiveListings(supabase: SupabaseClient): Promise<ShopListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, brands(company_name)")
    .eq("status", "live")
    .gt("inventory", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as ShopListingRow[]).map((row) => ({
    id: row.id,
    brand_id: row.brand_id,
    name: row.name,
    description: row.description,
    price_cents: row.price_cents,
    size: row.size,
    inventory: row.inventory,
    image_url: row.image_url,
    status: row.status,
    created_at: row.created_at,
    brandName: row.brands?.company_name ?? "Unknown brand",
  }));
}
