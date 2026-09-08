import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DraftListings, type DraftListing } from "@/components/brand/draft-listings";
import { Card } from "@/components/ui/card";

export default async function InventoryDraftsPage() {
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

  const { error: materializeError } = await supabase.rpc("materialize_due_inventory_drafts");
  if (materializeError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Card className="p-8 text-center">
          <h1 className="font-serif text-2xl text-brand-ink">Draft listings are being set up</h1>
          <p className="mt-2 text-sm text-brand-ink/70">
            Apply the latest Supabase migration to activate ready-to-sell drafts.
          </p>
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

  const { data: draftData, error: draftError } = await supabase
    .from("products")
    .select("id, name, imageUrl, currentPrice, description, type")
    .eq("brand_id", brand.brand_uuid)
    .eq("listing_status", "draft")
    .order("id", { ascending: false });

  if (draftError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Card className="p-8 text-center">
          <h1 className="font-serif text-2xl text-brand-ink">Draft listings are unavailable</h1>
          <p className="mt-2 text-sm text-brand-ink/70">{draftError.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/60">Inventory</p>
          <h1 className="mt-1 font-serif text-3xl text-brand-ink">Draft Listings</h1>
          <p className="mt-2 text-sm text-brand-ink/70">Approve ready inventory before it appears in your live listings.</p>
        </div>
        <Link
          href="/dashboard/brand/inventory"
          className="inline-flex items-center rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
        >
          Back to Inventory
        </Link>
      </div>
      <DraftListings initialDrafts={(draftData ?? []) as DraftListing[]} />
    </div>
  );
}