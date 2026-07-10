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

  // No session at all — nothing to show, send them to start signing up.
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
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Card className="flex flex-col items-center gap-4 p-8">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-blush">
          {brand.logo ? (
            <Image
              src={brand.logo}
              alt={brand.company_name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-serif text-2xl text-brand-olive-dark">
              {brand.company_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="font-serif text-2xl text-brand-ink">{brand.company_name}</h1>
        <p className="text-brand-ink/70">Welcome back! Your brand is live on Pashion.</p>
        <Link
          href={`/brands/${brand.slug}`}
          className="mt-2 inline-flex rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark"
        >
          View your public profile
        </Link>
      </Card>
    </div>
  );
}