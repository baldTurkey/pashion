import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function InventoryMyListingsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("brand_uuid")
    .eq("account_id", user.id)
    .maybeSingle();

  if (!brand?.brand_uuid) {
    redirect("/sign-up/brand");
  }

  const { data: listings, error } = await supabase
    .from("products")
    .select("id, name, currentPrice, type")
    .eq("brand_id", brand.brand_uuid)
    .eq("listing_status", "published")
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Card className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">My Listings</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-ink">View My Listings</h1>
        <p className="mt-3 text-sm text-brand-ink/70">Published listings visible to customers.</p>

        {listings && listings.length > 0 ? (
          <div className="mt-6 divide-y divide-brand-ink/10 border-y border-brand-ink/10">
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <h2 className="font-semibold text-brand-ink">{listing.name || "Untitled item"}</h2>
                  <p className="mt-1 text-sm text-brand-ink/60">{listing.type || "Product"}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-brand-ink">{listing.currentPrice ? `$${listing.currentPrice}` : "-"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-brand-ink/70">No published listings yet.</p>
        )}

        <Link
          href="/dashboard/brand/inventory"
          className="mt-6 inline-flex rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-olive-dark"
        >
          Back to Inventory
        </Link>
      </Card>
    </div>
  );
}
