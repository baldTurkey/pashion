import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "@/types/cart";

// Shape Supabase gives back for a cart row with its joined listing + brand.
interface CartItemRow {
  id: string;
  quantity: number;
  saved_for_later: boolean;
  listings: {
    name: string;
    price_cents: number;
    size: string | null;
    brands: { company_name: string } | null;
  } | null;
}

// Converts one DB row into the CartItem shape the UI components expect.
function toCartItem(row: CartItemRow): CartItem | null {
  if (!row.listings) return null; // listing was deleted out from under this cart row

  return {
    id: row.id,
    name: row.listings.name,
    brandName: row.listings.brands?.company_name ?? "Unknown brand",
    size: row.listings.size ?? "",
    price: row.listings.price_cents / 100,
    quantity: row.quantity,
    savedForLater: row.saved_for_later,
  };
}

export async function getCartItems(supabase: SupabaseClient, customerId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, quantity, saved_for_later, listings(name, price_cents, size, brands(company_name))")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as CartItemRow[])
    .map(toCartItem)
    .filter((item): item is CartItem => item !== null);
}

// Raw shape for checkout — unlike getCartItems, this keeps listing_id and
// brand_id (needed to build order_items and group by brand for payouts) and
// skips items saved for later.
export interface CheckoutCartItem {
  cartItemId: string;
  listingId: string;
  brandId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

interface CheckoutCartItemRow {
  id: string;
  quantity: number;
  listings: { id: string; name: string; price_cents: number; brand_id: string } | null;
}

export async function getActiveCartItemsForCheckout(
  supabase: SupabaseClient,
  customerId: string
): Promise<CheckoutCartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, quantity, listings(id, name, price_cents, brand_id)")
    .eq("customer_id", customerId)
    .eq("saved_for_later", false);

  if (error) throw error;

  return ((data ?? []) as unknown as CheckoutCartItemRow[])
    .filter((row): row is CheckoutCartItemRow & { listings: NonNullable<CheckoutCartItemRow["listings"]> } =>
      Boolean(row.listings)
    )
    .map((row) => ({
      cartItemId: row.id,
      listingId: row.listings.id,
      brandId: row.listings.brand_id,
      name: row.listings.name,
      unitPriceCents: row.listings.price_cents,
      quantity: row.quantity,
    }));
}

export async function addCartItem(
  supabase: SupabaseClient,
  customerId: string,
  listingId: string,
  quantity = 1
) {
  const { error } = await supabase
    .from("cart_items")
    .upsert(
      { customer_id: customerId, listing_id: listingId, quantity },
      { onConflict: "customer_id,listing_id" }
    );

  if (error) throw error;
}

export async function updateCartItem(
  supabase: SupabaseClient,
  customerId: string,
  cartItemId: string,
  changes: { quantity?: number; savedForLater?: boolean }
) {
  const update: Record<string, unknown> = {};
  if (changes.quantity !== undefined) update.quantity = changes.quantity;
  if (changes.savedForLater !== undefined) update.saved_for_later = changes.savedForLater;

  const { error } = await supabase
    .from("cart_items")
    .update(update)
    .eq("id", cartItemId)
    .eq("customer_id", customerId);

  if (error) throw error;
}

export async function removeCartItem(supabase: SupabaseClient, customerId: string, cartItemId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("customer_id", customerId);

  if (error) throw error;
}
