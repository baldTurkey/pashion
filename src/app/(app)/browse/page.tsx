import { createSupabaseServer } from "@/lib/supabase/server";
import { listLiveListings } from "@/lib/listings/queries";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";

export default async function ShopPage() {
  const supabase = await createSupabaseServer();
  const listings = await listLiveListings(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-serif text-3xl text-brand-ink">Shop</h1>
      <p className="mt-2 text-brand-ink/70">Live listings from every brand on Pashion.</p>

      {listings.length === 0 ? (
        <Card className="mt-8 p-8 text-center">
          <p className="text-brand-ink/70">Nothing live yet — check back soon.</p>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="flex flex-col p-5">
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-brand-blush/40">
                {listing.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.image_url} alt={listing.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-ink/30">
                    No image
                  </div>
                )}
              </div>
              <div className="mt-4 flex-1">
                <p className="text-xs uppercase tracking-wide text-brand-ink/50">{listing.brandName}</p>
                <h2 className="mt-1 font-serif text-lg text-brand-ink">{listing.name}</h2>
                {listing.size && <p className="mt-1 text-sm text-brand-ink/60">Size {listing.size}</p>}
                <p className="mt-2 font-semibold text-brand-ink">${(listing.price_cents / 100).toFixed(2)}</p>
              </div>
              <div className="mt-4">
                <AddToCartButton listingId={listing.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
