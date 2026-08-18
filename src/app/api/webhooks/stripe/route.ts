import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getOrderByStripeSessionId, getOrderItems, markOrderPaidIfPending, recordItemTransfer } from "@/lib/orders/queries";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";

// Stripe calls this directly (not the browser), so it's the one place we can
// trust that money actually moved. Two events handled:
//  - checkout.session.completed: mark the order paid, decrement inventory,
//    clear the cart, send the confirmation email, and pay out each brand's
//    share.
//  - account.updated: keep brands.stripe_payouts_enabled in sync with the
//    connected account's real onboarding status.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text(); // must read raw text, not .json() — the signature is computed over the exact bytes

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const order = await getOrderByStripeSessionId(adminClient, session.id);

    if (!order) {
      // Nothing we can do with an order we don't recognize — ack anyway so
      // Stripe stops retrying.
      return NextResponse.json({ received: true });
    }

    // Fulfillment: happens exactly once, gated on the pending -> paid flip.
    const isFirstTime = await markOrderPaidIfPending(adminClient, order.id);

    if (isFirstTime) {
      const items = await getOrderItems(adminClient, order.id);

      // Decrement stock for each purchased listing.
      for (const item of items) {
        await adminClient.rpc("decrement_listing_inventory", {
          p_listing_id: item.listing_id,
          p_quantity: item.quantity,
        });
      }

      // Cart is now an order — clear it.
      await adminClient.from("cart_items").delete().eq("customer_id", order.customer_id);

      // Confirmation email — sent from here (not the success page) because
      // this webhook is the only step guaranteed to run once payment is
      // real. Deliberately not gated on payouts below succeeding: the
      // customer's purchase is real regardless of how brand transfers go.
      const { data: userLookup } = await adminClient.auth.admin.getUserById(order.customer_id);
      if (userLookup.user?.email) {
        await sendOrderConfirmationEmail(
          userLookup.user.email,
          order.id,
          items.map((item) => ({
            name: item.listing_name,
            quantity: item.quantity,
            unitPriceCents: item.unit_price_cents,
          }))
        );
      }
    }

    // Payouts: deliberately outside the isFirstTime gate above. A retried
    // delivery of this same event (Stripe retries on a non-2xx) must be able
    // to pick up any transfer that failed last time — isFirstTime would be
    // false on a retry and skip this entirely if it lived inside that block.
    // Idempotency here comes from only acting on items still missing a
    // stripe_transfer_id, not from "first delivery of this webhook".
    const items = await getOrderItems(adminClient, order.id);
    const untransferred = items.filter((item) => !item.stripe_transfer_id);

    if (untransferred.length > 0) {
      const totalsByBrand = new Map<string, number>();
      for (const item of untransferred) {
        totalsByBrand.set(
          item.brand_id,
          (totalsByBrand.get(item.brand_id) ?? 0) + item.unit_price_cents * item.quantity
        );
      }

      const brandIds = [...totalsByBrand.keys()];
      const { data: brands } = await adminClient
        .from("brands")
        .select("account_id, stripe_account_id")
        .in("account_id", brandIds);

      let anyTransferFailed = false;

      for (const brand of brands ?? []) {
        if (!brand.stripe_account_id) continue; // shouldn't happen — listings require payouts to be connected

        const amount = totalsByBrand.get(brand.account_id)!;
        const brandItems = untransferred.filter((item) => item.brand_id === brand.account_id);

        try {
          const transfer = await getStripe().transfers.create({
            amount,
            currency: "usd",
            destination: brand.stripe_account_id,
            transfer_group: order.id,
          });

          for (const item of brandItems) {
            await recordItemTransfer(adminClient, item.id, transfer.id);
          }
        } catch (err) {
          // One brand's transfer failing shouldn't block payouts to other
          // brands in the same order. Log and keep going; the 500 below
          // tells Stripe to retry this event, which will naturally pick
          // this brand back up since its items still lack a transfer_id.
          console.error(`Stripe transfer failed for order ${order.id}, brand ${brand.account_id}:`, err);
          anyTransferFailed = true;
        }
      }

      if (anyTransferFailed) {
        return NextResponse.json({ error: "One or more brand transfers failed" }, { status: 500 });
      }
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await adminClient
      .from("brands")
      .update({ stripe_payouts_enabled: account.payouts_enabled ?? false })
      .eq("stripe_account_id", account.id);
  }

  return NextResponse.json({ received: true });
}
