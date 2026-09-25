import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutCartItem } from "@/lib/cart/queries";
import type { ShippingQuote } from "@/lib/shipping/calculate";

export interface ShippingDetails {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
}


export async function createPendingOrder(
  adminClient: SupabaseClient,
  customerId: string,
  items: CheckoutCartItem[],
  shipping: ShippingDetails,
  quotes: ShippingQuote[],
  destination: { longitude: number; latitude: number }
) {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const shippingCents = quotes.reduce((sum, quote) => sum + quote.amountCents, 0);

  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      customer_id: customerId,
      status: "pending",
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: subtotalCents + shippingCents,
      shipping_name: shipping.shippingName,
      shipping_address: shipping.shippingAddress,
      shipping_city: shipping.shippingCity,
      shipping_region: shipping.shippingRegion,
      shipping_postal_code: shipping.shippingPostalCode,
      shipping_country: shipping.shippingCountry,
      shipping_longitude: destination.longitude,
      shipping_latitude: destination.latitude,
    })
    .select("id")
    .single();

  if (orderError) throw orderError;

  const chargedBrands = new Set<string>();
  const { error: itemsError } = await adminClient.from("order_items").insert(
    items.map((item) => {
      const shippingCharge = chargedBrands.has(item.brandId)
        ? 0
        : quotes.find((quote) => quote.brandId === item.brandId)?.amountCents ?? 0;
      chargedBrands.add(item.brandId);

      return {
      order_id: order.id,
      product_id: item.productId,
      brand_id: item.brandId,
      product_name: item.name,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
        shipping_cents: shippingCharge,
      };
    })
  );

  if (itemsError) throw itemsError;

  return { orderId: order.id as string, subtotalCents, shippingCents };
}

export async function attachStripeSession(adminClient: SupabaseClient, orderId: string, sessionId: string) {
  const { error } = await adminClient
    .from("orders")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", orderId);

  if (error) throw error;
}

export async function getOrderByStripeSessionId(adminClient: SupabaseClient, sessionId: string) {
  const { data, error } = await adminClient
    .from("orders")
    .select("id, status, customer_id, shipping_cents")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface OrderItemForPayout {
  id: string;
  product_id: string;
  brand_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  shipping_cents: number;
  stripe_transfer_id: string | null;
}

export async function getOrderItems(adminClient: SupabaseClient, orderId: string): Promise<OrderItemForPayout[]> {
  const { data, error } = await adminClient
    .from("order_items")
    .select("id, product_id, brand_id, product_name, unit_price_cents, quantity, shipping_cents, stripe_transfer_id")
    .eq("order_id", orderId);

  if (error) throw error;
  return data ?? [];
}

// Only flips pending -> paid. If the webhook fires twice (Stripe delivers
// "at least once"), the second call matches zero rows and does nothing.
export async function markOrderPaidIfPending(adminClient: SupabaseClient, orderId: string) {
  const { data, error } = await adminClient
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0; // true only the first time this runs for this order
}

export async function recordItemTransfer(adminClient: SupabaseClient, orderItemId: string, transferId: string) {
  const { error } = await adminClient
    .from("order_items")
    .update({ stripe_transfer_id: transferId })
    .eq("id", orderItemId);

  if (error) throw error;
}

// Decrements real inventory (products.stock) once a payment is confirmed.
// No-ops server-side for untracked (NULL stock) products.
export async function decrementProductStock(adminClient: SupabaseClient, productId: string, quantity: number) {
  const { error } = await adminClient.rpc("decrement_product_stock", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) throw error;
}

export interface CustomerOrderItem {
  id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  fulfillment_status: string;
  tracking_number: string | null;
}

export interface CustomerOrder {
  id: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_region: string | null;
  shipping_postal_code: string | null;
  created_at: string;
  order_items: CustomerOrderItem[];
}

// RLS (orders_select_own / order_items_select_own_order) already limits
// this to the signed-in customer's own orders — no extra filter needed
// beyond eq("customer_id", ...), which just avoids an extra round trip.
export async function getOrdersWithItemsForCustomer(
  supabase: SupabaseClient,
  customerId: string
): Promise<CustomerOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal_cents, shipping_cents, total_cents, shipping_name, shipping_address, shipping_city, shipping_region, shipping_postal_code, created_at, order_items(id, product_name, unit_price_cents, quantity, fulfillment_status, tracking_number)"
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as CustomerOrder[];
}

export interface BrandOrderItem {
  id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  shipping_cents: number;
  fulfillment_status: string;
  tracking_number: string | null;
  order: {
    id: string;
    created_at: string;
    shipping_name: string | null;
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_region: string | null;
    shipping_postal_code: string | null;
    shipping_country: string | null;
  } | null;
}

// RLS (order_items_select_own_brand) already limits this to the signed-in
// brand's own items. Only paid orders are real sales — pending ones are
// checkout sessions that never completed.
export async function getOrderItemsForBrand(
  supabase: SupabaseClient,
  brandUuid: string
): Promise<BrandOrderItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "id, product_name, unit_price_cents, quantity, shipping_cents, fulfillment_status, tracking_number, order:orders!inner(id, created_at, status, shipping_name, shipping_address, shipping_city, shipping_region, shipping_postal_code, shipping_country)"
    )
    .eq("brand_id", brandUuid)
    .eq("order.status", "paid")
    .order("id", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as BrandOrderItem[];
}