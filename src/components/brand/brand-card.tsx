import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Brand } from "@/types/brand";

export function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/brands/${brand.slug}`}>
      <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-blush">
          {brand.logo ? (
            <Image src={brand.logo} alt={brand.company_name} width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <span className="font-serif text-xl text-brand-olive-dark">
              {brand.company_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-serif text-lg font-semibold text-brand-ink">{brand.company_name}</p>
          {brand.style && (
            <p className="text-xs uppercase tracking-wide text-brand-accent">{brand.style}</p>
          )}
        </div>
        {brand.contact_info?.location && (
          <p className="mt-auto text-sm text-brand-ink/70">{brand.contact_info.location}</p>
        )}
      </Card>
    </Link>
  );
}
