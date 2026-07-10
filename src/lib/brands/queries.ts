import type { SupabaseClient } from "@supabase/supabase-js";
import type { Brand } from "@/types/brand";


function parseBrandRow(row: Record<string, unknown>): Brand {
  const rawContactInfo = row.contact_info;
  return {
    ...row,
    contact_info:
      typeof rawContactInfo === "string" ? JSON.parse(rawContactInfo) : rawContactInfo,
  } as Brand;
}

export async function getBrandBySlug(supabase: SupabaseClient, slug: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    // .maybeSingle() returns null when no row matches, instead of throwing like
    // .single() does — that's what lets the profile page call notFound() cleanly
    // for an unknown slug instead of having to catch an error.
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? parseBrandRow(data) : null;
}

// Used by the brand dashboard to look up "does the logged-in user already
// have a brand profile"
export async function getBrandByAccountId(
  supabase: SupabaseClient,
  accountId: string
): Promise<Brand | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? parseBrandRow(data) : null;
}

export async function listBrands(
  supabase: SupabaseClient,
  { limit = 50 }: { limit?: number } = {}
): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(parseBrandRow);
}