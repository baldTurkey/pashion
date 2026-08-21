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
