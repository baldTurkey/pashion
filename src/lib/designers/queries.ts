import type { SupabaseClient } from "@supabase/supabase-js";
import type { Designer } from "@/types/designer";

// Used by the designer dashboard to look up "does the logged-in user already
// have a designer profile" — .maybeSingle() returns null for no match instead
// of throwing, since that's an expected, normal outcome here (see the
// equivalent getBrandByAccountId in src/lib/brands/queries.ts).
export async function getDesignerByAccountId(
  supabase: SupabaseClient,
  accountId: string
): Promise<Designer | null> {
  const { data, error } = await supabase
    .from("designers")
    .select("*")
    .eq("designer_uuid", accountId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Designer | null;
}
