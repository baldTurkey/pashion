import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandBySlug } from "@/lib/brands/queries";
import { Card } from "@/components/ui/card";

interface BrandProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrandProfilePage({ params }: BrandProfilePageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();
  const brand = await getBrandBySlug(supabase, slug);

  // notFound() stops rendering this page and tells Next.js to render the
  // nearest not-found.tsx instead (src/app/not-found.tsx) 
  if (!brand) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
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
    </div>
  );
}