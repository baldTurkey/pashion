import { createSupabaseServer } from "@/lib/supabase/server";
import { listBrands } from "@/lib/brands/queries";
import { BrandCard } from "@/components/brand/brand-card";

export default async function BrandsDirectoryPage() {
  const supabase = await createSupabaseServer();
  const brands = await listBrands(supabase, { limit: 50 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center font-serif text-3xl text-brand-ink">Designers</h1>
      <p className="mt-2 text-center text-brand-ink/70">
        Meet the brands building with the Pashion community.
      </p>

      {brands.length === 0 ? (
        <p className="mt-12 text-center text-brand-ink/60">
          No brands have joined yet  check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard key={brand.account_id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}