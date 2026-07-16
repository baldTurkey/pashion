import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";
import { Card } from "@/components/ui/card";

export default async function BrandDashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session at all, nothing to show, send them to start signing up.
  if (!user) {
    redirect("/sign-up/brand");
  }

  const brand = await getBrandByAccountId(supabase, user.id);

  // this is the "finish your profile"
  // fallback from the plan: it covers the case where signUp() succeeded but
  // the follow-up /api/brand-signup call never completed.
  if (!brand) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Card className="p-8">
          <h1 className="font-serif text-2xl text-brand-ink">Finish your profile</h1>
          <p className="mt-2 text-brand-ink/70">
            Your account was created, but we don&apos;t have your brand details yet.
            Please try signing up again to finish setting up your profile.
          </p>
          <Link
            href="/sign-up/brand"
            className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark"
          >
            Finish signing up
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Card className="p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-blush">
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.company_name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-serif text-xl text-brand-olive-dark">
                  {brand.company_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">Brand Dashboard</p>
              <h1 className="mt-1 font-serif text-3xl text-brand-ink">{brand.company_name}</h1>
            </div>
          </div>
          <Link
            href="/brand/dashboard/listings/new"
            className="inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-olive-dark"
          >
            Create Listing
          </Link>
        </div>

        <section className="rounded-2xl border border-brand-ink/10 bg-brand-cream p-6">
          <h2 className="font-serif text-xl text-brand-ink">Current Collection</h2>
          <p className="mt-2 text-sm text-brand-ink/70">
            Live Listings, Marketplace, and Shows all come from the same place you manage your brand.
          </p>
          {/* Honest zeros, not sample data — there's no listings/shows table yet
              (that's the Marketplace milestone), so this reflects the real,
              empty state rather than Shorya's placeholder demo numbers. */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-brand-ink/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-brand-ink/50">Live Listings</p>
              <p className="mt-1 text-2xl font-semibold text-brand-ink">0</p>
            </div>
            <div className="rounded-xl border border-brand-ink/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-brand-ink/50">Drafts</p>
              <p className="mt-1 text-2xl font-semibold text-brand-ink">0</p>
            </div>
            <div className="rounded-xl border border-brand-ink/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-brand-ink/50">Shows Posted</p>
              <p className="mt-1 text-2xl font-semibold text-brand-ink">0</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            href="/brand/dashboard/listings/new"
            className="rounded-2xl border border-brand-ink/10 p-5 text-left transition hover:bg-brand-blush/40"
          >
            <p className="font-semibold text-brand-ink">Create Listing</p>
            <p className="mt-1 text-sm text-brand-ink/60">List a clothing item for the marketplace.</p>
          </Link>
          <Link
            href="/brand/dashboard/listings"
            className="rounded-2xl border border-brand-ink/10 p-5 text-left transition hover:bg-brand-blush/40"
          >
            <p className="font-semibold text-brand-ink">Manage Listings</p>
            <p className="mt-1 text-sm text-brand-ink/60">Edit or review everything you've listed.</p>
          </Link>
          <Link
            href="/brand/dashboard/shows/new"
            className="rounded-2xl border border-brand-ink/10 p-5 text-left transition hover:bg-brand-blush/40"
          >
            <p className="font-semibold text-brand-ink">Post a Show</p>
            <p className="mt-1 text-sm text-brand-ink/60">Launch a design contest for the community.</p>
          </Link>
        </section>

        <div className="mt-6 text-center">
          <Link href={`/brands/${brand.slug}`} className="text-sm text-brand-accent hover:underline">
            View your public profile →
          </Link>
        </div>
      </Card>
    </div>
  );
}