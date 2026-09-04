import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "@/types/cart";

// products.currentPrice is stored as a free-text dollar string (e.g. "24.80"),
// not integer cents like the rest of this app's money handling — convert at
// the boundary so nothing downstream has to know about that.
function dollarsToCents(value: string | number | null | undefined): number {
  const dollars = typeof value === "number" ? value : parseFloat(value ?? "0");
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
}

// Shape Supabase gives back for a cart row with its joined product + brand.
interface CartItemRow {
  id: string;
  quantity: number;
  saved_for_later: boolean;
  products: {
    name: string;
    currentPrice: string | number | null;
    size: string | null;
    brands: { company_name: string } | null;
  } | null;
}

// Converts one DB row into the CartItem shape the UI components expect.
function toCartItem(row: CartItemRow): CartItem | null {
  if (!row.products) return null; // product was deleted out from under this cart row

  return {
    id: row.id,
    name: row.products.name,
    brandName: row.products.brands?.company_name ?? "Unknown brand",
    size: row.products.size ?? "",
    price: dollarsToCents(row.products.currentPrice) / 100,
    quantity: row.quantity,
    savedForLater: row.saved_for_later,
  };
}

export async function getCartItems(supabase: SupabaseClient, customerId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select('id, quantity, saved_for_later, products("name", "currentPrice", "size", brands(company_name))')
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as CartItemRow[])
    .map(toCartItem)
    .filter((item): item is CartItem => item !== null);
}

// Raw shape for checkout — unlike getCartItems, this keeps productId and
// brandId (needed to build order_items and group by brand for payouts) and
// skips items saved for later.
export interface CheckoutCartItem {
  cartItemId: string;
  productId: string;
  brandId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

interface CheckoutCartItemRow {
  id: string;
  quantity: number;
  products: { product_id: string; name: string; currentPrice: string | number | null; brand_id: string } | null;
}

export async function getActiveCartItemsForCheckout(
  supabase: SupabaseClient,
  customerId: string
): Promise<CheckoutCartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select('id, quantity, products(product_id, "name", "currentPrice", brand_id)')
    .eq("customer_id", customerId)
    .eq("saved_for_later", false);

  if (error) throw error;

  return ((data ?? []) as unknown as CheckoutCartItemRow[])
    .filter((row): row is CheckoutCartItemRow & { products: NonNullable<CheckoutCartItemRow["products"]> } =>
      Boolean(row.products)
    )
    .map((row) => ({
      cartItemId: row.id,
      productId: row.products.product_id,
      brandId: row.products.brand_id,
      name: row.products.name,
      unitPriceCents: dollarsToCents(row.products.currentPrice),
      quantity: row.quantity,
    }));
}

export async function addCartItem(
  supabase: SupabaseClient,
  customerId: string,
  productId: string,
  quantity = 1
) {
  const { error } = await supabase
    .from("cart_items")
    .upsert(
      { customer_id: customerId, product_id: productId, quantity },
      { onConflict: "customer_id,product_id" }
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
