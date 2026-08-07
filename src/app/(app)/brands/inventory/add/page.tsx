import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AddInventoryForm } from "@/components/brand/inventory-forms";

export default async function AddInventoryPage() {
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

  return (
    <AddInventoryForm brandId={brand.brand_uuid} />
  );
}
