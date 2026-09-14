import { createClient } from "@/lib/supabase/client";

export async function fetchShows() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch shows.");
  }

  return Array.isArray(data) ? data : [];
}