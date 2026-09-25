import Link from "next/link";
import { redirect } from "next/navigation";
import Mpform from "@/components/mpform";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";

export default async function NewListingPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const brand = await getBrandByAccountId(supabase, user.id);
  if (!brand) redirect("/sign-up/brand");

  const hasShippingOrigin = Boolean(
    brand.shipping_address && brand.shipping_longitude !== null && brand.shipping_latitude !== null
  );

  return (
    <>
      <div style={{ maxWidth: 640, margin: "0 auto 12px" }}>
        <Link href="/dashboard/brand/listings" className="bv-btn">
          &larr; Back to my listings
        </Link>
      </div>
      {hasShippingOrigin ? (
        <Mpform />
      ) : (
        <div className="bv-card" style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 className="bv-page-title">Add a shipping origin first</h1>
          <p>Listings need a verified origin so customers receive an accurate shipping price.</p>
          <Link href="/dashboard/brand/profile" className="bv-btn bv-btn-primary" style={{ marginTop: 16 }}>
            Update brand address
          </Link>
        </div>
      )}
    </>
  );
}