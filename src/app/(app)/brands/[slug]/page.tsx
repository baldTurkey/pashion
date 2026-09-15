import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandBySlug } from "@/lib/brands/queries";
import { Card } from "@/components/ui/card";

interface BrandProfilePageProps {
  params: Promise<{ slug: string }>;
}

type BrandListing = {
  id: number;
  product_id: string | null;
  name: string | null;
  imageUrl: string | null;
  currentPrice: string | null;
};

export default async function BrandProfilePage({ params }: BrandProfilePageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();
  const brand = await getBrandBySlug(supabase, slug);

  // notFound() stops rendering this page and tells Next.js to render the
  // nearest not-found.tsx instead (src/app/not-found.tsx) 
  if (!brand) {
    notFound();
  }

  const { data: listings } = await supabase
    .from("products")
    .select("id, product_id, name, imageUrl, currentPrice")
    .eq("brand_id", brand.brand_uuid)
    .eq("listing_status", "published")
    .order("created_at", { ascending: false })
    .returns<BrandListing[]>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Card className="p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-blush">
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={brand.company_name}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif text-3xl text-brand-olive-dark">
                {brand.company_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl text-brand-ink">{brand.company_name}</h1>
          {brand.style && (
            <p className="text-xs uppercase tracking-wide text-brand-accent">{brand.style}</p>
          )}
        </div>

        {brand.about && (
          <p className="mt-6 text-center text-brand-ink/80">{brand.about}</p>
        )}

        <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-brand-ink/10 pt-6 sm:grid-cols-2">
          {brand.contact_info?.location && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-ink/50">Location</dt>
              <dd className="text-brand-ink">{brand.contact_info.location}</dd>
            </div>
          )}
          {brand.website && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-ink/50">Website</dt>
              <dd>
                <a href={brand.website} className="text-brand-accent hover:underline" target="_blank" rel="noreferrer">
                  {brand.website}
                </a>
              </dd>
            </div>
          )}
          {brand.shipping_range && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-ink/50">Ships to</dt>
              <dd className="text-brand-ink">{brand.shipping_range}</dd>
            </div>
          )}
        </dl>
      </Card>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl text-brand-ink">Shop {brand.company_name}</h2>
          <p className="text-sm text-brand-ink/60">
            {listings?.length ?? 0} item{listings?.length === 1 ? "" : "s"}
          </p>
        </div>

        {!listings || listings.length === 0 ? (
          <Card className="p-8 text-center text-brand-ink/60">
            {brand.company_name} hasn&apos;t posted any listings yet.
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/shop/${listing.product_id ?? listing.id}`}
                className="group overflow-hidden rounded-xl border border-brand-ink/10 bg-white transition-shadow hover:shadow-md"
              >
                <div className="aspect-[3/4] overflow-hidden bg-brand-blush">
                  {listing.imageUrl ? (
                    <Image
                      src={listing.imageUrl}
                      alt={listing.name ?? "Listing"}
                      width={300}
                      height={400}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-ink/40">
                      No photo
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-brand-ink">{listing.name}</p>
                  {listing.currentPrice && (
                    <p className="text-sm text-brand-ink/70">${Number(listing.currentPrice).toFixed(2)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
