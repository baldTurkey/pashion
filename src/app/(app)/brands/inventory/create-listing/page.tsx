import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CreateListingForm, type InventoryDraftItem } from "@/components/brand/inventory-forms";

type InventoryDbRow = {
  id: number | string | null;
  name: string | null;
  imageUrl?: string[] | null;
  currentPrice?: string | null;
  description: string | null;
  size: string | null;
  style: string | null;
  care_info: string | null;
  size_guide_url: string | null;
  type: string | null;
  stock: number | string | null;
  supply?: string[] | null;
};

export default async function InventoryCreateListingPage() {
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

  const { data: inventoryData } = await supabase
    .from("inventory")
    .select("*")
    .eq("brand_id", brand.brand_uuid)
    .order("created_at", { ascending: false });

  const inventoryItems: InventoryDraftItem[] = ((inventoryData ?? []) as InventoryDbRow[]).map((row) => ({
    id: Number(row.id ?? 0),
    name: row.name,
    imageUrl: row.imageUrl ?? null,
    currentPrice: row.currentPrice ?? null,
    description: row.description,
    size: row.size,
    style: row.style,
    care_info: row.care_info,
    size_guide_url: row.size_guide_url,
    type: row.type,
    stock: Number(row.stock ?? 0),
    supply: row.supply ?? null,
  }));

  return (
    <CreateListingForm brandId={brand.brand_uuid} inventoryItems={inventoryItems} />
  );
}
