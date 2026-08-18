import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutCartItem } from "@/lib/cart/queries";

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
  shipping: ShippingDetails
) {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      customer_id: customerId,
      status: "pending",
      subtotal_cents: subtotalCents,
      shipping_name: shipping.shippingName,
      shipping_address: shipping.shippingAddress,
      shipping_city: shipping.shippingCity,
      shipping_region: shipping.shippingRegion,
      shipping_postal_code: shipping.shippingPostalCode,
      shipping_country: shipping.shippingCountry,
    })
    .select("id")
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await adminClient.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      listing_id: item.listingId,
      brand_id: item.brandId,
      listing_name: item.name,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
    }))
  );

  if (itemsError) throw itemsError;

  return { orderId: order.id as string, subtotalCents };
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
    .select("id, status, customer_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface OrderItemForPayout {
  id: string;
  listing_id: string;
  brand_id: string;
  listing_name: string;
  unit_price_cents: number;
  quantity: number;
  stripe_transfer_id: string | null;
}

export async function getOrderItems(adminClient: SupabaseClient, orderId: string): Promise<OrderItemForPayout[]> {
  const { data, error } = await adminClient
    .from("order_items")
    .select("id, listing_id, brand_id, listing_name, unit_price_cents, quantity, stripe_transfer_id")
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