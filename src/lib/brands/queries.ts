import type { SupabaseClient } from "@supabase/supabase-js";
import type { Brand } from "@/types/brand";

export async function getBrandBySlug(supabase: SupabaseClient, slug: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
   
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data as Brand | null;
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

  return (data ?? []) as Brand[];
}