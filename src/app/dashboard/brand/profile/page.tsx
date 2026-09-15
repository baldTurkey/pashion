import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";
import { BrandProfileForm } from "@/components/brand/brand-profile-form";

export default async function BrandProfilePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  const brand = await getBrandByAccountId(supabase, user.id);

  if (!brand) {
    redirect("/sign-up/brand");
  }

  return (
    <div>
      <div className="bv-page-header">
        <h1 className="bv-page-title">Profile</h1>
        <Link href={`/brands/${brand.slug}`} className="bv-btn" target="_blank" rel="noreferrer">
          View public profile →
        </Link>
      </div>
      <div className="bv-card">
        <BrandProfileForm brand={brand} />
      </div>
    </div>
  );
}
